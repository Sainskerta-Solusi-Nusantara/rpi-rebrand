import { Suspense } from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Gift, Wallet } from 'lucide-react'
import { getOnboardingChecklist } from '@/lib/onboarding/checklist'
import { OnboardingChecklist } from '@/components/organisms/onboarding-checklist'
import { RecommendedJobsWidget } from '@/components/organisms/recommended-jobs-widget'
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
const TabbedWorkspace: any = safeRequire('@/components/organisms/tabbed-workspace', 'TabbedWorkspace')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KPICard: any = safeRequire('@/components/molecules/kpi-card', 'KPICard')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KanbanBoard: any = safeRequire('@/components/organisms/kanban-board', 'KanbanBoard')

export const metadata = { title: 'Dasbor' }

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/dashboard')
  const userId = session.user.id
  const t = await getServerT()

  const [
    appliedCount,
    savedCount,
    enrollmentsActive,
    certificatesCount,
    enrollments,
    applications,
    checklist,
    wizardUser,
  ] = await Promise.all([
    prisma.application.count({ where: { userId } }).catch(() => 0),
    prisma.savedJob.count({ where: { userId } }).catch(() => 0),
    prisma.enrollment.count({ where: { userId, status: 'IN_PROGRESS' } }).catch(() => 0),
    prisma.certificate.count({ where: { userId } }).catch(() => 0),
    prisma.enrollment
      .findMany({
        where: { userId },
        take: 6,
        orderBy: { enrolledAt: 'desc' },
        include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } },
      })
      .catch(() => []),
    prisma.application
      .findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
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
    getOnboardingChecklist(userId),
    prisma.user
      .findUnique({
        where: { id: userId },
        select: { onboardingStep: true, onboardingCompleted: true },
      })
      .catch(() => null),
  ])

  const kanbanColumns = [
    {
      id: 'SAVED',
      title: t.dashboard.home.kanbanColumns.saved,
      items: [] as Array<{ id: string; title: string; meta?: string }>,
    },
    { id: 'APPLIED', title: t.dashboard.home.kanbanColumns.applied, items: [] as Array<{ id: string; title: string; meta?: string }> },
    {
      id: 'INTERVIEW',
      title: t.dashboard.home.kanbanColumns.interview,
      items: [] as Array<{ id: string; title: string; meta?: string }>,
    },
    { id: 'OFFER', title: t.dashboard.home.kanbanColumns.offer, items: [] as Array<{ id: string; title: string; meta?: string }> },
  ]
  for (const a of applications) {
    const meta = `${a.job.tenant?.name ?? ''} • ${a.job.location ?? ''}`
    if (a.status === 'APPLIED' || a.status === 'REVIEWED') {
      kanbanColumns[1].items.push({ id: a.id, title: a.job.title, meta })
    } else if (a.status === 'SHORTLISTED' || a.status === 'INTERVIEW') {
      kanbanColumns[2].items.push({ id: a.id, title: a.job.title, meta })
    } else if (a.status === 'OFFERED' || a.status === 'HIRED') {
      kanbanColumns[3].items.push({ id: a.id, title: a.job.title, meta })
    }
  }

  const tabs = [
    {
      id: 'overview',
      label: t.dashboard.home.tabs.overview,
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KPICard label={t.dashboard.home.kpis.applications} value={appliedCount} />
            <KPICard label={t.dashboard.home.kpis.saved} value={savedCount} />
            <KPICard label={t.dashboard.home.kpis.activeCourses} value={enrollmentsActive} />
            <KPICard label={t.dashboard.home.kpis.certificates} value={certificatesCount} />
          </div>

          <Suspense fallback={<div className="bg-muted h-48 animate-pulse rounded-xl" />}>
            <RecommendedJobsWidget userId={userId} limit={6} />
          </Suspense>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/referral' as any}
              className="border-border bg-card hover:bg-muted block rounded-2xl border p-5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary inline-flex h-10 w-10 items-center justify-center rounded-full">
                  <Gift className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <div className="font-heading text-base">{t.dashboard.home.referralCard.title}</div>
                  <p className="text-muted-foreground text-sm">
                    {t.dashboard.home.referralCard.description}
                  </p>
                </div>
                <span className="text-primary text-sm font-medium">{t.dashboard.home.referralCard.cta}</span>
              </div>
            </Link>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/salary-insights' as any}
              className="border-border bg-card hover:bg-muted block rounded-2xl border p-5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary inline-flex h-10 w-10 items-center justify-center rounded-full">
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <div className="font-heading text-base">{t.dashboard.home.salaryCard.title}</div>
                  <p className="text-muted-foreground text-sm">
                    {t.dashboard.home.salaryCard.description}
                  </p>
                </div>
                <span className="text-primary text-sm font-medium">{t.dashboard.home.salaryCard.cta}</span>
              </div>
            </Link>
          </div>

          <section>
            <h2 className="font-heading text-xl mb-4">{t.dashboard.home.learningProgress}</h2>
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground">{t.dashboard.home.noEnrollments}</p>
            ) : (
              <ul className="space-y-3">
                {enrollments.map((e) => (
                  <li key={e.id} className="border-border rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{e.course.title}</div>
                      <div className="text-muted-foreground text-sm">{e.progress}%</div>
                    </div>
                    <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${Math.min(100, e.progress)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ),
    },
    {
      id: 'kanban',
      label: t.dashboard.home.tabs.pipeline,
      content: <KanbanBoard columns={kanbanColumns} />,
    },
    {
      id: 'rekomendasi',
      label: t.dashboard.home.tabs.recommendations,
      content: (
        <Suspense fallback={<div className="bg-muted h-48 animate-pulse rounded-xl" />}>
          <RecommendedJobsWidget userId={userId} limit={12} heading={t.dashboard.home.personalRecommendations} />
        </Suspense>
      ),
    },
  ]

  return (
    <div className="p-6">
      <OnboardingChecklist
        steps={checklist}
        wizardStep={wizardUser?.onboardingStep ?? 0}
        wizardCompleted={wizardUser?.onboardingCompleted ?? false}
      />
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">
          {t.dashboard.home.greeting.replace('{name}', session.user.name ?? t.dashboard.home.defaultName)}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.home.subtitle}
        </p>
      </header>
      <TabbedWorkspace tabs={tabs} defaultTab="overview" />
    </div>
  )
}
