import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatDate } from '@/lib/i18n/format'

export const metadata = { title: 'Penagihan' }

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

export default async function PartnerBillingPage() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const tp = t.partner
  const planLabels: Record<string, string> = tp.plans
  const session = await getServerSession(authOptions)
  const tenantId = await resolveTenantId(session!.user.id)

  const [tenant, subscription] = await Promise.all([
    tenantId
      ? prisma.tenant.findUnique({ where: { id: tenantId } }).catch(() => null)
      : Promise.resolve(null),
    tenantId
      ? prisma.subscription
          .findFirst({
            where: { tenantId },
            orderBy: { currentPeriodEnd: 'desc' },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ])

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{tp.billing.title}</h1>
        <p className="text-muted-foreground mt-1">{tp.billing.subtitle}</p>
      </header>

      <section className="border-border bg-card rounded-xl border p-6">
        <h2 className="font-heading text-xl">{tp.billing.currentPlanHeading}</h2>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-muted-foreground text-sm">{tp.billing.planLabel}</div>
            <div className="font-heading text-2xl">
              {planLabels[tenant?.planTier ?? 'FREE'] ?? tp.plans.FREE}
            </div>
          </div>
          {subscription ? (
            <div className="text-sm">
              <div className="text-muted-foreground">{tp.billing.activePeriod}</div>
              <div className="font-medium">
                {formatDate(subscription.currentPeriodStart, locale)} –{' '}
                {formatDate(subscription.currentPeriodEnd, locale)}
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6">
          <a
            href="/partner/billing/upgrade"
            className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 font-medium"
          >
            {tp.billing.upgradeButton}
          </a>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">{tp.billing.historyHeading}</h2>
        <p className="text-muted-foreground">{tp.billing.historyEmpty}</p>
      </section>
    </div>
  )
}
