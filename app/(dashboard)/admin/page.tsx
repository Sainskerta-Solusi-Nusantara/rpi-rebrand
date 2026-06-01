import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { getFlagCounts } from '@/lib/moderation/queries'

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
      label: 'Pertumbuhan',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LineChartCard title="Pengguna Baru per Bulan" data={usersSeries} />
            <LineChartCard title="Lowongan Baru per Bulan" data={jobsSeries} />
          </div>
        </div>
      ),
    },
    {
      id: 'sistem',
      label: 'Kesehatan Sistem',
      content: (
        <div className="space-y-4">
          <KPICard label="Tenant Provisioning" value={pendingTenants} />
          <a className="text-primary underline" href="/admin/sistem">
            Lihat detail sistem
          </a>
        </div>
      ),
    },
    {
      id: 'moderasi',
      label: 'Moderasi',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KPICard label="Menunggu" value={flagCounts.pending} />
            <KPICard label="Ditinjau" value={flagCounts.reviewing} />
            <KPICard label="Selesai" value={flagCounts.resolved} />
            <KPICard label="Ditolak" value={flagCounts.dismissed} />
          </div>
          <a className="text-primary underline" href="/admin/moderasi">
            Buka antrian moderasi
          </a>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Dasbor Admin</h1>
          <p className="text-muted-foreground mt-1">
            Pantau pertumbuhan, kesehatan sistem, dan moderasi platform.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <a href="/admin/users" className="border-border rounded-md border px-3 py-1.5">
            Pengguna
          </a>
          {isSuperAdmin ? (
            <a href="/admin/tenants" className="border-border rounded-md border px-3 py-1.5">
              Tenant
            </a>
          ) : null}
          <a href="/admin/moderasi" className="border-border rounded-md border px-3 py-1.5">
            Moderasi
          </a>
          <a href="/admin/audit" className="border-border rounded-md border px-3 py-1.5">
            Audit
          </a>
          {isSuperAdmin ? (
            <a
              href="/dashboard/audit-retention"
              className="border-border rounded-md border px-3 py-1.5"
            >
              Retensi audit
            </a>
          ) : null}
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard label="Total Pengguna" value={usersTotal} />
        <KPICard label="Total Tenant" value={tenantsTotal} />
        <KPICard label="Total Lowongan" value={jobsTotal} />
        <KPICard label="Total Lamaran" value={applicationsTotal} />
      </div>

      <TabbedWorkspace tabs={tabs} defaultTab="pertumbuhan" />
    </div>
  )
}
