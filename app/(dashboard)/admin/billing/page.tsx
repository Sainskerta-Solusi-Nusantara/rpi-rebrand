import { CreditCard } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Penagihan — Admin' }

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

const PLAN_ORDER = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'trialing') {
    return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300'
  }
  if (s === 'past_due' || s === 'unpaid' || s === 'incomplete') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
  }
  if (s === 'canceled' || s === 'incomplete_expired') {
    return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300'
  }
  return 'bg-muted text-muted-foreground'
}

export default async function AdminBillingPage() {
  await requireRole('ADMIN', 'SUPERADMIN')

  const [subs, planGroups, statusGroups] = await Promise.all([
    prisma.subscription
      .findMany({
        orderBy: { currentPeriodEnd: 'desc' },
        take: 100,
        select: {
          id: true,
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          tenant: { select: { name: true, slug: true } },
        },
      })
      .catch(() => []),
    prisma.subscription.groupBy({ by: ['plan'], _count: { _all: true } }).catch(() => []),
    prisma.subscription
      .groupBy({ by: ['status'], _count: { _all: true } })
      .catch(() => []),
  ])

  const planCount = (plan: string) =>
    planGroups.find((g) => g.plan === plan)?._count._all ?? 0
  const activeCount =
    statusGroups
      .filter((g) => ['active', 'trialing'].includes(g.status.toLowerCase()))
      .reduce((sum, g) => sum + g._count._all, 0) ?? 0
  const totalSubs = subs.length

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary inline-flex h-11 w-11 items-center justify-center rounded-2xl">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Penagihan</h1>
          <p className="text-muted-foreground mt-1">
            Langganan tenant, distribusi paket, dan status pembayaran.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground text-xs">Langganan Aktif</div>
          <div className="mt-1 text-2xl font-semibold">{activeCount}</div>
        </div>
        {PLAN_ORDER.map((plan) => (
          <div key={plan} className="border-border bg-card rounded-2xl border p-4">
            <div className="text-muted-foreground text-xs capitalize">
              {plan.toLowerCase()}
            </div>
            <div className="mt-1 text-2xl font-semibold">{planCount(plan)}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-heading mb-4 text-xl">Langganan Terbaru</h2>
        {totalSubs === 0 ? (
          <p className="text-muted-foreground border-border bg-card rounded-2xl border p-6 text-sm">
            Belum ada langganan tercatat.
          </p>
        ) : (
          <div className="border-border bg-card overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Paket</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Periode Berakhir</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((sub) => (
                  <tr key={sub.id} className="border-border/60 border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{sub.tenant.name}</div>
                      <div className="text-muted-foreground text-xs">/{sub.tenant.slug}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{sub.plan.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(sub.status)}`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {dateFmt.format(sub.currentPeriodEnd)}
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
