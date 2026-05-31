import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Download,
  Activity,
  CalendarClock,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'
import { ApplicationStatus } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  ApplicationNoteForm,
  ApplicationStatusSelect,
} from '@/components/organisms/application-status-form'
import { InterviewScheduleForm } from '@/components/organisms/interview-schedule-form'
import { InterviewRowActions } from '@/components/organisms/interview-row-actions'
import { ScorecardSummary } from '@/components/organisms/scorecard-summary'
import { InterviewPipelineView } from '@/components/organisms/interview-pipeline-view'
import { PipelineEditor } from '@/components/organisms/interview-pipeline-editor'
import {
  summarizeApplicationScorecards,
  summarizePipelineByStage,
} from '@/lib/scorecards/queries'
import { getQuestionSetForTenant } from '@/lib/interview-questions/queries'
import { getThreadForApplication } from '@/lib/messaging/queries'
import { ApplicationScreeningBadge } from '@/components/organisms/application-screening-badge'
import { RunScreeningButton } from '@/components/organisms/run-screening-button'
import {
  BREAKDOWN_LABELS,
  BREAKDOWN_MAX,
  type ScreeningBreakdown,
} from '@/lib/applications/screening'

export const metadata = { title: 'Detail Lamaran — Dasbor' }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Dilamar',
  REVIEWED: 'Ditinjau',
  SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Wawancara',
  OFFERED: 'Penawaran',
  HIRED: 'Diterima',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Dibatalkan',
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-slate-100 text-slate-800',
  REVIEWED: 'bg-sky-100 text-sky-800',
  SHORTLISTED: 'bg-indigo-100 text-indigo-800',
  INTERVIEW: 'bg-violet-100 text-violet-800',
  OFFERED: 'bg-amber-100 text-amber-800',
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-zinc-100 text-zinc-800',
}

