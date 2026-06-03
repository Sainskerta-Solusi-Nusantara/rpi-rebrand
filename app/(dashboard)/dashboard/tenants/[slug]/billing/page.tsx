import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ChevronLeft, CreditCard, History, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { PlanSelectionForm } from '@/components/organisms/tenant-billing-form'
import { StripeCheckoutButton } from '@/components/organisms/stripe-checkout-button'
import { StripePortalButton } from '@/components/organisms/stripe-portal-button'
import { isStripeConfigured } from '@/lib/billing/stripe'
import { getServerT } from '@/lib/i18n/server-dictionary'
import type { PlanTier } from '@prisma/client'

export const metadata = { title: 'Billing Tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateShort = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

const planTone: Record<string, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PRO: 'bg-blue-100 text-blue-800',
  BUSINESS: 'bg-purple-100 text-purple-800',
  ENTERPRISE: 'bg-amber-100 text-amber-900',
}

export default async function TenantBillingPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams?: { checkout?: string; session_id?: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/billing`)
  const t = await getServerT()

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        planTier: true,
        stripeCustomerId: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            plan: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            stripeSubscriptionId: true,
            createdAt: true,
          },
        },
      },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'billing.view')) {
    notFound()
  }

  const canEdit = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'billing.update',
  )

  function subscriptionStatusLabel(status: string): { label: string; tone: string } {
    switch (status) {
      case 'active':
        return { label: t.pagesTenant1.billing.statusActive, tone: 'bg-green-100 text-green-800' }
      case 'cancelled':
        return { label: t.pagesTenant1.billing.statusCancelled, tone: 'bg-muted text-muted-foreground' }
      case 'past_due':
        return { label: t.pagesTenant1.billing.statusPastDue, tone: 'bg-red-100 text-red-800' }
      case 'trialing':
        return { label: t.pagesTenant1.billing.statusTrialing, tone: 'bg-amber-100 text-amber-900' }
      default:
        return { label: status, tone: 'bg-muted text-muted-foreground' }
    }
  }

  const stripeReady = isStripeConfigured()
  const checkoutStatus = searchParams?.checkout
  const upgradablePlans: PlanTier[] = ['PRO', 'BUSINESS', 'ENTERPRISE']

  const activeSubscription =
    tenant.subscriptions.find((s) => s.status === 'active') ?? null
  const history = tenant.subscriptions

  const currentTone =
    planTone[tenant.planTier] ?? 'bg-muted text-muted-foreground'

  return (
    <div className="max-w-6xl space-y-8 p-6">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant1.billing.backLink.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">{t.pagesTenant1.billing.heading}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.pagesTenant1.billing.subheading.replace('{name}', tenant.name)}
        </p>
      </header>

      {!stripeReady && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>{t.pagesTenant1.billing.demoBanner}</strong> &mdash;{' '}
            {t.pagesTenant1.billing.demoBannerDesc.replace('{key}', 'STRIPE_SECRET_KEY')}
          </span>
        </div>
      )}

      {checkoutStatus === 'success' && (
        <div
          role="status"
          className="border-success/30 bg-success/10 text-success rounded-md border px-3 py-2 text-sm"
        >
          {t.pagesTenant1.billing.checkoutSuccess}
        </div>
      )}
      {checkoutStatus === 'cancelled' && (
        <div
          role="status"
          className="border-border bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm"
        >
          {t.pagesTenant1.billing.checkoutCancelled}
        </div>
      )}

      <section
        aria-label="Plan saat ini"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.pagesTenant1.billing.currentPlanHeading}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${currentTone}`}
          >
            {tenant.planTier}
          </span>
          {activeSubscription ? (
            <>
              <span className="text-muted-foreground text-sm">
                {t.pagesTenant1.billing.activePeriod}{' '}
                <span className="text-foreground">
                  {dateShort.format(activeSubscription.currentPeriodStart)} &mdash;{' '}
                  {dateShort.format(activeSubscription.currentPeriodEnd)}
                </span>
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  subscriptionStatusLabel(activeSubscription.status).tone
                }`}
              >
                {subscriptionStatusLabel(activeSubscription.status).label}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">
              {t.pagesTenant1.billing.noSubscription}
            </span>
          )}
        </div>
      </section>

      {stripeReady && (
        <section
          aria-label="Pembayaran Stripe"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">{t.pagesTenant1.billing.stripeHeading}</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            {t.pagesTenant1.billing.stripeDesc}
          </p>
          <div className="flex flex-wrap gap-3">
            {upgradablePlans.map((p) => (
              <StripeCheckoutButton
                key={p}
                tenantSlug={tenant.slug}
                plan={p}
                label={t.pagesTenant1.billing.subscribeBtn.replace('{plan}', p)}
                disabled={!canEdit || tenant.planTier === p}
                variant={tenant.planTier === p ? 'secondary' : 'primary'}
              />
            ))}
            {tenant.stripeCustomerId && (
              <StripePortalButton
                tenantSlug={tenant.slug}
                disabled={!canEdit}
              />
            )}
          </div>
          {!canEdit && (
            <p className="text-muted-foreground mt-3 text-xs">
              {t.pagesTenant1.billing.ownerOnlyHint}
            </p>
          )}
        </section>
      )}

      <section
        aria-label="Pilih plan"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            {stripeReady ? t.pagesTenant1.billing.selectPlanHeading : t.pagesTenant1.billing.selectPlanHeadingDemo}
          </h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {stripeReady
            ? t.pagesTenant1.billing.selectPlanDescAdmin
            : t.pagesTenant1.billing.selectPlanDescDemo}
        </p>
        <PlanSelectionForm
          tenantSlug={tenant.slug}
          currentPlan={tenant.planTier}
          canEdit={canEdit}
        />
      </section>

      <section
        aria-label="Riwayat langganan"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            {t.pagesTenant1.billing.historyHeading.replace('{n}', String(history.length))}
          </h2>
        </div>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t.pagesTenant1.billing.historyEmpty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.billing.tablePlan}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.billing.tableStatus}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.billing.tablePeriod}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.billing.tableCreated}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const tone =
                    planTone[s.plan] ?? 'bg-muted text-muted-foreground'
                  const badge = subscriptionStatusLabel(s.status)
                  return (
                    <tr
                      key={s.id}
                      className="border-border/60 border-b last:border-b-0"
                    >
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
                        >
                          {s.plan}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">
                        {dateShort.format(s.currentPeriodStart)} &mdash;{' '}
                        {dateShort.format(s.currentPeriodEnd)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">
                        {dateFmt.format(s.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
