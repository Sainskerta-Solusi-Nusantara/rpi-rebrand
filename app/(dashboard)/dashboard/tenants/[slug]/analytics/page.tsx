import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft,
  BarChart3,
  Briefcase,
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission, canAccessTenant } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  getTenantOverview,
  getJobsBreakdown,
  getApplicationFunnel,
  getApplicationsByDay,
  getRecentTenantActivity,
} from '@/lib/tenants/analytics-queries'

export const metadata = { title: 'Analytics Tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const statusLabels: Record<string, string> = {
  DRAFT: 'Draf',
  PUBLISHED: 'Terbit',
  PAUSED: 'Dijeda',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Arsip',
}

const statusTones: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PUBLISHED: 'bg-green-100 text-green-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-muted text-muted-foreground',
}

const funnelLabels: Record<string, string> = {
  APPLIED: 'Lamar',
  REVIEWED: 'Direview',
  SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Wawancara',
  OFFERED: 'Ditawari',
  HIRED: 'Diterima',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Dibatalkan',
}

const funnelTones: Record<string, string> = {
  APPLIED: 'bg-sky-500',
  REVIEWED: 'bg-indigo-500',
  SHORTLISTED: 'bg-violet-500',
  INTERVIEW: 'bg-amber-500',
  OFFERED: 'bg-orange-500',
  HIRED: 'bg-emerald-500',
  REJECTED: 'bg-rose-400',
  WITHDRAWN: 'bg-slate-400',
}

const actionLabels: Record<string, string> = {
  CREATE: 'Dibuat',
  UPDATE: 'Diubah',
  DELETE: 'Dihapus',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  INVITE: 'Undangan',
  REVOKE: 'Dicabut',
  PERMISSION_CHANGE: 'Ubah peran',
}

