'use server'

/**
 * Server Actions invoked by the billing page UI to start a real Stripe
 * Checkout session or open the Customer Portal. Both are gated by the
 * `billing.update` permission (the closest existing analogue to the
 * requested `billing.manage`; `manage` does not exist in `lib/auth/rbac.ts`).
 *
 * Audit metadata convention: planTier, customerIdSuffix (last 8 chars only),
 * sessionId. No PII or secrets are persisted.
 */

import { headers } from 'next/headers'
import { z } from 'zod'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { AuditAction, PlanTier, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  createCheckoutSession,
  createBillingPortalSession,
  createOrGetCustomer,
  isStripeConfigured,
  priceIdForPlan,
} from '@/lib/billing/stripe'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

function customerSuffix(customerId?: string | null): string | null {
  if (!customerId) return null
  return customerId.length <= 8 ? customerId : customerId.slice(-8)
}

const checkoutSchema = z.object({
  tenantSlug: z.string().trim().min(1, 'Tenant tidak valid.'),
  plan: z.nativeEnum(PlanTier, {
    errorMap: () => ({ message: 'Plan tidak dikenali.' }),
  }),
})

const portalSchema = z.object({
  tenantSlug: z.string().trim().min(1, 'Tenant tidak valid.'),
})

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
}

/** Start a Stripe Checkout session; returns the hosted Checkout URL to redirect to. */
export async function startStripeCheckout(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const t = await getServerT()
  if (!isStripeConfigured()) {
    return { ok: false, error: t.srvBilling.stripe.demoMode }
  }

  const parsed = checkoutSchema.safeParse({
    tenantSlug: formData.get('tenantSlug'),
    plan: formData.get('plan'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.srvBilling.stripe.dataInvalid }
  }
  const { tenantSlug, plan } = parsed.data

  if (plan === 'FREE') {
    return { ok: false, error: t.srvBilling.stripe.freePlanNoCheckout }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvBilling.stripe.mustSignIn }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, name: true, stripeCustomerId: true },
  })
  if (!tenant) return { ok: false, error: t.srvBilling.stripe.tenantNotFound }

  const { globalRole, tenants, id: actorId, email, name } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'billing.update')) {
    return { ok: false, error: t.srvBilling.stripe.noBillingPermission }
  }

  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    return { ok: false, error: t.srvBilling.stripe.planUnavailable }
  }

  try {
    const customer = await createOrGetCustomer({
      tenantId: tenant.id,
      email: email ?? null,
      name: name ?? tenant.name,
    })

    const base = appUrl()
    const returnPath = `/dashboard/tenants/${tenant.slug}/billing`
    const checkoutSession = await createCheckoutSession({
      tenantId: tenant.id,
      customerId: customer.id,
      priceId,
      successUrl: `${base}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}${returnPath}?checkout=cancelled`,
    })

    if (!checkoutSession.url) {
      return { ok: false, error: t.srvBilling.stripe.stripeNoUrl }
    }

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: actorId,
        action: AuditAction.CREATE,
        resource: 'billing.checkout.started',
        resourceId: checkoutSession.id,
        metadata: {
          planTier: plan,
          customerId: customerSuffix(customer.id),
          sessionId: checkoutSession.id,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    return { ok: true, data: { url: checkoutSession.url } }
  } catch (err) {
    console.error('[startStripeCheckout] failed', err)
    const msg = err instanceof Error ? err.message : t.srvBilling.stripe.checkoutFailed
    return { ok: false, error: msg }
  }
}

/** Open the Stripe Customer Portal; returns the portal URL. */
export async function openBillingPortal(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const t = await getServerT()
  if (!isStripeConfigured()) {
    return { ok: false, error: t.srvBilling.stripe.demoMode }
  }

  const parsed = portalSchema.safeParse({
    tenantSlug: formData.get('tenantSlug'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.srvBilling.stripe.dataInvalid }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvBilling.stripe.mustSignIn }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: parsed.data.tenantSlug },
    select: { id: true, slug: true, name: true, stripeCustomerId: true, planTier: true },
  })
  if (!tenant) return { ok: false, error: t.srvBilling.stripe.tenantNotFound }

  const { globalRole, tenants, id: actorId, email, name } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'billing.update')) {
    return { ok: false, error: t.srvBilling.stripe.noBillingPermission }
  }

  try {
    const customer = await createOrGetCustomer({
      tenantId: tenant.id,
      email: email ?? null,
      name: name ?? tenant.name,
    })

    const base = appUrl()
    const portal = await createBillingPortalSession({
      customerId: customer.id,
      returnUrl: `${base}/dashboard/tenants/${tenant.slug}/billing`,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: actorId,
        action: AuditAction.UPDATE,
        resource: 'billing.portal.opened',
        resourceId: portal.id,
        metadata: {
          planTier: tenant.planTier,
          customerId: customerSuffix(customer.id),
          sessionId: portal.id,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    return { ok: true, data: { url: portal.url } }
  } catch (err) {
    console.error('[openBillingPortal] failed', err)
    const msg = err instanceof Error ? err.message : t.srvBilling.stripe.portalFailed
    return { ok: false, error: msg }
  }
}
