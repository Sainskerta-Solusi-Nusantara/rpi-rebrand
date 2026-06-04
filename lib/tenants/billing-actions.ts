'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'
import { dispatchTenantEvent } from '@/lib/webhooks/dispatch'
import { AuditAction, PlanTier, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, type Permission } from '@/lib/auth/rbac'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const planSchema = z.object({
  tenantSlug: z.string().trim().min(1),
  plan: z.nativeEnum(PlanTier),
})

const cancelSchema = z.object({
  tenantSlug: z.string().trim().min(1),
})

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

type LoadCtx =
  | { error: string }
  | {
      tenant: { id: string; slug: string; planTier: PlanTier }
      actorId: string
    }

/**
 * Resolve tenant + actor for billing operations, gated by the given permission.
 * Pass `billing.update` for mutations; `billing.view` for read-only paths.
 * Mirrors the LoadCtx pattern used by `branding-actions.ts`.
 */
async function loadTenantForBilling(
  tenantSlug: string,
  permission: Permission,
): Promise<LoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvBilling.tenantBilling.mustSignIn }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, planTier: true },
  })
  if (!tenant) return { error: t.srvBilling.tenantBilling.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: t.srvBilling.tenantBilling.noPermission }
  }
  return { tenant, actorId }
}

/**
 * Switch the tenant's plan tier.
 *
 * Semantics (mock — no Stripe integration yet):
 *  - Any currently-active Subscription rows are marked `status='cancelled'`
 *    (we may have at most one in normal flow but we defensively handle several).
 *  - A new Subscription row is created with the target plan, status `active`,
 *    currentPeriodStart = now, currentPeriodEnd = now + 30 days.
 *  - Tenant.planTier is updated immediately so feature gates flip on next read.
 *
 * NOTE: No webhook event is dispatched here — there is no `tenant.plan.*` event
 * in `lib/webhooks/events.ts` allowlist. Add one + dispatch when real billing lands.
 */
export async function updateTenantPlan(input: {
  tenantSlug: string
  plan: PlanTier
}): Promise<ActionResult<{ plan: PlanTier }>> {
  const t = await getServerT()
  const parsed = await localizedParse(planSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvBilling.tenantBilling.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, plan } = parsed.data

  const ctx = await loadTenantForBilling(tenantSlug, 'billing.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.tenant.planTier === plan) {
    return { ok: false, error: t.srvBilling.tenantBilling.alreadyOnPlan }
  }

  const fromPlan = ctx.tenant.planTier
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const meta = getRequestMeta()

  try {
    await prisma.$transaction(async (tx) => {
      // Defensive: cancel ALL currently-active subscriptions (normally 0 or 1).
      await tx.subscription.updateMany({
        where: { tenantId: ctx.tenant.id, status: 'active' },
        data: { status: 'cancelled' },
      })

      await tx.subscription.create({
        data: {
          tenantId: ctx.tenant.id,
          plan,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })

      await tx.tenant.update({
        where: { id: ctx.tenant.id },
        data: { planTier: plan },
      })

      await tx.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.UPDATE,
          resource: 'tenant.plan',
          resourceId: ctx.tenant.id,
          metadata: { from: fromPlan, to: plan } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    })

    dispatchTenantEvent(ctx.tenant.id, 'tenant.plan.changed', {
      tenantId: ctx.tenant.id,
      fromPlan,
      toPlan: plan,
      currentPeriodEnd: periodEnd.toISOString(),
    })

    revalidatePath(`/dashboard/tenants/${tenantSlug}/billing`)
    revalidatePath(`/dashboard/tenants/${tenantSlug}`)
    return { ok: true, data: { plan } }
  } catch (err) {
    console.error('[updateTenantPlan] failed', err)
    return { ok: false, error: t.srvBilling.tenantBilling.genericError }
  }
}

/**
 * Mark the tenant's latest active subscription as cancelled. The tenant keeps
 * its current `planTier` (features remain accessible until period end); the
 * subscription simply will not auto-renew. Mock semantics — no Stripe call.
 */
export async function cancelSubscription(
  tenantSlug: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = await localizedParse(cancelSchema, { tenantSlug })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvBilling.tenantBilling.dataInvalid,
    }
  }

  const ctx = await loadTenantForBilling(parsed.data.tenantSlug, 'billing.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const meta = getRequestMeta()

  try {
    const active = await prisma.subscription.findFirst({
      where: { tenantId: ctx.tenant.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, plan: true },
    })

    if (!active) {
      return { ok: false, error: t.srvBilling.tenantBilling.noActiveSubscription }
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: active.id },
        data: { status: 'cancelled' },
      })

      await tx.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.UPDATE,
          resource: 'tenant.subscription',
          resourceId: active.id,
          metadata: {
            from: 'active',
            to: 'cancelled',
            plan: active.plan,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    })

    revalidatePath(`/dashboard/tenants/${parsed.data.tenantSlug}/billing`)
    return { ok: true }
  } catch (err) {
    console.error('[cancelSubscription] failed', err)
    return { ok: false, error: t.srvBilling.tenantBilling.genericError }
  }
}
