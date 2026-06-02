import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
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
const LineChartCard: any = safeRequire('@/components/molecules/line-chart-card', 'LineChartCard')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FunnelChart: any = safeRequire('@/components/organisms/funnel-chart', 'FunnelChart')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KPICard: any = safeRequire('@/components/molecules/kpi-card', 'KPICard')

export const metadata = { title: 'Analitik' }

async function resolveTenantId(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) {
    const t = await prisma.tenant.findUnique({ where: { slug: hSlug }, select: { id: true } }).catch(() => null)
    if (t?.id) return t.id
  }
  const ut = await prisma.userTenant
    .findFirst({ where: { userId }, select: { tenantId: true } })
    .catch(() => null)
  return ut?.tenantId ?? null
}

export default async function PartnerAnalyticsPage() {
  const t = await getServerT()
  const tp = t.partner
  const session = await getServerSession(authOptions)
  const tenantId = await resolveTenantId(session!.user.id)
  const where = tenantId ? { tenantId } : {}

  const since = new Date()
  since.setMonth(since.getMonth() - 5)

  const [applications, jobs, statusGroup, viewsAgg] = await Promise.all([
    prisma.application
      .findMany({
        where: { ...where, appliedAt: { gte: since } },
        select: { appliedAt: true, status: true },
      })
      .catch(() => []),
    prisma.job
      .findMany({
        where: { ...where, createdAt: { gte: since } },
        select: { createdAt: true, status: true },
      })
      .catch(() => []),
    prisma.application
      .groupBy({ by: ['status'], where, _count: { _all: true } })
      .catch(() => [] as Array<{ status: string; _count: { _all: number } }>),
    prisma.job
      .aggregate({ where, _sum: { views: true }, _avg: { views: true } })
      .catch(() => ({ _sum: { views: 0 }, _avg: { views: 0 } })),
  ])

  const monthBuckets: Record<string, { applied: number; published: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthBuckets[k] = { applied: 0, published: 0 }
  }
  for (const a of applications) {
    const k = `${a.appliedAt.getFullYear()}-${String(a.appliedAt.getMonth() + 1).padStart(2, '0')}`
    if (monthBuckets[k]) monthBuckets[k].applied++
  }
  for (const j of jobs) {
    const k = `${j.createdAt.getFullYear()}-${String(j.createdAt.getMonth() + 1).padStart(2, '0')}`
    if (monthBuckets[k]) monthBuckets[k].published++
  }
  const appliedSeries = Object.entries(monthBuckets).map(([k, v]) => ({ label: k, value: v.applied }))
  const jobsSeries = Object.entries(monthBuckets).map(([k, v]) => ({ label: k, value: v.published }))

  const funnel = [
    { label: tp.funnel.applied, value: statusGroup.find((s) => s.status === 'APPLIED')?._count._all ?? 0 },
    { label: tp.funnel.reviewed, value: statusGroup.find((s) => s.status === 'REVIEWED')?._count._all ?? 0 },
    { label: tp.funnel.shortlist, value: statusGroup.find((s) => s.status === 'SHORTLISTED')?._count._all ?? 0 },
    { label: tp.funnel.interview, value: statusGroup.find((s) => s.status === 'INTERVIEW')?._count._all ?? 0 },
    { label: tp.funnel.offer, value: statusGroup.find((s) => s.status === 'OFFERED')?._count._all ?? 0 },
    { label: tp.funnel.hired, value: statusGroup.find((s) => s.status === 'HIRED')?._count._all ?? 0 },
  ]

  const totalViews = (viewsAgg as { _sum?: { views: number | null } })._sum?.views ?? 0
  const avgViews = Math.round((viewsAgg as { _avg?: { views: number | null } })._avg?.views ?? 0)

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{tp.analytics.title}</h1>
        <p className="text-muted-foreground mt-1">{tp.analytics.subtitle}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard label={tp.analytics.kpis.totalViews} value={totalViews} />
        <KPICard label={tp.analytics.kpis.avgViewsPerJob} value={avgViews} />
        <KPICard label={tp.analytics.kpis.totalApplications6mo} value={applications.length} />
        <KPICard label={tp.analytics.kpis.totalNewJobs} value={jobs.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChartCard title={tp.analytics.appliedChartTitle} data={appliedSeries} />
        <LineChartCard title={tp.analytics.jobsChartTitle} data={jobsSeries} />
      </div>

      <section>
        <h2 className="font-heading text-xl mb-4">{tp.analytics.funnelHeading}</h2>
        <FunnelChart stages={funnel} />
      </section>
    </div>
  )
}
