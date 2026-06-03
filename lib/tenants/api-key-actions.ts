'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  TENANT_API_KEY_SCOPES,
  generateTenantApiKey,
  hashTenantApiKey,
  type TenantApiKeyScope,
} from '@/lib/tenants/api-key'
import { dispatchTenantEvent } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const MAX_KEYS_PER_TENANT = 20

const expirySchema = z.enum(['none', '30d', '90d', '180d', '365d'])
type ExpiryChoice = z.infer<typeof expirySchema>

function expiryToDate(choice: ExpiryChoice): Date | null {
  const days: Record<Exclude<ExpiryChoice, 'none'>, number> = {
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
  }
  if (choice === 'none') return null
  return new Date(Date.now() + days[choice] * 24 * 60 * 60 * 1000)
}

const createSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80, 'Maks 80 karakter'),
  expiry: expirySchema.default('90d'),
  scopes: z.array(z.enum(TENANT_API_KEY_SCOPES)).min(1, 'Pilih minimal satu scope'),
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
  | { tenant: { id: string; slug: string }; actorId: string }

async function loadTenantForApiKey(tenantSlug: string): Promise<LoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant1.apiKey.mustLogin }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvTenant1.apiKey.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
    return { error: t.srvTenant1.apiKey.noPermission }
  }
  return { tenant, actorId }
}

/**
 * Create a new tenant API key. Returns the plain token ONCE — caller must
 * show it to the user immediately and not store it; the DB only retains a
 * sha256 hash.
 */
export async function createTenantApiKey(input: {
  tenantSlug: string
  values: FormData
}): Promise<ActionResult<{ plain: string; prefix: string; expiresAt: Date | null }>> {
  const ctx = await loadTenantForApiKey(input.tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const t = await getServerT()
  const fd = input.values
  const scopesRaw = fd.getAll('scopes').map((v) => String(v))
  const parsed = createSchema.safeParse({
    name: fd.get('name'),
    expiry: fd.get('expiry') ?? 'none',
    scopes: scopesRaw,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant1.apiKey.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { name, expiry, scopes } = parsed.data

  try {
    const activeCount = await prisma.tenantApiKey.count({
      where: { tenantId: ctx.tenant.id, revokedAt: null },
    })
    if (activeCount >= MAX_KEYS_PER_TENANT) {
      return {
        ok: false,
        error: t.srvTenant1.apiKey.limitReached.replace('{max}', String(MAX_KEYS_PER_TENANT)),
      }
    }

    const { plain, prefix } = generateTenantApiKey()
    const tokenHash = hashTenantApiKey(plain)
    const expiresAt = expiryToDate(expiry)
    const meta = getRequestMeta()

    const created = await prisma.tenantApiKey.create({
      data: {
        tenantId: ctx.tenant.id,
        createdById: ctx.actorId,
        name,
        tokenHash,
        tokenPrefix: prefix,
        scopes: scopes as TenantApiKeyScope[],
        expiresAt,
      },
      select: { id: true },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.api_key',
        resourceId: created.id,
        metadata: { name, scopes, expiresAt: expiresAt?.toISOString() ?? null },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    dispatchTenantEvent(ctx.tenant.id, 'tenant.api_key.created', {
      apiKeyId: created.id,
      name,
      scopes,
      expiresAt: expiresAt?.toISOString() ?? null,
    })

    revalidatePath(`/dashboard/tenants/${input.tenantSlug}/api-keys`)
    return { ok: true, data: { plain, prefix, expiresAt } }
  } catch (err) {
    console.error('[createTenantApiKey] failed', err)
    return { ok: false, error: t.srvTenant1.apiKey.createFailed }
  }
}

export async function revokeTenantApiKey(keyId: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvTenant1.apiKey.mustLogin }
  if (!keyId) return { ok: false, error: t.srvTenant1.apiKey.keyIdInvalid }

  try {
    const key = await prisma.tenantApiKey.findUnique({
      where: { id: keyId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        revokedAt: true,
        tenant: { select: { slug: true } },
      },
    })
    if (!key) return { ok: false, error: t.srvTenant1.apiKey.keyNotFound }

    const { globalRole, tenants } = session.user
    if (!hasTenantPermission(globalRole, tenants, key.tenantId, 'team.update')) {
      return { ok: false, error: t.srvTenant1.apiKey.noPermission }
    }
    if (key.revokedAt) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.tenantApiKey.update({
        where: { id: keyId },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: key.tenantId,
          userId: session.user.id,
          action: AuditAction.REVOKE,
          resource: 'tenant.api_key',
          resourceId: keyId,
          metadata: { name: key.name },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    dispatchTenantEvent(key.tenantId, 'tenant.api_key.revoked', {
      apiKeyId: keyId,
      name: key.name,
    })

    if (key.tenant?.slug) {
      revalidatePath(`/dashboard/tenants/${key.tenant.slug}/api-keys`)
    }
    return { ok: true }
  } catch (err) {
    console.error('[revokeTenantApiKey] failed', err)
    return { ok: false, error: t.srvTenant1.apiKey.revokeFailed }
  }
}
