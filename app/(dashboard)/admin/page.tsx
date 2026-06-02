import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { getFlagCounts } from '@/lib/moderation/queries'
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
const LineChartCard: any = safeRequire('@/components/molecules/line-chart-card', 'LineChartCard')

export const metadata = { title: 'Dasbor Admin' }

export default async function AdminOverviewPage() {
  const t = await getServerT()
  const ta = t.admin.overview
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user.globalRole === 'SUPERADMIN'

  const since = new Date()
  since.setMonth(since.getMonth() - 5)

  const [
    usersTotal,
    tenantsTotal,
    jobsTotal,
    applicationsTotal,
    recentUsers,
    recentJobs,
    pendingTenants,
    flagCounts,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.tenant.count().catch(() => 0),
    prisma.job.count().catch(() => 0),
    prisma.application.count().catch(() => 0),
    prisma.user
      .findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
      .catch(() => []),
    prisma.job
      .findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
      .catch(() => []),
    prisma.tenant.count({ where: { status: 'PROVISIONING' } }).catch(() => 0),
    getFlagCounts(),
  ])

  function bucketize(items: { createdAt: Date }[]) {
    const buckets: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[k] = 0
    }
    for (const it of items) {
      const k = `${it.createdAt.getFullYear()}-${String(it.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (buckets[k] !== undefined) buckets[k]++
    }
    return Object.entries(buckets).map(([k, v]) => ({ label: k, value: v }))
  }

  const usersSeries = bucketize(recentUsers)
  const jobsSeries = bucketize(recentJobs)

  const tabs = [
    {
      id: 'pertumbuhan',
      label: ta.tabs.growth,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LineChartCard title={ta.newUsersChart} data={usersSeries} />
            <LineChartCard title={ta.newJobsChart} data={jobsSeries} />
          </div>
        </div>
      ),
    },
    {
      id: 'sistem',
      label: ta.tabs.systemHealth,
      content: (
        <div className="space-y-4">
          <KPICard label={ta.provisioningTenants} value={pendingTenants} />
          <a className="text-primary underline" href="/admin/sistem">
            {ta.viewSystemDetail}
          </a>
        </div>
      ),
    },
    {
      id: 'moderasi',
      label: ta.tabs.moderation,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KPICard label={ta.moderationKpis.pending} value={flagCounts.pending} />
            <KPICard label={ta.moderationKpis.reviewing} value={flagCounts.reviewing} />
            <KPICard label={ta.moderationKpis.resolved} value={flagCounts.resolved} />
            <KPICard label={ta.moderationKpis.dismissed} value={flagCounts.dismissed} />
          </div>
          <a className="text-primary underline" href="/admin/moderasi">
            {ta.openModerationQueue}
          </a>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{ta.title}</h1>
          <p className="text-muted-foreground mt-1">{ta.subtitle}</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <a href="/admin/users" className="border-border rounded-md border px-3 py-1.5">
            {ta.nav.users}
          </a>
          {isSuperAdmin ? (
            <a href="/admin/tenants" className="border-border rounded-md border px-3 py-1.5">
              {ta.nav.tenants}
            </a>
          ) : null}
          <a href="/admin/moderasi" className="border-border rounded-md border px-3 py-1.5">
            {ta.nav.moderation}
          </a>
          <a href="/admin/audit" className="border-border rounded-md border px-3 py-1.5">
            {ta.nav.audit}
          </a>
          {isSuperAdmin ? (
            <a
              href="/dashboard/audit-retention"
              className="border-border rounded-md border px-3 py-1.5"
            >
              {ta.nav.auditRetention}
            </a>
          ) : null}
          {isSuperAdmin ? (
            <a
              href="/admin/status"
              className="border-border rounded-md border px-3 py-1.5"
            >
              {ta.nav.systemStatus}
            </a>
          ) : null}
          {isSuperAdmin ? (
            <a
              href="/dashboard/feature-flags"
              className="border-border rounded-md border px-3 py-1.5"
            >
              {ta.nav.featureFlags}
            </a>
          ) : null}
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard label={ta.kpis.totalUsers} value={usersTotal} />
        <KPICard label={ta.kpis.totalTenants} value={tenantsTotal} />
        <KPICard label={ta.kpis.totalJobs} value={jobsTotal} />
        <KPICard label={ta.kpis.totalApplications} value={applicationsTotal} />
      </div>

      <TabbedWorkspace tabs={tabs} defaultTab="pertumbuhan" />
    </div>
  )
}
