import Image from 'next/image'
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
  XCircle,
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
import { SyncInterviewButton } from '@/components/organisms/sync-interview-button'
import { ScorecardSummary } from '@/components/organisms/scorecard-summary'
import { InterviewScorecardSummary } from '@/components/organisms/interview-scorecard-summary'
import { InterviewPipelineView } from '@/components/organisms/interview-pipeline-view'
import { PipelineEditor } from '@/components/organisms/interview-pipeline-editor'
import {
  summarizeApplicationScorecards,
  summarizePipelineByStage,
} from '@/lib/scorecards/queries'
import { getQuestionSetForTenant } from '@/lib/interview-questions/queries'
import { getApplicationAnswers } from '@/lib/jobs/question-queries'
import type { JobQuestionType } from '@/lib/jobs/question-constants'
import { getThreadForApplication } from '@/lib/messaging/queries'
import { ApplicationScreeningBadge } from '@/components/organisms/application-screening-badge'
import { RunScreeningButton } from '@/components/organisms/run-screening-button'
import {
  BREAKDOWN_LABELS,
  BREAKDOWN_MAX,
  type ScreeningBreakdown,
} from '@/lib/applications/screening'
import { MatchScoreCard } from '@/components/organisms/match-score-card'
import type { MatchBreakdown } from '@/lib/match/match-scorer'
import { scoreApplicationToJob } from '@/lib/match/match-scorer'
import { ApplicationNotesSection } from '@/components/organisms/application-notes-section'
import type { TenantMember } from '@/components/organisms/notes-composer'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Detail Lamaran — Dasbor' }

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
  const t = await getServerT()
  const ad = t.pagesTenant3.applicationDetail

  const STATUS_LABELS: Record<ApplicationStatus, string> = {
    APPLIED: ad.statusApplied,
    REVIEWED: ad.statusReviewed,
    SHORTLISTED: ad.statusShortlisted,
    INTERVIEW: ad.statusInterview,
    OFFERED: ad.statusOffered,
    HIRED: ad.statusHired,
    REJECTED: ad.statusRejected,
    WITHDRAWN: ad.statusWithdrawn,
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

  function formatAnswerValue(
    value: string,
    type: JobQuestionType,
  ): React.ReactNode {
    if (!value) return <span className="text-muted-foreground italic">—</span>
    switch (type) {
      case 'multi_choice': {
        try {
          const arr = JSON.parse(value)
          if (Array.isArray(arr) && arr.length > 0) {
            return (
              <ul className="list-disc pl-5">
                {arr.map((v: unknown, i: number) => (
                  <li key={i}>{typeof v === 'string' ? v : String(v)}</li>
                ))}
              </ul>
            )
          }
          return <span className="text-muted-foreground italic">—</span>
        } catch {
          return value
        }
      }
      case 'yes_no':
        return value === 'yes' ? ad.answerYes : value === 'no' ? ad.answerNo : value
      case 'file_url':
        return (
          <a
            href={value}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline"
          >
            {ad.answerFileOpen}
          </a>
        )
      case 'long_text':
        return <p className="whitespace-pre-line">{value}</p>
      default:
        return value
    }
  }

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
  // Notes section permissions:
  // - canPinNotes: matches `canManage` (job.update => recruiter+).
  // - canModerateNotes: tenant admin scope (team.remove) — used for delete-anyone.
  const canPinNotes = canManage
  const canModerateNotes = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'team.remove',
  )

  // Pull active tenant members to drive the @mention autocomplete.
  // Limited to active memberships; users without a username are excluded
  // (they can't be mentioned anyway since mentions key on username).
  const tenantMemberRows = await prisma.userTenant
    .findMany({
      where: { tenantId: tenant.id, status: 'active' },
      select: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
      take: 200,
    })
    .catch(
      () =>
        [] as Array<{
          user: { id: string; username: string | null; name: string | null }
        }>,
    )
  const tenantMembers: TenantMember[] = tenantMemberRows
    .filter((r) => Boolean(r.user.username))
    .map((r) => ({
      userId: r.user.id,
      username: r.user.username as string,
      name: r.user.name,
    }))

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
        aiScoreBreakdown: true,
        aiScoredAt: true,
        withdrawnAt: true,
        withdrawReason: true,
        withdrawnBy: { select: { id: true, name: true, email: true } },
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
            description: true,
            requirements: true,
            tags: true,
            location: true,
            employmentType: true,
            locationType: true,
            experienceLevel: true,
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
        calendarEvent: {
          select: { externalEventId: true, htmlLink: true },
        },
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
          calendarEvent: { externalEventId: string; htmlLink: string | null } | null
        }>,
    )

  // Show "Sinkronkan ke Google Calendar" only when the current recruiter has
  // a connected calendar account. We render the button per interview row.
  const viewerCalendarAccount = canManage
    ? await prisma.calendarAccount
        .findFirst({
          where: { userId: session.user.id, provider: 'google' },
          select: { id: true },
        })
        .catch(() => null)
    : null

  const scorecardSummary = await summarizeApplicationScorecards(application.id)
  const pipelineSummary = await summarizePipelineByStage(application.id)
  const customAnswers = await getApplicationAnswers(application.id)

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

  // ---- Match score (separate from legacy AI screening) ----
  // Parse the persisted breakdown if present; otherwise compute an unsaved
  // preview from the current job + resume so the card always has something to
  // show. Notes are derived from the freshly computed result.
  const persistedMatchBreakdown =
    application.aiScoreBreakdown &&
    typeof application.aiScoreBreakdown === 'object'
      ? (application.aiScoreBreakdown as unknown as MatchBreakdown)
      : null

  // Re-run the pure scorer locally — cheap, deterministic, and lets us
  // surface tags+notes even when no breakdown row was persisted yet.
  let matchPreview: ReturnType<typeof scoreApplicationToJob> | null = null
  try {
    const previewResume = await prisma.resume
      .findFirst({
        where: { userId: application.user.id },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { fileUrl: true, content: true },
      })
      .catch(() => null)
    matchPreview = scoreApplicationToJob(
      { coverLetter: application.coverLetter },
      {
        title: application.job.title,
        description: application.job.description,
        requirements: application.job.requirements,
        employmentType: application.job.employmentType,
        experienceLevel: application.job.experienceLevel,
        location: application.job.location,
        locationType: application.job.locationType,
        tags: application.job.tags,
      },
      previewResume ?? undefined,
      { headline: application.user.headline, location: application.user.location },
    )
  } catch (err) {
    console.error('[lamaran/[id]] match preview failed', err)
  }

  const matchBreakdown = persistedMatchBreakdown ?? matchPreview?.breakdown ?? null
  const matchScore = application.aiScore ?? matchPreview?.score ?? null
  const matchTags =
    application.aiTags && application.aiTags.length > 0
      ? application.aiTags
      : matchPreview?.tags ?? []
  const matchNotes = matchPreview?.notes ?? []

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
          {ad.backToList}
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={
            `/dashboard/tenants/${tenant.slug}/lamaran/${application.id}/pesan` as any
          }
          className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {ad.messages}
          {unreadForRecruiter > 0 && (
            <span
              aria-label={ad.unreadAriaLabel.replace('{count}', String(unreadForRecruiter))}
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
            <Image
              src={application.user.image}
              alt=""
              className="size-14 rounded-full object-cover"
              width={56}
              height={56}
              unoptimized
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
              {ad.appliedUpdated
                .replace('{applied}', dateFmt.format(application.appliedAt))
                .replace('{updated}', dateFmt.format(application.updatedAt))}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-medium ${tone}`}
        >
          {STATUS_LABELS[application.status]}
        </span>
      </header>

      {application.withdrawnAt && (
        <section
          aria-label={ad.withdrawnHeading}
          className="border-destructive/40 bg-destructive/5 rounded-2xl border p-5"
        >
          <div className="flex items-start gap-3">
            <XCircle
              className="text-destructive mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 className="text-destructive font-medium">{ad.withdrawnHeading}</h2>
              <p className="text-foreground/80 mt-1 text-sm">
                {ad.withdrawnBody.replace('{date}', dateFmt.format(application.withdrawnAt))}
                {application.withdrawnBy &&
                application.withdrawnBy.id !== application.user.id ? (
                  <>
                    {' '}
                    {ad.withdrawnProcessedBy.replace(
                      '{name}',
                      application.withdrawnBy.name ?? application.withdrawnBy.email,
                    )}
                  </>
                ) : null}
              </p>
              {application.withdrawReason && (
                <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm">
                  {ad.withdrawnReason.replace('{reason}', application.withdrawReason)}
                </p>
              )}
              <p className="text-muted-foreground mt-3 text-xs">
                {ad.withdrawnControlsDisabled}
              </p>
            </div>
          </div>
        </section>
      )}

      <MatchScoreCard
        applicationId={application.id}
        score={matchScore}
        breakdown={matchBreakdown}
        tags={matchTags}
        notes={matchNotes}
        scoredAt={application.aiScoredAt ?? null}
        canManage={canManage}
      />

      <section
        aria-label="AI screening"
        className="border-border bg-card rounded-2xl border p-6 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg">{ad.aiScreeningHeading}</h2>
            <p className="text-muted-foreground text-xs">
              {ad.aiScreeningSubtitle}
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
        aria-label={ad.applicantProfileHeading}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">{ad.applicantProfileHeading}</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Mail
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">{ad.labelEmail}</dt>
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
                {ad.labelPhone}
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
                {ad.labelLocation}
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
              <dt className="text-muted-foreground text-xs uppercase">{ad.labelBio}</dt>
              <dd className="whitespace-pre-line">
                {application.user.bio ?? '—'}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <section
        aria-label={ad.jobHeading}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{ad.jobHeading}</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs uppercase block">
              {ad.labelTitle}
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
                {ad.labelJobLocation}
              </span>
              <span>
                {application.job.location} · {application.job.locationType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase block">
                {ad.labelWorkType}
              </span>
              <span>{application.job.employmentType}</span>
            </div>
          </div>
        </div>
      </section>

      {customAnswers.length > 0 && (
        <section
          aria-label={ad.candidateAnswersHeading}
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">{ad.candidateAnswersHeading}</h2>
          <p className="text-muted-foreground text-sm">
            {ad.candidateAnswersSubtitle}
          </p>
          <dl className="space-y-4">
            {customAnswers.map((a) => (
              <div key={a.id}>
                <dt className="text-foreground text-sm font-medium">
                  {a.question.label}
                </dt>
                {a.question.helpText && (
                  <p className="text-muted-foreground text-xs">
                    {a.question.helpText}
                  </p>
                )}
                <dd className="text-foreground mt-1 text-sm">
                  {formatAnswerValue(a.value, a.question.type)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(application.resumeUrl || application.coverLetter) && (
        <section
          aria-label={ad.applicationFilesHeading}
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">{ad.applicationFilesHeading}</h2>
          {application.resumeUrl && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                {ad.labelResume}
              </span>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-foreground inline-flex items-center gap-2 hover:underline"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {ad.downloadResume}
              </a>
            </div>
          )}
          {application.coverLetter && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                {ad.labelCoverLetter}
              </span>
              <p className="whitespace-pre-line">{application.coverLetter}</p>
            </div>
          )}
        </section>
      )}

      {canManage && !application.withdrawnAt && (
        <section
          aria-label={ad.applicationStatusHeading}
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">{ad.applicationStatusHeading}</h2>
          <p className="text-muted-foreground text-sm">
            {ad.applicationStatusSubtitle}
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
          aria-label={ad.internalNotesHeading}
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">{ad.internalNotesHeading}</h2>
          <ApplicationNoteForm
            applicationId={application.id}
            initial={application.notes}
          />
        </section>
      )}

      <ApplicationNotesSection
        applicationId={application.id}
        currentUserId={session.user.id}
        canPin={canPinNotes}
        canModerate={canModerateNotes}
        tenantMembers={tenantMembers}
      />

      <ScorecardSummary summary={scorecardSummary} />

      <InterviewScorecardSummary applicationId={application.id} />

      <InterviewPipelineView pipeline={pipelineSummary} />

      <section
        aria-label={ad.interviewsHeading}
        className="border-border bg-card rounded-2xl border p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{ad.interviewsHeading}</h2>
        </div>

        {interviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {ad.noInterviewsScheduled}
          </p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {interviews.map((iv) => {
              const typeLabel =
                iv.type === 'video'
                  ? ad.interviewTypeVideo
                  : iv.type === 'onsite'
                    ? ad.interviewTypeOnsite
                    : iv.type === 'phone'
                      ? ad.interviewTypePhone
                      : iv.type
              const statusLabel =
                iv.status === 'scheduled'
                  ? ad.interviewStatusScheduled
                  : iv.status === 'completed'
                    ? ad.interviewStatusCompleted
                    : iv.status === 'cancelled'
                      ? ad.interviewStatusCancelled
                      : iv.status === 'no_show'
                        ? ad.interviewStatusNoShow
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
                      {ad.durationMin.replace('{min}', String(iv.durationMin))}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusTone}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {iv.type === 'video' && iv.meetingUrl && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">{ad.linkLabel}</span>
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
                      <span className="text-muted-foreground">{ad.locationLabel}</span>
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
                        {iv.scorecard ? ad.editScorecard : ad.createScorecard}
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
                  {canManage && viewerCalendarAccount && (
                    <SyncInterviewButton
                      interviewId={iv.id}
                      syncedMapping={
                        iv.calendarEvent
                          ? {
                              externalEventId: iv.calendarEvent.externalEventId,
                              htmlLink: iv.calendarEvent.htmlLink,
                            }
                          : null
                      }
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
              {ad.scheduleNewInterview}
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
        aria-label={ad.recentActivityHeading}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{ad.recentActivityHeading}</h2>
        </div>
        {auditEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {ad.noActivityYet}
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
