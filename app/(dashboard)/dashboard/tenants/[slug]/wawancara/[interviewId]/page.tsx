import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft,
  ClipboardList,
  CalendarClock,
  History,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { InterviewScorecardForm } from '@/components/organisms/interview-scorecard-form'
import {
  getScorecardForInterview,
  getScorecardsForApplication,
} from '@/lib/interviews/scorecard-queries'
import {
  RECOMMENDATION_LABELS,
  RECOMMENDATION_VALUES,
  type RecommendationValue,
} from '@/lib/interviews/scorecard-defaults'

export const metadata = { title: 'Detail Wawancara — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const TYPE_LABEL: Record<string, string> = {
  video: 'Video call',
  onsite: 'Onsite',
  phone: 'Telepon',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak hadir',
}

const STATUS_TONE: Record<string, string> = {
  scheduled: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-slate-100 text-slate-800',
}

const RECOMMENDATION_CHIP: Record<RecommendationValue, string> = {
  strong_hire: 'bg-green-100 text-green-800',
  hire: 'bg-emerald-100 text-emerald-800',
  no_hire: 'bg-red-100 text-red-800',
  strong_no_hire: 'bg-rose-100 text-rose-800',
}

function recommendationChip(value: string): string {
  if ((RECOMMENDATION_VALUES as readonly string[]).includes(value)) {
    return RECOMMENDATION_CHIP[value as RecommendationValue]
  }
  return 'bg-slate-100 text-slate-800'
}

function recommendationLabel(value: string): string {
  if ((RECOMMENDATION_VALUES as readonly string[]).includes(value)) {
    return RECOMMENDATION_LABELS[value as RecommendationValue].label
  }
  return value
}

function formatScore(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toFixed(1)
}

/**
 * Recruiter-side interview detail page. Surfaces:
 *   - Interview metadata (candidate, job, schedule, stage)
 *   - The scorecard form (pre-filled when one already exists)
 *   - "Riwayat scorecard sebelumnya" — every other interview on the same
 *     application with a scorecard, so the reviewer can read prior signal.
 *
 * Authorization: must hold `job.update` on the owning tenant. Otherwise
 * 404 — we don't tell unauthorized users whether the interview exists.
 */
export default async function TenantInterviewDetailPage({
  params,
}: {
  params: { slug: string; interviewId: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/wawancara/${params.interviewId}`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    notFound()
  }

  const interview = await prisma.interviewSchedule
    .findFirst({
      where: {
        id: params.interviewId,
        application: { tenantId: tenant.id },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMin: true,
        type: true,
        status: true,
        stageOrder: true,
        stageName: true,
        meetingUrl: true,
        location: true,
        notes: true,
        application: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
    })
    .catch(() => null)
  if (!interview) notFound()

  const scorecard = await getScorecardForInterview(interview.id)
  const otherScorecards = (
    await getScorecardsForApplication(interview.application.id)
  ).filter((row) => row.interviewId !== interview.id)

  const candidateName =
    interview.application.user.name ?? interview.application.user.email
  const jobTitle = interview.application.job.title
  const backHref =
    `/dashboard/tenants/${tenant.slug}/lamaran/${interview.application.id}` as const

  const typeLabel = TYPE_LABEL[interview.type] ?? interview.type
  const statusLabel = STATUS_LABEL[interview.status] ?? interview.status
  const statusTone = STATUS_TONE[interview.status] ?? 'bg-slate-100 text-slate-800'

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={backHref as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke detail lamaran
        </Link>
      </div>

      <header className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
          <h1 className="font-heading text-2xl">Detail wawancara</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Wawancara untuk lowongan{' '}
          <span className="text-foreground font-medium">{jobTitle}</span> bersama
          kandidat{' '}
          <span className="text-foreground font-medium">{candidateName}</span>.
        </p>
        <dl className="text-muted-foreground mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="uppercase">Jadwal</dt>
            <dd className="text-foreground">
              {dateFmt.format(interview.scheduledAt)}
            </dd>
          </div>
          <div>
            <dt className="uppercase">Durasi</dt>
            <dd className="text-foreground">{interview.durationMin} menit</dd>
          </div>
          <div>
            <dt className="uppercase">Jenis</dt>
            <dd className="text-foreground">{typeLabel}</dd>
          </div>
          <div>
            <dt className="uppercase">Stage</dt>
            <dd className="text-foreground">
              {interview.stageName
                ? `${interview.stageOrder} · ${interview.stageName}`
                : interview.stageOrder}
            </dd>
          </div>
        </dl>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone}`}
          >
            {statusLabel}
          </span>
          {interview.type === 'video' && interview.meetingUrl && (
            <a
              href={interview.meetingUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary text-xs hover:underline"
            >
              Buka tautan rapat
            </a>
          )}
          {interview.type === 'onsite' && interview.location && (
            <span className="text-muted-foreground text-xs">
              · {interview.location}
            </span>
          )}
        </div>
        {interview.notes && (
          <p className="text-muted-foreground whitespace-pre-line text-xs mt-2">
            {interview.notes}
          </p>
        )}
      </header>

      <section
        aria-label="Scorecard Wawancara"
        className="border-border bg-card rounded-2xl border p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            {scorecard ? 'Ubah scorecard' : 'Scorecard Wawancara'}
          </h2>
        </div>
        <InterviewScorecardForm
          interviewId={interview.id}
          initial={
            scorecard
              ? {
                  ratings: scorecard.ratings,
                  notes: scorecard.notes,
                  recommendation: scorecard.recommendation,
                }
              : undefined
          }
        />
      </section>

      {otherScorecards.length > 0 && (
        <section
          aria-label="Riwayat scorecard sebelumnya"
          className="border-border bg-card rounded-2xl border p-6 space-y-3"
        >
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">
              Riwayat scorecard sebelumnya
            </h2>
          </div>
          <ul className="divide-border divide-y text-sm">
            {otherScorecards.map((row) => {
              const authorName = row.author.name ?? row.author.email
              const stageLabel = row.interview.stageName
                ? `Stage ${row.interview.stageOrder} · ${row.interview.stageName}`
                : `Stage ${row.interview.stageOrder}`
              const otherHref =
                `/dashboard/tenants/${tenant.slug}/wawancara/${row.interviewId}` as const
              return (
                <li key={row.interviewId} className="space-y-1 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{stageLabel}</span>
                    <span className="text-muted-foreground text-xs">
                      {dateFmt.format(row.interview.scheduledAt)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${recommendationChip(row.recommendation)}`}
                    >
                      {recommendationLabel(row.recommendation)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Skor: {formatScore(row.averageScore)} / 5
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Oleh {authorName} · {row.ratings.length} kriteria
                  </p>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={otherHref as any}
                    className="text-primary inline-flex text-xs hover:underline"
                  >
                    Buka wawancara →
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
