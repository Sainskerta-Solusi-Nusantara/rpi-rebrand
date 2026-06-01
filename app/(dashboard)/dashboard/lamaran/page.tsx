import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { WithdrawApplicationButton } from '@/components/organisms/withdraw-application-button'
import { applicationsWithThread } from '@/lib/messaging/queries'
import { getServerT } from '@/lib/i18n/server-dictionary'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-48 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KanbanBoard: any = safeRequire('@/components/organisms/kanban-board', 'KanbanBoard')

export const metadata = { title: 'Lamaran Saya' }

export default async function ApplicationsKanbanPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/lamaran')
  const userId = session.user.id
  const t = await getServerT()

  // "Termasuk yang ditarik" toggle. Default OFF so the kanban + active list
  // don't show abandoned attempts; the candidate can opt back in via the
  // filter chip below.
  const includeWithdrawn =
    typeof searchParams?.includeWithdrawn === 'string' &&
    searchParams.includeWithdrawn === '1'

  const [savedJobs, applications] = await Promise.all([
    prisma.savedJob
      .findMany({
        where: { userId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              location: true,
              tenant: { select: { name: true } },
            },
          },
        },
        orderBy: { savedAt: 'desc' },
      })
      .catch(() => []),
    prisma.application
      .findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              location: true,
              tenant: { select: { name: true } },
            },
          },
        },
      })
      .catch(() => []),
  ])

  const columns = [
    {
      id: 'SAVED',
      title: t.dashboard.home.kanbanColumns.saved,
      items: savedJobs.map((s) => ({
        id: s.id,
        title: s.job.title,
        meta: `${s.job.tenant?.name ?? ''} • ${s.job.location ?? ''}`,
        href: `/jobs/${s.job.slug}`,
      })),
    },
    {
      id: 'APPLIED',
      title: t.dashboard.home.kanbanColumns.applied,
      items: applications
        .filter((a) => a.status === 'APPLIED' || a.status === 'REVIEWED')
        .map((a) => ({
          id: a.id,
          title: a.job.title,
          meta: `${a.job.tenant?.name ?? ''} • ${a.status}`,
          href: `/jobs/${a.job.slug}`,
        })),
    },
    {
      id: 'INTERVIEW',
      title: t.dashboard.home.kanbanColumns.interview,
      items: applications
        .filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW')
        .map((a) => ({
          id: a.id,
          title: a.job.title,
          meta: `${a.job.tenant?.name ?? ''} • ${a.status}`,
          href: `/jobs/${a.job.slug}`,
        })),
    },
    {
      id: 'OFFER',
      title: t.dashboard.home.kanbanColumns.offer,
      items: applications
        .filter((a) => a.status === 'OFFERED' || a.status === 'HIRED')
        .map((a) => ({
          id: a.id,
          title: a.job.title,
          meta: `${a.job.tenant?.name ?? ''} • ${a.status}`,
          href: `/jobs/${a.job.slug}`,
        })),
    },
  ]

  const withdrawableStatuses = new Set([
    'APPLIED',
    'REVIEWED',
    'SHORTLISTED',
    'INTERVIEW',
  ])
  const withdrawable = applications.filter((a) =>
    withdrawableStatuses.has(a.status),
  )

  // Which of the visible applications have an active message thread? We only
  // surface a "Pesan" link when a thread exists so candidates don't see a
  // dead link for applications they haven't been contacted on yet.
  const applicationIds = applications.map((a) => a.id)
  const threadAppIds = await applicationsWithThread(applicationIds)
  // Per-application unread count for the candidate side.
  let unreadByApp = new Map<string, number>()
  if (threadAppIds.size > 0) {
    try {
      const grouped = await prisma.message.groupBy({
        by: ['threadId'],
        where: {
          readByCandidateAt: null,
          senderId: { not: userId },
          thread: { application: { userId, id: { in: applicationIds } } },
        },
        _count: { _all: true },
      })
      // We need threadId → applicationId mapping.
      const threads = await prisma.messageThread.findMany({
        where: { id: { in: grouped.map((g) => g.threadId) } },
        select: { id: true, applicationId: true },
      })
      const threadToApp = new Map(threads.map((t) => [t.id, t.applicationId]))
      unreadByApp = new Map(
        grouped
          .map((g) => [threadToApp.get(g.threadId), g._count._all] as const)
          .filter((e): e is [string, number] => Boolean(e[0])),
      )
    } catch {
      unreadByApp = new Map()
    }
  }

  const STATUS_LABEL: Record<string, string> = {
    APPLIED: t.dashboard.applications.status.APPLIED,
    REVIEWED: t.dashboard.applications.status.REVIEWED,
    SHORTLISTED: t.dashboard.applications.status.SHORTLISTED,
    INTERVIEW: t.dashboard.applications.status.INTERVIEW,
    OFFERED: t.dashboard.applications.status.OFFERED,
    REJECTED: t.dashboard.applications.status.REJECTED,
    WITHDRAWN: t.dashboard.applications.status.WITHDRAWN,
    HIRED: t.dashboard.applications.status.HIRED,
  }

  const withdrawnApplications = applications.filter(
    (a) => a.status === 'WITHDRAWN',
  )

  return (
    <div className="p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.applications.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.dashboard.applications.subtitle}
          </p>
        </div>
        {/* Filter chip toggle — reload with ?includeWithdrawn=1. We use a plain
            link so this works without any client state. */}
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={
            (includeWithdrawn
              ? '/dashboard/lamaran'
              : '/dashboard/lamaran?includeWithdrawn=1') as any
          }
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            includeWithdrawn
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:bg-muted'
          }`}
        >
          {t.dashboard.applications.includeWithdrawn}
          {includeWithdrawn && withdrawnApplications.length > 0 && (
            <span className="bg-primary-foreground/20 ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px]">
              {withdrawnApplications.length}
            </span>
          )}
        </Link>
      </header>
      <KanbanBoard columns={columns} />

      {includeWithdrawn && withdrawnApplications.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl">{t.dashboard.applications.withdrawnSectionTitle}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.dashboard.applications.withdrawnSectionDesc}
          </p>
          <ul className="mt-4 space-y-2">
            {withdrawnApplications.map((a) => (
              <li
                key={a.id}
                className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div className="min-w-0">
                  <div className="text-foreground truncate text-sm font-medium">
                    {a.job.title}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {a.job.tenant?.name ?? ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                    {t.dashboard.applications.withdrawnBadge}
                  </span>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/dashboard/lamaran/${a.id}` as any}
                    className="text-foreground text-xs font-medium hover:underline"
                  >
                    {t.dashboard.applications.detail}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {withdrawable.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl">{t.dashboard.applications.manageActiveTitle}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.dashboard.applications.manageActiveDesc}
          </p>
          <ul className="mt-4 space-y-2">
            {withdrawable.map((a) => {
              const hasThread = threadAppIds.has(a.id)
              const unread = unreadByApp.get(a.id) ?? 0
              return (
                <li
                  key={a.id}
                  className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0">
                    <div className="text-foreground truncate text-sm font-medium">
                      {a.job.title}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {a.job.tenant?.name ?? ''} ·{' '}
                      {STATUS_LABEL[a.status] ?? a.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasThread && (
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/dashboard/lamaran/${a.id}/pesan` as any}
                        className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
                      >
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.dashboard.applications.messages}
                        {unread > 0 && (
                          <span
                            aria-label={t.dashboard.applications.unreadAria.replace('{n}', String(unread))}
                            className="bg-primary text-primary-foreground inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          >
                            {Math.min(99, unread)}
                          </span>
                        )}
                      </Link>
                    )}
                    <WithdrawApplicationButton applicationId={a.id} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
