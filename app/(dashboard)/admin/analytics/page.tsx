import { Users, Building2, Briefcase, FileText, GraduationCap, Award } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Analitik — Admin' }

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

const PLAN_ORDER = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const

export default async function AdminAnalyticsPage() {
  await requireRole('ADMIN', 'SUPERADMIN')
  const since = THIRTY_DAYS_AGO()

  const [
    users,
    tenants,
    jobs,
    applications,
    enrollments,
    certificates,
    newUsers,
    newJobs,
    newApplications,
    activeSubs,
    planGroups,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.tenant.count().catch(() => 0),
    prisma.job.count().catch(() => 0),
    prisma.application.count().catch(() => 0),
    prisma.enrollment.count().catch(() => 0),
    prisma.certificate.count().catch(() => 0),
    prisma.user.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.job.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.application.count({ where: { appliedAt: { gte: since } } }).catch(() => 0),
    prisma.subscription
      .count({ where: { status: { in: ['active', 'trialing'] } } })
      .catch(() => 0),
    prisma.subscription.groupBy({ by: ['plan'], _count: { _all: true } }).catch(() => []),
  ])

  const totals = [
    { label: 'Pengguna', value: users, icon: Users, color: '#2563eb' },
    { label: 'Tenant', value: tenants, icon: Building2, color: '#0891b2' },
    { label: 'Lowongan', value: jobs, icon: Briefcase, color: '#16a34a' },
    { label: 'Lamaran', value: applications, icon: FileText, color: '#d97706' },
    { label: 'Pendaftaran Kursus', value: enrollments, icon: GraduationCap, color: '#7c3aed' },
    { label: 'Sertifikat', value: certificates, icon: Award, color: '#dc2626' },
  ]

  const last30 = [
    { label: 'Pengguna baru', value: newUsers },
    { label: 'Lowongan baru', value: newJobs },
    { label: 'Lamaran baru', value: newApplications },
  ]

  const planCount = (plan: string) =>
    planGroups.find((g) => g.plan === plan)?._count._all ?? 0

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Analitik Platform</h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan metrik pertumbuhan dan agregat data seluruh platform.
        </p>
      </header>

      <section>
        <h2 className="font-heading mb-4 text-xl">Total Keseluruhan</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {totals.map((item) => {
            const ItemIcon = item.icon
            return (
              <div key={item.label} className="border-border bg-card rounded-2xl border p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                >
                  <ItemIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="mt-3 text-2xl font-semibold">{item.value.toLocaleString('id-ID')}</div>
                <div className="text-muted-foreground text-xs">{item.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-4 text-xl">30 Hari Terakhir</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {last30.map((item) => (
            <div key={item.label} className="border-border bg-card rounded-2xl border p-5">
              <div className="text-muted-foreground text-sm">{item.label}</div>
              <div className="mt-1 text-3xl font-semibold">
                +{item.value.toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-4 text-xl">Distribusi Paket</h2>
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="mb-4 text-sm">
            <span className="text-muted-foreground">Langganan aktif: </span>
            <span className="font-semibold">{activeSubs.toLocaleString('id-ID')}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PLAN_ORDER.map((plan) => (
              <div key={plan}>
                <div className="text-muted-foreground text-xs capitalize">{plan.toLowerCase()}</div>
                <div className="mt-1 text-xl font-semibold">{planCount(plan)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
