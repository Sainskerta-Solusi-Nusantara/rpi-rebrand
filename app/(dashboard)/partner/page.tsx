import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

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
const FunnelChart: any = safeRequire('@/components/organisms/funnel-chart', 'FunnelChart')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JobsTable: any = safeRequire('@/components/organisms/jobs-table', 'JobsTable')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LineChartCard: any = safeRequire('@/components/molecules/line-chart-card', 'LineChartCard')

export const metadata = { title: 'Dasbor Mitra' }

async function resolvePartnerTenantId(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) {
    const t = await prisma.tenant.findUnique({ where: { slug: hSlug }, select: { id: true } }).catch(() => null)
    if (t?.id) return t.id
  }
  // Fallback: any tenant the user owns/administers.
  const ut = await prisma.userTenant
    .findFirst({ where: { userId }, select: { tenantId: true } })
    .catch(() => null)
  return ut?.tenantId ?? null
}

export default async function PartnerOverviewPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id
  const tenantId = await resolvePartnerTenantId(userId)

  const where = tenantId ? { tenantId } : {}

  const [jobsActive, jobsTotal, applicationsTotal, hiredTotal, applicationsByStatus, recentJobs, teamSize] =
    await Promise.all([
      prisma.job.count({ where: { ...where, status: 'PUBLISHED' } }).catch(() => 0),
      prisma.job.count({ where }).catch(() => 0),
      prisma.application.count({ where }).catch(() => 0),
      prisma.application.count({ where: { ...where, status: 'HIRED' } }).catch(() => 0),
      prisma.application
        .groupBy({ by: ['status'], where, _count: { _all: true } })
        .catch(() => [] as Array<{ status: string; _count: { _all: number } }>),
      prisma.job
        .findMany({
          where,
          take: 8,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            location: true,
            views: true,
            publishedAt: true,
            _count: { select: { applications: true } },
          },
        })
        .catch(() => []),
      tenantId
        ? prisma.userTenant.count({ where: { tenantId } }).catch(() => 0)
        : Promise.resolve(0),
    ])

  const funnelStages = [
    { label: 'Dilamar', value: applicationsByStatus.find((s) => s.status === 'APPLIED')?._count._all ?? 0 },
    {
      label: 'Ditinjau',
      value: applicationsByStatus.find((s) => s.status === 'REVIEWED')?._count._all ?? 0,
    },
    {
      label: 'Shortlist',
      value: applicationsByStatus.find((s) => s.status === 'SHORTLISTED')?._count._all ?? 0,
    },
    {
      label: 'Wawancara',
      value: applicationsByStatus.find((s) => s.status === 'INTERVIEW')?._count._all ?? 0,
    },
    {
      label: 'Penawaran',
      value: applicationsByStatus.find((s) => s.status === 'OFFERED')?._count._all ?? 0,
    },
    { label: 'Diterima', value: applicationsByStatus.find((s) => s.status === 'HIRED')?._count._all ?? 0 },
  ]

  // Hire-rate trendline by month (last 6 months).
  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  const monthly = await prisma.application
    .findMany({
      where: { ...where, appliedAt: { gte: since } },
      select: { appliedAt: true, status: true },
    })
    .catch(() => [])
  const series: Record<string, { applied: number; hired: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    series[k] = { applied: 0, hired: 0 }
  }
  for (const a of monthly) {
    const k = `${a.appliedAt.getFullYear()}-${String(a.appliedAt.getMonth() + 1).padStart(2, '0')}`
    if (!series[k]) continue
    series[k].applied++
    if (a.status === 'HIRED') series[k].hired++
  }
  const trend = Object.entries(series).map(([k, v]) => ({ label: k, value: v.applied }))

  const tabs = [
    {
      id: 'overview',
      label: 'Ringkasan',
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KPICard label="Lowongan Aktif" value={jobsActive} />
            <KPICard label="Total Lowongan" value={jobsTotal} />
            <KPICard label="Total Lamaran" value={applicationsTotal} />
            <KPICard label="Diterima" value={hiredTotal} />
          </div>
          <section>
            <h2 className="font-heading text-xl mb-4">Corong Rekrutmen</h2>
            <FunnelChart stages={funnelStages} />
          </section>
          <section>
            <h2 className="font-heading text-xl mb-4">Lowongan Terbaru</h2>
            <JobsTable jobs={recentJobs} />
          </section>
          <section>
            <h2 className="font-heading text-xl mb-4">Aktivitas Tim</h2>
            <p className="text-muted-foreground">{teamSize} anggota tim aktif.</p>
          </section>
        </div>
      ),
    },
    {
      id: 'tren',
      label: 'Tren',
      content: <LineChartCard title="Lamaran per Bulan" data={trend} />,
    },
  ]

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">Dasbor Mitra</h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan performa rekrutmen perusahaan Anda.
        </p>
      </header>
      <TabbedWorkspace tabs={tabs} defaultTab="overview" />
    </div>
  )
}
