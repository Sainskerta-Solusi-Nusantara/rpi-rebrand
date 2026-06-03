'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  bulkRetryDeadLetter,
  manuallyDeadLetter,
  manuallyRetryDelivery,
} from '@/lib/webhooks/retry-worker'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

/**
 * Look up a delivery + the tenant it belongs to, and verify the caller has
 * webhook-management permission within that tenant. RBAC uses `team.update`
 * (the same permission used to manage TenantWebhook rows themselves).
 */
async function authorizeDeliveryAction(
  deliveryId: string,
): Promise<
  | { error: string }
  | {
      actorId: string
      delivery: { id: string; webhookId: string }
      tenant: { id: string; slug: string }
    }
> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvSavedSearch.webhookDelivery.mustLogin }
  if (!deliveryId) return { error: t.srvSavedSearch.webhookDelivery.deliveryIdInvalid }

  const row = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      webhookId: true,
      webhook: {
        select: {
          tenantId: true,
          tenant: { select: { id: true, slug: true } },
        },
      },
    },
  })
  if (!row || !row.webhook) {
    return { error: t.srvSavedSearch.webhookDelivery.deliveryNotFound }
  }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(globalRole, tenants, row.webhook.tenantId, 'team.update')
  ) {
    return { error: t.srvSavedSearch.webhookDelivery.noPermission }
  }

  return {
    actorId,
    delivery: { id: row.id, webhookId: row.webhookId },
    tenant: row.webhook.tenant,
  }
}

/** Server action: re-queue one delivery for an immediate retry. */
export async function retryDeliveryAction(
  deliveryId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await authorizeDeliveryAction(deliveryId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const result = await manuallyRetryDelivery(deliveryId, ctx.actorId)
  if (!result.ok) {
    return { ok: false, error: result.error ?? t.srvSavedSearch.webhookDelivery.retryFailed }
  }

  revalidatePath(
    `/dashboard/tenants/${ctx.tenant.slug}/webhooks/${ctx.delivery.webhookId}/deliveries`,
  )
  revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/webhooks/dead-letter`)
  return { ok: true }
}

/** Server action: force one delivery into dead-letter. */
export async function deadLetterDeliveryAction(
  deliveryId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await authorizeDeliveryAction(deliveryId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const result = await manuallyDeadLetter(deliveryId, ctx.actorId)
  if (!result.ok) {
    return { ok: false, error: result.error ?? t.srvSavedSearch.webhookDelivery.deadLetterFailed }
  }

  revalidatePath(
    `/dashboard/tenants/${ctx.tenant.slug}/webhooks/${ctx.delivery.webhookId}/deliveries`,
  )
  revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/webhooks/dead-letter`)
  return { ok: true }
}

/**
 * Server action: bulk re-queue all (or a selected subset of) dead-letter
 * deliveries for one tenant. Verifies permission against the tenant.
 */
export async function bulkRetryDeadLetterAction(input: {
  tenantSlug: string
  deliveryIds: string[]
}): Promise<ActionResult<{ retried: number }>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvSavedSearch.webhookDelivery.mustLogin }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: input.tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { ok: false, error: t.srvSavedSearch.webhookDelivery.tenantNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
    return { ok: false, error: t.srvSavedSearch.webhookDelivery.noPermission }
  }

  const result = await bulkRetryDeadLetter(
    tenant.id,
    input.deliveryIds ?? [],
    actorId,
  )

  revalidatePath(`/dashboard/tenants/${tenant.slug}/webhooks/dead-letter`)
  return { ok: true, data: { retried: result.retried } }
}
