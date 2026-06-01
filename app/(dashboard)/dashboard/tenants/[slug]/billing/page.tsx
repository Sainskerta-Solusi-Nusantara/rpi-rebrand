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

function subscriptionStatusBadge(status: string): {
  label: string
  tone: string
} {
  switch (status) {
    case 'active':
      return { label: 'Aktif', tone: 'bg-green-100 text-green-800' }
    case 'cancelled':
      return { label: 'Dibatalkan', tone: 'bg-muted text-muted-foreground' }
    case 'past_due':
      return { label: 'Terlambat', tone: 'bg-red-100 text-red-800' }
    case 'trialing':
      return { label: 'Trial', tone: 'bg-amber-100 text-amber-900' }
    default:
      return { label: status, tone: 'bg-muted text-muted-foreground' }
  }
}

export default async function TenantBillingPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams?: { checkout?: string; session_id?: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/billing`)

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
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Billing & langganan</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Kelola plan berlangganan tenant{' '}
          <span className="text-foreground font-medium">{tenant.name}</span>.
        </p>
      </header>

      {!stripeReady && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Mode demo</strong> — set <code>STRIPE_SECRET_KEY</code> untuk
            aktifkan billing live. Tombol Stripe Checkout dan Customer Portal di
            bawah dinonaktifkan; perubahan plan masih tersedia via mock di
            bawah.
          </span>
        </div>
      )}

      {checkoutStatus === 'success' && (
        <div
          role="status"
          className="border-success/30 bg-success/10 text-success rounded-md border px-3 py-2 text-sm"
        >
          Pembayaran berhasil diproses. Status langganan akan diperbarui
          beberapa saat setelah webhook Stripe diterima.
        </div>
      )}
      {checkoutStatus === 'cancelled' && (
        <div
          role="status"
          className="border-border bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm"
        >
          Checkout dibatalkan. Anda dapat mencoba kembali kapan saja.
        </div>
      )}

      <section
        aria-label="Plan saat ini"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Plan saat ini</h2>
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
                Periode aktif:{' '}
                <span className="text-foreground">
                  {dateShort.format(activeSubscription.currentPeriodStart)} —{' '}
                  {dateShort.format(activeSubscription.currentPeriodEnd)}
                </span>
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  subscriptionStatusBadge(activeSubscription.status).tone
                }`}
              >
                {subscriptionStatusBadge(activeSubscription.status).label}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">
              Belum ada langganan tercatat untuk plan ini.
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
            <h2 className="font-heading text-lg">Pembayaran via Stripe</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Mulai berlangganan paket berbayar atau kelola metode pembayaran
            melalui portal pelanggan Stripe. Status langganan disinkronkan
            otomatis dari Stripe melalui webhook.
          </p>
          <div className="flex flex-wrap gap-3">
            {upgradablePlans.map((p) => (
              <StripeCheckoutButton
                key={p}
                tenantSlug={tenant.slug}
                plan={p}
                label={`Langganan ${p}`}
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
              Hanya OWNER yang dapat memulai checkout atau membuka portal.
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
            {stripeReady ? 'Plan (mode admin)' : 'Pilih plan'}
          </h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {stripeReady
            ? 'Ubah plan langsung tanpa lewat Stripe — gunakan hanya untuk koreksi admin atau testing.'
            : 'Bandingkan paket dan pilih plan yang sesuai. Perubahan berlaku segera dan periode billing 30 hari baru akan dimulai.'}
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
            Riwayat langganan ({history.length})
          </h2>
        </div>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada riwayat langganan untuk tenant ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Periode</th>
                  <th className="py-2 pr-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const tone =
                    planTone[s.plan] ?? 'bg-muted text-muted-foreground'
                  const badge = subscriptionStatusBadge(s.status)
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
                        {dateShort.format(s.currentPeriodStart)} —{' '}
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