const SELECT_OPTIONS = (
  [
    'APPLIED',
    'REVIEWED',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFERED',
    'HIRED',
    'REJECTED',
  ] as const
).map((v) => ({ value: v, label: STATUS_LABELS[v] }))

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function metadataPreview(value: unknown): string {
  if (!value) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export default async function TenantApplicationDetailPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/lamaran/${params.id}`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    notFound()
  }
  const canManage = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'job.update',
  )

  const application = await prisma.application
    .findFirst({
      where: { id: params.id, tenantId: tenant.id },
      select: {
        id: true,
        status: true,
        resumeUrl: true,
        coverLetter: true,
        notes: true,
        appliedAt: true,
        updatedAt: true,
        aiScore: true,
        aiTags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            bio: true,
            headline: true,
            location: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            employmentType: true,
            locationType: true,
          },
        },
      },
    })
    .catch(() => null)
  if (!application) notFound()

  const interviews = await prisma.interviewSchedule
    .findMany({
      where: { applicationId: application.id },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        scheduledAt: true,
        durationMin: true,
        type: true,
        meetingUrl: true,
        location: true,
        notes: true,
        status: true,
        stageOrder: true,
        stageName: true,
        scorecard: { select: { id: true } },
      },
    })
    .catch(
      () =>
        [] as Array<{
          id: string
          scheduledAt: Date
          durationMin: number
          type: string
          meetingUrl: string | null
          location: string | null
          notes: string | null
          status: string
          stageOrder: number
          stageName: string | null
          scorecard: { id: string } | null
        }>,
    )

  const scorecardSummary = await summarizeApplicationScorecards(application.id)
  const pipelineSummary = await summarizePipelineByStage(application.id)

  // Suggested-questions block for the "new interview" form. We infer the
  // likely next-stage category from the most recent interview's stageName —
  // Technical → technical, HR / Cultural → behavioral+culture, otherwise mixed.
  let suggestedCategories: string[] | undefined
  if (canManage) {
    const lastStage =
      interviews.length > 0
        ? interviews[interviews.length - 1]?.stageName?.toLowerCase() ?? ''
        : ''
    if (lastStage.includes('technical')) {
      suggestedCategories = ['technical']
    } else if (
      lastStage.includes('hr') ||
      lastStage.includes('cultural') ||
      lastStage.includes('culture')
    ) {
      suggestedCategories = ['behavioral', 'culture']
    }
    // undefined → mixed pick across all categories
  }
  const suggestedQuestions = canManage
    ? await getQuestionSetForTenant({
        tenantId: tenant.id,
        categories: suggestedCategories,
        count: 5,
      })
    : []

  // Pull the latest screening audit row to surface the per-component
  // breakdown chart. We persist score + tags on the Application itself, but
  // the breakdown lives in audit metadata so we don't widen the schema.
  const screeningAudit = await prisma.auditLog
    .findFirst({
      where: {
        tenantId: tenant.id,
        resource: 'application.screening',
        resourceId: application.id,
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true, createdAt: true },
    })
    .catch(() => null)

  function readBreakdown(meta: unknown): ScreeningBreakdown | null {
    if (!meta || typeof meta !== 'object') return null
    const b = (meta as { breakdown?: unknown }).breakdown
    if (!b || typeof b !== 'object') return null
    const keys: Array<keyof ScreeningBreakdown> = [
      'skill',
      'headline',
      'experience',
      'completeness',
      'location',
      'coverLetter',
    ]
    const out = {} as ScreeningBreakdown
    for (const k of keys) {
      const v = (b as Record<string, unknown>)[k]
      out[k] = typeof v === 'number' ? v : 0
    }
    return out
  }
  const screeningBreakdown = readBreakdown(screeningAudit?.metadata)

  // Recruiter-side unread badge for this thread: count messages the recruiter
  // hasn't read yet AND that weren't sent by this viewer.
  const messageThread = await getThreadForApplication(application.id, session.user.id)
  const unreadForRecruiter = messageThread
    ? messageThread.messages.filter(
        (m) => !m.readByRecruiterAt && m.senderId !== session.user.id,
      ).length
    : 0

  const interviewIds = interviews.map((i) => i.id)
  const auditEntries = await prisma.auditLog
    .findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { resource: 'application', resourceId: application.id },
          ...(interviewIds.length > 0
            ? [
                {
                  resource: 'application.interview',
                  resourceId: { in: interviewIds },
                },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    })
    .catch(() => [])

  const tone = STATUS_TONE[application.status]
  const applicantName = application.user.name ?? application.user.email

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/lamaran` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar lamaran
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={
            `/dashboard/tenants/${tenant.slug}/lamaran/${application.id}/pesan` as any
          }
          className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Pesan
          {unreadForRecruiter > 0 && (
            <span
              aria-label={`${unreadForRecruiter} pesan belum dibaca`}
              className="bg-primary text-primary-foreground inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            >
              {Math.min(99, unreadForRecruiter)}
            </span>
          )}
        </Link>
      </div>

      <header className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {application.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={application.user.image}
              alt=""
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <div className="bg-muted size-14 rounded-full" />
          )}
          <div>
            <h1 className="font-heading text-2xl">{applicantName}</h1>
            {application.user.headline && (
              <p className="text-muted-foreground text-sm">
                {application.user.headline}
              </p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Dilamar {dateFmt.format(application.appliedAt)} · Diperbarui{' '}
              {dateFmt.format(application.updatedAt)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-medium ${tone}`}
        >
          {STATUS_LABELS[application.status]}
        </span>
      </header>

      <section
        aria-label="AI screening"
        className="border-border bg-card rounded-2xl border p-6 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg">AI Screening</h2>
            <p className="text-muted-foreground text-xs">
              Skor otomatis berbasis aturan untuk memprioritaskan tinjauan.
              Bukan pengganti penilaian rekruter.
            </p>
          </div>
          {canManage ? (
            <RunScreeningButton
              applicationId={application.id}
              hasScore={application.aiScore !== null}
            />
          ) : null}
        </div>
        <ApplicationScreeningBadge
          score={application.aiScore}
          tags={application.aiTags}
        />
        {screeningBreakdown && application.aiScore !== null ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              Object.keys(screeningBreakdown) as Array<
                keyof ScreeningBreakdown
              >
            ).map((k) => {
              const value = screeningBreakdown[k]
              const max = BREAKDOWN_MAX[k]
              const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {BREAKDOWN_LABELS[k]}
                    </span>
                    <span className="text-foreground font-mono">
                      {value}/{max}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full"
                      style={{ width: `${pct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </section>

      <section
        aria-label="Profil pelamar"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">Profil pelamar</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Mail
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Email</dt>
              <dd>{application.user.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Telepon
              </dt>
              <dd>{application.user.phone ?? '—'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Lokasi
              </dt>
              <dd>{application.user.location ?? '—'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <FileText
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Bio</dt>
              <dd className="whitespace-pre-line">
                {application.user.bio ?? '—'}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <section
        aria-label="Lowongan yang dilamar"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Lowongan</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs uppercase block">
              Judul
            </span>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={
                `/dashboard/tenants/${tenant.slug}/jobs/${application.job.id}` as any
              }
              className="font-medium hover:underline"
            >
              {application.job.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground text-xs uppercase block">
                Lokasi
              </span>
              <span>
                {application.job.location} · {application.job.locationType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase block">
                Tipe kerja
              </span>
              <span>{application.job.employmentType}</span>
            </div>
          </div>
        </div>
      </section>

      {(application.resumeUrl || application.coverLetter) && (
        <section
          aria-label="Berkas lamaran"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">Berkas lamaran</h2>
          {application.resumeUrl && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                Resume
              </span>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-foreground inline-flex items-center gap-2 hover:underline"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh resume
              </a>
            </div>
          )}
          {application.coverLetter && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                Cover letter
              </span>
              <p className="whitespace-pre-line">{application.coverLetter}</p>
            </div>
          )}
        </section>
      )}

      {canManage && (
        <section
          aria-label="Ubah status"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">Status lamaran</h2>
          <p className="text-muted-foreground text-sm">
            Perubahan status akan tercatat di log audit tenant.
          </p>
          <ApplicationStatusSelect
            applicationId={application.id}
            current={application.status}
            options={SELECT_OPTIONS}
            className="max-w-xs"
          />
        </section>
      )}

      {canManage && (
        <section
          aria-label="Catatan rekruter"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">Catatan internal</h2>
          <ApplicationNoteForm
            applicationId={application.id}
            initial={application.notes}
          />
        </section>
      )}

      <ScorecardSummary summary={scorecardSummary} />

      <InterviewPipelineView pipeline={pipelineSummary} />

      <section
        aria-label="Wawancara"
        className="border-border bg-card rounded-2xl border p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Wawancara</h2>
        </div>

        {interviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada wawancara dijadwalkan.
          </p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {interviews.map((iv) => {
              const typeLabel =
                iv.type === 'video'
                  ? 'Video call'
                  : iv.type === 'onsite'
                    ? 'Onsite'
                    : iv.type === 'phone'
                      ? 'Telepon'
                      : iv.type
              const statusLabel =
                iv.status === 'scheduled'
                  ? 'Terjadwal'
                  : iv.status === 'completed'
                    ? 'Selesai'
                    : iv.status === 'cancelled'
                      ? 'Dibatalkan'
                      : iv.status === 'no_show'
                        ? 'Tidak hadir'
                        : iv.status
              const statusTone =
                iv.status === 'scheduled'
                  ? 'bg-violet-100 text-violet-800'
                  : iv.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : iv.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-800'
              return (
                <li key={iv.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {dateFmt.format(iv.scheduledAt)}
                    </span>
                    <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-xs">
                      {typeLabel}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {iv.durationMin} menit
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusTone}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {iv.type === 'video' && iv.meetingUrl && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Tautan: </span>
                      <a
                        href={iv.meetingUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-all hover:underline"
                      >
                        {iv.meetingUrl}
                      </a>
                    </p>
                  )}
                  {iv.type === 'onsite' && iv.location && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Lokasi: </span>
                      {iv.location}
                    </p>
                  )}
                  {iv.notes && (
                    <p className="text-muted-foreground whitespace-pre-line text-xs">
                      {iv.notes}
                    </p>
                  )}
                  {canManage && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={
                          `/dashboard/tenants/${tenant.slug}/lamaran/${application.id}/wawancara/${iv.id}/scorecard` as any
                        }
                        className="border-input text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs"
                      >
                        <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                        {iv.scorecard ? 'Ubah scorecard' : 'Buat scorecard'}
                      </Link>
                    </div>
                  )}
                  {canManage && (
                    <InterviewRowActions
                      applicationId={application.id}
                      interview={{
                        id: iv.id,
                        scheduledAt: iv.scheduledAt,
                        durationMin: iv.durationMin,
                        type: iv.type,
                        meetingUrl: iv.meetingUrl,
                        location: iv.location,
                        notes: iv.notes,
                        status: iv.status,
                        stageOrder: iv.stageOrder,
                        stageName: iv.stageName,
                      }}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {canManage && (
          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-3 text-sm font-medium">
              Jadwalkan wawancara baru
            </h3>
            <InterviewScheduleForm
              applicationId={application.id}
              suggestedQuestions={suggestedQuestions.map((q) => ({
                id: q.id,
                text: q.text,
                category: q.category,
                difficulty: q.difficulty,
              }))}
            />
          </div>
        )}
      </section>

      {canManage && interviews.length > 0 && (
        <PipelineEditor
          applicationId={application.id}
          initialInterviews={interviews.map((iv) => ({
            id: iv.id,
            scheduledAt: iv.scheduledAt,
            type: iv.type,
            status: iv.status,
            stageOrder: iv.stageOrder,
            stageName: iv.stageName,
          }))}
        />
      )}

      <section
        aria-label="Aktivitas terbaru"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Aktivitas terbaru</h2>
        </div>
        {auditEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada catatan aktivitas untuk lamaran ini.
          </p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {auditEntries.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-muted text-foreground rounded-full px-2 py-0.5 font-mono text-xs">
                    {e.action}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {dateFmt.format(e.createdAt)}
                  </span>
                  {e.user && (
                    <span className="text-muted-foreground text-xs">
                      · {e.user.name ?? e.user.email}
                    </span>
                  )}
                </div>
                {Boolean(e.metadata) && (
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    {metadataPreview(e.metadata)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