export default async function TenantAnalyticsPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/analytics`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!canAccessTenant(globalRole, tenants, tenant.id)) {
    notFound()
  }

  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'tenant.view')) {
    notFound()
  }

  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)

  const [overview, jobs, funnel, daily, activity] = await Promise.all([
    getTenantOverview(tenant.id),
    getJobsBreakdown(tenant.id),
    getApplicationFunnel(tenant.id, since30),
    getApplicationsByDay(tenant.id, 30),
    getRecentTenantActivity(tenant.id, 10),
  ])

  // Funnel computations
  const funnelPipeline = funnel.filter((f) =>
    [
      'APPLIED',
      'REVIEWED',
      'SHORTLISTED',
      'INTERVIEW',
      'OFFERED',
      'HIRED',
    ].includes(f.status),
  )
  const appliedCount =
    funnelPipeline.find((f) => f.status === 'APPLIED')?.count ?? 0
  const respondedCount = funnelPipeline
    .filter((f) => f.status !== 'APPLIED')
    .reduce((acc, f) => acc + f.count, 0)
  const responseRate =
    appliedCount > 0
      ? Math.round((respondedCount / appliedCount) * 100)
      : 0
  const funnelMax = Math.max(1, ...funnelPipeline.map((f) => f.count))

  // Daily chart computations
  const maxDaily = Math.max(1, ...daily.map((d) => d.count))
  const chartWidth = 600
  const chartHeight = 80
  const stepX =
    daily.length > 1 ? chartWidth / (daily.length - 1) : chartWidth
  const pathPoints = daily.map((d, i) => {
    const x = i * stepX
    const y = chartHeight - (d.count / maxDaily) * chartHeight
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  })
  const sparklinePath = pathPoints.join(' ')
  const areaPath =
    daily.length > 0
      ? `${sparklinePath} L${((daily.length - 1) * stepX).toFixed(2)},${chartHeight} L0,${chartHeight} Z`
      : ''

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke kelola tenant
        </Link>
      </div>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[hsl(220,50%,14%)] text-white">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl">Analytics</h1>
            <p className="text-muted-foreground text-sm">{tenant.name}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Ringkasan kinerja tenant — 30 hari terakhir
        </p>
      </header>

      {/* KPI grid */}
      <section aria-label="KPI">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
            label="Total lowongan"
            value={overview.totalJobs}
            hint={`${overview.publishedJobs} terbit · ${overview.draftJobs} draf`}
          />
          <KpiCard
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            label="Lamaran 30 hari"
            value={overview.applicationsLast30d}
            hint={`${overview.applicationsThisWeek} minggu ini`}
          />
          <KpiCard
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            label="Tingkat respons"
            value={`${responseRate}%`}
            hint={`${respondedCount} dari ${appliedCount} lamaran`}
          />
          <KpiCard
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            label="Anggota aktif"
            value={overview.activeMembers}
            hint={`${overview.pendingInvites} undangan tertunda`}
          />
        </div>
      </section>

      {/* Funnel */}
      <section
        aria-label="Corong lamaran"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4">
          <h2 className="font-heading text-lg">Corong lamaran</h2>
          <p className="text-muted-foreground text-xs">
            Distribusi status lamaran selama 30 hari terakhir
          </p>
        </div>
        {appliedCount === 0 && respondedCount === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada lamaran dalam 30 hari terakhir.
          </p>
        ) : (
          <ul className="space-y-2">
            {funnelPipeline.map((row) => {
              const pct =
                funnelMax > 0
                  ? Math.round((row.count / funnelMax) * 100)
                  : 0
              const sharePct =
                appliedCount > 0
                  ? Math.round((row.count / appliedCount) * 100)
                  : 0
              return (
                <li key={row.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">
                      {funnelLabels[row.status] ?? row.status}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.count.toLocaleString('id-ID')} ({sharePct}%)
                    </span>
                  </div>
                  <div
                    className="bg-muted h-3 w-full overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={row.count}
                    aria-valuemin={0}
                    aria-valuemax={funnelMax}
                    aria-label={funnelLabels[row.status] ?? row.status}
                  >
                    <div
                      className={`${funnelTones[row.status] ?? 'bg-primary'} h-full rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Applications by day */}
      <section
        aria-label="Lamaran per hari"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg">Lamaran per hari</h2>
            <p className="text-muted-foreground text-xs">
              30 hari terakhir · puncak {maxDaily.toLocaleString('id-ID')} lamaran/hari
            </p>
          </div>
          <div className="text-muted-foreground text-xs">
            {daily.length > 0 && (
              <>
                {dateFmt.format(new Date(daily[0]!.date))} —{' '}
                {dateFmt.format(new Date(daily[daily.length - 1]!.date))}
              </>
            )}
          </div>
        </div>

        {daily.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada data lamaran.
          </p>
        ) : (
          <div className="space-y-3">
            {/* SVG sparkline */}
            <div className="border-border/60 bg-background overflow-hidden rounded-lg border p-3">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                className="text-primary block h-20 w-full"
                role="img"
                aria-label="Tren lamaran per hari"
              >
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="currentColor"
                    fillOpacity={0.12}
                  />
                )}
                {sparklinePath && (
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>

            {/* Vertical bar grid */}
            <div
              className="flex items-end gap-[2px]"
              style={{ height: '96px' }}
              aria-hidden="true"
            >
              {daily.map((d) => {
                const heightPct =
                  maxDaily > 0
                    ? Math.max(2, (d.count / maxDaily) * 100)
                    : 2
                return (
                  <div
                    key={d.date}
                    title={`${dateFmt.format(new Date(d.date))}: ${d.count} lamaran`}
                    className="bg-primary/70 hover:bg-primary flex-1 rounded-sm transition-colors"
                    style={{ height: `${heightPct}%` }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Top jobs table */}
      <section
        aria-label="Lowongan teratas"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4">
          <h2 className="font-heading text-lg">Lowongan teratas</h2>
          <p className="text-muted-foreground text-xs">
            10 lowongan dengan lamaran terbanyak
          </p>
        </div>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada lowongan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Lowongan</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium text-right">Lamaran</th>
                  <th className="py-2 pr-3 font-medium text-right">Views</th>
                  <th className="py-2 font-medium text-right">Konversi</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const conversion =
                    job.views > 0
                      ? ((job.applicationsCount / job.views) * 100).toFixed(1)
                      : null
                  const tone =
                    statusTones[job.status] ??
                    'bg-muted text-muted-foreground'
                  return (
                    <tr
                      key={job.id}
                      className="border-border/60 border-b last:border-b-0"
                    >
                      <td className="py-2 pr-3 font-medium">{job.title}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
                        >
                          {statusLabels[job.status] ?? job.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {job.applicationsCount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {job.views.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {conversion !== null ? `${conversion}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section
        aria-label="Aktivitas terbaru"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg">Aktivitas terbaru</h2>
            <p className="text-muted-foreground text-xs">
              10 entri audit terbaru
            </p>
          </div>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`/dashboard/tenants/${tenant.slug}/audit` as any}
            className="text-primary text-sm underline-offset-2 hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada aktivitas tercatat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                  <th className="py-2 pr-3 font-medium">Resource</th>
                  <th className="py-2 font-medium">Aktor</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr
                    key={row.id}
                    className="border-border/60 border-b last:border-b-0"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateTimeFmt.format(row.createdAt)}
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {actionLabels[row.action] ?? row.action}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {row.resource}
                      {row.resourceId ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · {row.resourceId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-xs">
                      {row.actorEmail ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-1 rounded-2xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-heading text-2xl tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </div>
      {hint ? (
        <div className="text-muted-foreground text-xs">{hint}</div>
      ) : null}
    </div>
  )
}
