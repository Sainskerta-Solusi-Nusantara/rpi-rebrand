import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Briefcase, FileText, XCircle } from 'lucide-react'
import { ApplicationStatus } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  WithdrawApplicationModal,
  ReopenApplicationButton,
} from '@/components/organisms/withdraw-application-modal'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Detail Lamaran — Lamaran Saya' }

const STATUS_TONE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-slate-100 text-slate-800',
  REVIEWED: 'bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300',
  SHORTLISTED: 'bg-indigo-100 text-indigo-800',
  INTERVIEW: 'bg-violet-100 text-violet-800',
  OFFERED: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200',
  HIRED: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300',
  REJECTED: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300',
  WITHDRAWN: 'bg-zinc-100 text-zinc-800',
}

// Mirrors the recruiter detail page's terminal-state list. We only show the
// withdraw modal when the application is still in motion.
const TERMINAL: ApplicationStatus[] = [
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
]

const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function CandidateApplicationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(`/dashboard/lamaran/${params.id}`)
  const viewerId = session.user.id
  const t = await getServerT()
  const STATUS_LABELS: Record<ApplicationStatus, string> = {
    APPLIED: t.dashboard.applications.status.APPLIED,
    REVIEWED: t.dashboard.applications.status.REVIEWED,
    SHORTLISTED: t.dashboard.applications.status.SHORTLISTED,
    INTERVIEW: t.dashboard.applications.status.INTERVIEW,
    OFFERED: t.dashboard.applications.status.OFFERED,
    HIRED: t.dashboard.applications.status.HIRED,
    REJECTED: t.dashboard.applications.status.REJECTED,
    WITHDRAWN: t.dashboard.applications.status.WITHDRAWN,
  }

  const application = await prisma.application
    .findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
        withdrawnAt: true,
        withdrawReason: true,
        resumeUrl: true,
        coverLetter: true,
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            employmentType: true,
            locationType: true,
            tenant: { select: { name: true } },
          },
        },
      },
    })
    .catch(() => null)
  if (!application) notFound()
  if (application.userId !== viewerId) notFound()

  const tone = STATUS_TONE[application.status]

  const canReopen =
    application.status === ApplicationStatus.WITHDRAWN &&
    application.withdrawnAt !== null &&
    Date.now() - application.withdrawnAt.getTime() <= REOPEN_WINDOW_MS

  const canWithdraw = !TERMINAL.includes(application.status)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/lamaran` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.applications.detailPage.backLink}
        </Link>
      </div>

      <header className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl">{application.job.title}</h1>
          <p className="text-muted-foreground text-sm">
            {application.job.tenant?.name ?? ''}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {t.dashboard.applications.detailPage.appliedOn
              .replace('{date}', dateFmt.format(application.appliedAt))
              .replace('{updated}', dateFmt.format(application.updatedAt))}
          </p>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-medium ${tone}`}
        >
          {STATUS_LABELS[application.status]}
        </span>
      </header>

      {application.status === ApplicationStatus.WITHDRAWN && (
        <section
          aria-label={t.dashboard.applications.detailPage.withdrawnLabel}
          className="border-destructive/40 bg-destructive/5 rounded-2xl border p-5"
        >
          <div className="flex items-start gap-3">
            <XCircle
              className="text-destructive mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 className="text-destructive font-medium">{t.dashboard.applications.detailPage.withdrawnLabel}</h2>
              {application.withdrawnAt && (
                <p className="text-foreground/80 mt-1 text-sm">
                  {t.dashboard.applications.detailPage.withdrawnOn.replace(
                    '{date}',
                    dateFmt.format(application.withdrawnAt),
                  )}
                </p>
              )}
              {application.withdrawReason && (
                <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm">
                  {t.dashboard.applications.detailPage.reason.replace(
                    '{reason}',
                    application.withdrawReason,
                  )}
                </p>
              )}
              {canReopen ? (
                <div className="mt-4">
                  <ReopenApplicationButton applicationId={application.id} />
                  <p className="text-muted-foreground mt-2 text-xs">
                    {t.dashboard.applications.detailPage.canReopenNote}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mt-3 text-xs">
                  {t.dashboard.applications.detailPage.reopenExpired}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section
        aria-label={t.dashboard.applications.detailPage.jobSectionLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.applications.detailPage.jobSectionTitle}</h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs uppercase">{t.dashboard.applications.detailPage.title}</dt>
            <dd className="text-foreground">
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/jobs/${application.job.slug}` as any}
                className="hover:underline"
              >
                {application.job.title}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase">{t.dashboard.applications.detailPage.location}</dt>
            <dd>
              {application.job.location} · {application.job.locationType}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase">
              {t.dashboard.applications.detailPage.employmentType}
            </dt>
            <dd>{application.job.employmentType}</dd>
          </div>
        </dl>
      </section>

      {(application.resumeUrl || application.coverLetter) && (
        <section
          aria-label={t.dashboard.applications.detailPage.filesSectionLabel}
          className="border-border bg-card rounded-2xl border p-6 space-y-3"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">{t.dashboard.applications.detailPage.filesSectionTitle}</h2>
          </div>
          {application.resumeUrl && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                {t.dashboard.applications.detailPage.resume}
              </span>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-foreground hover:underline"
              >
                {t.dashboard.applications.detailPage.downloadResume}
              </a>
            </div>
          )}
          {application.coverLetter && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                {t.dashboard.applications.detailPage.coverLetter}
              </span>
              <p className="whitespace-pre-line">{application.coverLetter}</p>
            </div>
          )}
        </section>
      )}

      {canWithdraw && (
        <section
          aria-label={t.dashboard.applications.detailPage.actionsLabel}
          className="border-border bg-card rounded-2xl border p-6"
        >
          <h2 className="font-heading text-lg">{t.dashboard.applications.detailPage.withdrawTitle}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.dashboard.applications.detailPage.withdrawDesc}
          </p>
          <div className="mt-4">
            <WithdrawApplicationModal applicationId={application.id} />
          </div>
        </section>
      )}
    </div>
  )
}
