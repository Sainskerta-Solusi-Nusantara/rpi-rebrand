'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/webhooks/events'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const MAX_WEBHOOKS_PER_TENANT = 20
const WEBHOOK_SECRET_PREFIX = 'whsec_'

const eventSchema = z.enum(WEBHOOK_EVENTS)

const urlSchema = z
  .string()
  .trim()
  .min(1, 'URL wajib diisi')
  .max(2048, 'URL terlalu panjang')
  .refine(
    (raw) => {
      try {
        const u = new URL(raw)
        if (u.protocol === 'https:') return true
        if (u.protocol === 'http:' && /^localhost(:\d+)?$/i.test(u.host)) return true
        return false
      } catch {
        return false
      }
    },
    'URL harus menggunakan HTTPS (atau http://localhost untuk pengujian)',
  )

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(80, 'Nama maksimal 80 karakter')

const createSchema = z.object({
  tenantSlug: z.string().min(1),
  name: nameSchema,
  url: urlSchema,
  events: z.array(eventSchema).min(1, 'Pilih minimal satu event'),
})

const updateSchema = z.object({
  webhookId: z.string().min(1),
  name: nameSchema,
  url: urlSchema,
  events: z.array(eventSchema).min(1, 'Pilih minimal satu event'),
  enabled: z.boolean(),
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

/** Generate a fresh signing secret: `whsec_<base64url(32 bytes)>`. */
function generateWebhookSecret(): string {
  return `${WEBHOOK_SECRET_PREFIX}${randomBytes(32).toString('base64url')}`
}

type TenantCtx =
  | { error: string }
  | { tenant: { id: string; slug: string }; actorId: string }

async function loadTenantForWebhook(tenantSlug: string): Promise<TenantCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvSavedSearch.tenantWebhook.mustLogin }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvSavedSearch.tenantWebhook.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
    return { error: t.srvSavedSearch.tenantWebhook.noPermission }
  }
  return { tenant, actorId }
}

type WebhookCtx =
  | { error: string }
  | {
      webhook: {
        id: string
        tenantId: string
        name: string
        url: string
        events: string[]
        enabled: boolean
      }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadWebhookForUpdate(webhookId: string): Promise<WebhookCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvSavedSearch.tenantWebhook.mustLogin }
  }
  if (!webhookId) return { error: t.srvSavedSearch.tenantWebhook.webhookIdInvalid }

  const webhook = await prisma.tenantWebhook.findUnique({
    where: { id: webhookId },
    select: {
      id: true,
      tenantId: true,
      name: true,
      url: true,
      events: true,
      enabled: true,
      tenant: { select: { id: true, slug: true } },
    },
  })
  if (!webhook) return { error: t.srvSavedSearch.tenantWebhook.webhookNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, webhook.tenantId, 'team.update')) {
    return { error: t.srvSavedSearch.tenantWebhook.noPermission }
  }

  return {
    webhook: {
      id: webhook.id,
      tenantId: webhook.tenantId,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      enabled: webhook.enabled,
    },
    tenant: webhook.tenant,
    actorId,
  }
}

/**
 * Create a new webhook subscription for a tenant. The signing secret is shown
 * to the caller exactly once (returned in `data.secret`) — never readable
 * afterwards in the UI; rotation is required to recover.
 */
