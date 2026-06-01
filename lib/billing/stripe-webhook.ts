/**
 * Stripe webhook event processor.
 *
 * Processes a known subset of subscription-lifecycle events and reconciles
 * the local `Subscription` + `Tenant.planTier` state. Events with no tenant
 * resolution are ignored silently (logged + no-op) so we never break the
 * webhook delivery loop on a partial dataset.
 *
 * Idempotency: the *outer* route handler (`app/api/stripe/webhook/route.ts`)
 * de-duplicates by `StripeWebhookEvent.eventId @unique`. Handlers here are
 * also designed to be safe on replay (upserts only).
 */
import { Prisma, AuditAction, PlanTier } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { planFromStripePrice } from '@/lib/billing/stripe'

type StripeEvent = {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}

type StripeSubscriptionObj = {
  id: string
  status: string
  customer: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end?: boolean
  items?: {
    data?: Array<{
      price?: { id?: string; lookup_key?: string | null }
    }>
  }
  metadata?: Record<string, string>
}

type StripeCheckoutObj = {
  id: string
  customer?: string | null
  subscription?: string | null
  mode?: string
  metadata?: Record<string, string>
}

type StripeInvoiceObj = {
  id: string
  customer?: string | null
  subscription?: string | null
  amount_paid?: number
  amount_due?: number
  status?: string
  hosted_invoice_url?: string | null
}

function fromUnix(seconds: number | undefined): Date {
  if (!seconds || !Number.isFinite(seconds)) return new Date()
  return new Date(seconds * 1000)
}

async function resolveTenantId(opts: {
  customerId?: string | null
  metadataTenantId?: string | null
}): Promise<string | null> {
  if (opts.metadataTenantId) {
    const t = await prisma.tenant.findUnique({
      where: { id: opts.metadataTenantId },
      select: { id: true },
    })
    if (t) return t.id
  }
  if (opts.customerId) {
    const t = await prisma.tenant.findUnique({
      where: { stripeCustomerId: opts.customerId },
      select: { id: true },
    })
    if (t) return t.id
  }
  return null
}

async function upsertSubscriptionFromStripe(sub: StripeSubscriptionObj): Promise<{
  tenantId: string
  plan: PlanTier
  status: string
} | null> {
  const tenantId = await resolveTenantId({
    customerId: sub.customer,
    metadataTenantId: sub.metadata?.tenantId,
  })
  if (!tenantId) {
    console.warn('[stripe-webhook] No tenant resolved for subscription', sub.id)
    return null
  }

  const item = sub.items?.data?.[0]?.price
  const plan = planFromStripePrice(item?.id ?? null, item?.lookup_key ?? null) as PlanTier

  const periodStart = fromUnix(sub.current_period_start)
  const periodEnd = fromUnix(sub.current_period_end)
  const status = sub.status ?? 'active'

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
      select: { id: true },
    })

    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: {
          plan,
          status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      })
    } else {
      // Defensive: cancel other active rows so only one is "active" at a time.
      if (status === 'active' || status === 'trialing') {
        await tx.subscription.updateMany({
          where: { tenantId, status: 'active' },
          data: { status: 'cancelled' },
        })
      }
      await tx.subscription.create({
        data: {
          tenantId,
          plan,
          status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: sub.id,
        },
      })
    }

    // Flip the tenant tier on active/trialing; revert to FREE when canceled.
    if (status === 'active' || status === 'trialing') {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { planTier: plan },
      })
    } else if (status === 'canceled' || status === 'incomplete_expired') {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { planTier: PlanTier.FREE },
      })
    }
  })

  return { tenantId, plan, status }
}

async function writeAudit(tenantId: string, eventType: string, sub?: StripeSubscriptionObj, extra?: Record<string, unknown>) {
  try {
    // Pick a system actor: tenant.ownerUserId if present, otherwise skip.
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerUserId: true },
    })
    if (!tenant?.ownerUserId) return
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: tenant.ownerUserId,
        action: AuditAction.UPDATE,
        resource: `billing.webhook.${eventType}`,
        resourceId: sub?.id ?? null,
        metadata: {
          status: sub?.status,
          stripeSubscriptionId: sub?.id,
          ...extra,
        } as Prisma.InputJsonValue,
      },
    })
  } catch (err) {
    console.error('[stripe-webhook] audit log failed', err)
  }
}

export async function handleStripeEvent(event: StripeEvent): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const obj = event.data.object as StripeCheckoutObj
      if (obj.mode !== 'subscription' || !obj.subscription) return
      // Fetch & upsert via the subscription branch — but the route handler
      // doesn't need to re-fetch; the subscription.updated event arrives too.
      // We still try to map customerId → tenantId metadata for safety.
      const tenantId = await resolveTenantId({
        customerId: obj.customer ?? null,
        metadataTenantId: obj.metadata?.tenantId ?? null,
      })
      if (tenantId) {
        await writeAudit(tenantId, 'checkout.completed', undefined, {
          sessionId: obj.id,
          subscriptionId: obj.subscription,
        })
      }
      return
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as StripeSubscriptionObj
      const result = await upsertSubscriptionFromStripe(sub)
      if (result) {
        await writeAudit(result.tenantId, 'subscription.updated', sub, {
          plan: result.plan,
        })
        const tenant = await prisma.tenant.findUnique({
          where: { id: result.tenantId },
          select: { slug: true },
        })
        if (tenant) {
          revalidatePath(`/dashboard/tenants/${tenant.slug}/billing`)
        }
      }
      return
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as StripeSubscriptionObj
      const tenantId = await resolveTenantId({
        customerId: sub.customer,
        metadataTenantId: sub.metadata?.tenantId,
      })
      if (!tenantId) return
      await prisma.$transaction(async (tx) => {
        await tx.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'cancelled' },
        })
        await tx.tenant.update({
          where: { id: tenantId },
          data: { planTier: PlanTier.FREE },
        })
      })
      await writeAudit(tenantId, 'subscription.deleted', sub)
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true },
      })
      if (tenant) {
        revalidatePath(`/dashboard/tenants/${tenant.slug}/billing`)
      }
      return
    }

    case 'invoice.payment_succeeded': {
      const inv = event.data.object as StripeInvoiceObj
      const tenantId = await resolveTenantId({
        customerId: inv.customer ?? null,
        metadataTenantId: null,
      })
      if (!tenantId) return
      await writeAudit(tenantId, 'invoice.payment_succeeded', undefined, {
        invoiceId: inv.id,
        amountPaid: inv.amount_paid,
        subscriptionId: inv.subscription,
      })
      return
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as StripeInvoiceObj
      const tenantId = await resolveTenantId({
        customerId: inv.customer ?? null,
        metadataTenantId: null,
      })
      if (!tenantId) return
      // Mark subscription past_due if we know it.
      if (inv.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: inv.subscription },
          data: { status: 'past_due' },
        })
      }
      await writeAudit(tenantId, 'invoice.payment_failed', undefined, {
        invoiceId: inv.id,
        amountDue: inv.amount_due,
        subscriptionId: inv.subscription,
      })
      return
    }

    default:
      // Unhandled event type — no-op. We still recorded it in StripeWebhookEvent
      // at the route layer so we can replay/audit later.
      return
  }
}