export async function createTenantWebhook(input: {
  tenantSlug: string
  name: string
  url: string
  events: string[]
}): Promise<ActionResult<{ id: string; secret: string }>> {
  const t = await getServerT()
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvSavedSearch.tenantWebhook.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data

  const ctx = await loadTenantForWebhook(data.tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const count = await prisma.tenantWebhook.count({
      where: { tenantId: ctx.tenant.id },
    })
    if (count >= MAX_WEBHOOKS_PER_TENANT) {
      return {
        ok: false,
        error: t.srvSavedSearch.tenantWebhook.limitReached,
      }
    }

    const secret = generateWebhookSecret()
    const created = await prisma.tenantWebhook.create({
      data: {
        tenantId: ctx.tenant.id,
        name: data.name,
        url: data.url,
        secret,
        events: data.events as WebhookEvent[],
        enabled: true,
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.webhook',
        resourceId: created.id,
        metadata: {
          name: data.name,
          url: data.url,
          events: data.events,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${data.tenantSlug}/webhooks`)
    return { ok: true, data: { id: created.id, secret } }
  } catch (err) {
    console.error('[createTenantWebhook] failed', err)
    return { ok: false, error: t.srvSavedSearch.tenantWebhook.genericFailed }
  }
}

export async function updateTenantWebhook(input: {
  webhookId: string
  name: string
  url: string
  events: string[]
  enabled: boolean
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvSavedSearch.tenantWebhook.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data

  const ctx = await loadWebhookForUpdate(data.webhookId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const before = ctx.webhook
    const after = {
      name: data.name,
      url: data.url,
      events: data.events as WebhookEvent[],
      enabled: data.enabled,
    }

    await prisma.tenantWebhook.update({
      where: { id: data.webhookId },
      data: after,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.webhook',
        resourceId: data.webhookId,
        metadata: {
          before: {
            name: before.name,
            url: before.url,
            events: before.events,
            enabled: before.enabled,
          },
          after,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/webhooks`)
    return { ok: true }
  } catch (err) {
    console.error('[updateTenantWebhook] failed', err)
    return { ok: false, error: t.srvSavedSearch.tenantWebhook.genericFailed }
  }
}

/**
 * Toggle the enabled flag without touching url/events. Convenience action
 * driven by a one-click switch in the row UI.
 */
export async function toggleTenantWebhook(input: {
  webhookId: string
  enabled: boolean
}): Promise<ActionResult> {
  const t = await getServerT()
  if (!input.webhookId) return { ok: false, error: t.srvSavedSearch.tenantWebhook.webhookIdInvalid }
  const ctx = await loadWebhookForUpdate(input.webhookId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    await prisma.tenantWebhook.update({
      where: { id: input.webhookId },
      data: { enabled: input.enabled },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.webhook',
        resourceId: input.webhookId,
        metadata: {
          enabled: { from: ctx.webhook.enabled, to: input.enabled },
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/webhooks`)
    return { ok: true }
  } catch (err) {
    console.error('[toggleTenantWebhook] failed', err)
    return { ok: false, error: t.srvSavedSearch.tenantWebhook.genericFailed }
  }
}

/**
 * Hard-delete a webhook. We do not retain the row because webhooks are a
 * configuration artefact (not a security trail) — once removed they no longer
 * receive events. The audit log keeps the resourceId pointer for compliance.
 *
 * Delivery rows cascade via the schema relation.
 */
export async function revokeTenantWebhook(webhookId: string): Promise<ActionResult> {
  const t = await getServerT()
  if (!webhookId) return { ok: false, error: t.srvSavedSearch.tenantWebhook.webhookIdInvalid }
  const ctx = await loadWebhookForUpdate(webhookId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.tenantWebhook.delete({ where: { id: webhookId } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.REVOKE,
          resource: 'tenant.webhook',
          resourceId: webhookId,
          metadata: {
            name: ctx.webhook.name,
            url: ctx.webhook.url,
            events: ctx.webhook.events,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/webhooks`)
    return { ok: true }
  } catch (err) {
    console.error('[revokeTenantWebhook] failed', err)
    return { ok: false, error: t.srvSavedSearch.tenantWebhook.genericFailed }
  }
}

/**
 * Rotate a webhook's signing secret. The new secret is returned ONCE — the
 * caller must surface it immediately; subsequent reads only see the
 * truncated prefix in the UI.
 */
export async function rotateTenantWebhookSecret(
  webhookId: string,
): Promise<ActionResult<{ secret: string }>> {
  const t = await getServerT()
  if (!webhookId) return { ok: false, error: t.srvSavedSearch.tenantWebhook.webhookIdInvalid }
  const ctx = await loadWebhookForUpdate(webhookId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const secret = generateWebhookSecret()
    await prisma.tenantWebhook.update({
      where: { id: webhookId },
      data: { secret },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.webhook.secret',
        resourceId: webhookId,
        metadata: { name: ctx.webhook.name, rotated: true },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/webhooks`)
    return { ok: true, data: { secret } }
  } catch (err) {
    console.error('[rotateTenantWebhookSecret] failed', err)
    return { ok: false, error: t.srvSavedSearch.tenantWebhook.genericFailed }
  }
}
