'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'node:crypto'
import { promises as dns } from 'node:dns'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

// RFC-ish hostname check: lowercase, no protocol, no path. Each label 1-63
// chars, must start & end alphanumeric, hyphens allowed in between. Requires
// at least one dot (apex or subdomain).
const DOMAIN_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/

const TXT_RECORD_PREFIX = '_rpi-verify'
const TOKEN_PREFIX = 'ssn-verify-'
const DNS_LOOKUP_TIMEOUT_MS = 3000

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
      tenant: {
        id: string
        slug: string
        customDomain: string | null
        domainVerificationToken: string | null
        domainVerifiedAt: Date | null
      }
      actorId: string
      globalRole: import('@/types/next-auth').GlobalRole
    }

async function loadTenantForDomain(
  tenantSlug: string,
  t: Awaited<ReturnType<typeof getServerT>>,
): Promise<LoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant2.domain.mustSignIn }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
      customDomain: true,
      domainVerificationToken: true,
      domainVerifiedAt: true,
    },
  })
  if (!tenant) return { error: t.srvTenant2.domain.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'tenant.update')) {
    return { error: t.srvTenant2.domain.noPermission }
  }
  return { tenant, actorId, globalRole }
}

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '')
}

function generateVerificationToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(16).toString('base64url')}`
}

/**
 * Set or update the tenant's custom domain.
 *
 * Generates a verification token shaped `ssn-verify-<base64url(16)>` that
 * the tenant must publish as a TXT record under `_rpi-verify.<domain>`.
 * Resets `domainVerifiedAt` so the new value must be re-verified.
 */
export async function setCustomDomain(input: {
  tenantSlug: string
  domain: string
}): Promise<
  ActionResult<{
    domain: string
    token: string
    record: { name: string; type: 'TXT'; value: string }
  }>
> {
  const t = await getServerT()
  const ctx = await loadTenantForDomain(input.tenantSlug, t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const domain = normalizeDomain(String(input.domain ?? ''))
  if (!domain) {
    return { ok: false, error: t.srvTenant2.domain.domainRequired, field: 'domain' }
  }
  if (domain.length > 253) {
    return { ok: false, error: t.srvTenant2.domain.domainTooLong, field: 'domain' }
  }
  if (!DOMAIN_RE.test(domain)) {
    return {
      ok: false,
      error: t.srvTenant2.domain.domainFormatInvalid,
      field: 'domain',
    }
  }

  try {
    const taken = await prisma.tenant.findFirst({
      where: { customDomain: domain, NOT: { id: ctx.tenant.id } },
      select: { id: true },
    })
    if (taken) {
      return {
        ok: false,
        error: t.srvTenant2.domain.domainTaken,
        field: 'domain',
      }
    }

    const token = generateVerificationToken()
    const record = {
      name: `${TXT_RECORD_PREFIX}.${domain}`,
      type: 'TXT' as const,
      value: token,
    }

    await prisma.tenant.update({
      where: { id: ctx.tenant.id },
      data: {
        customDomain: domain,
        domainVerificationToken: token,
        domainVerifiedAt: null,
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.domain',
        resourceId: ctx.tenant.id,
        metadata: {
          from: ctx.tenant.customDomain,
          to: domain,
          tokenIssued: true,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${input.tenantSlug}/domain`)
    return { ok: true, data: { domain, token, record } }
  } catch (err) {
    console.error('[setCustomDomain] failed', err)
    return { ok: false, error: t.srvTenant2.domain.genericError }
  }
}

async function resolveTxtWithTimeout(
  host: string,
  timeoutMs: number,
): Promise<string[][] | { timeout: true } | { error: string }> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    const result = await Promise.race<
      string[][] | { timeout: true }
    >([
      dns.resolveTxt(host),
      new Promise<{ timeout: true }>((resolve) => {
        timer = setTimeout(() => resolve({ timeout: true }), timeoutMs)
      }),
    ])
    return result
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
    return { error: code || 'DNS_ERROR' }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Verify the tenant's custom domain.
 *
 * Looks up the TXT record at `_rpi-verify.<customDomain>` (3s timeout) and
 * checks at least one TXT chunk equals the stored verification token.
 *
 * Bypass mechanism (development & support): if `bypass === true`, the actor
 * must have global role SUPERADMIN. This lets us mark verification without a
 * live DNS lookup — useful in local dev (where TXT lookups will fail) and for
 * support cases where DNS propagation is delayed. Bypassed verifications are
 * recorded in the audit log with `bypass: true`.
 */
export async function verifyCustomDomain(
  tenantSlug: string,
  options?: { bypass?: boolean },
): Promise<ActionResult<{ verifiedAt: Date; bypass: boolean }>> {
  const t = await getServerT()
  const ctx = await loadTenantForDomain(tenantSlug, t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const { tenant } = ctx
  if (!tenant.customDomain) {
    return { ok: false, error: t.srvTenant2.domain.setDomainFirst }
  }
  if (!tenant.domainVerificationToken) {
    return {
      ok: false,
      error: t.srvTenant2.domain.tokenMissing,
    }
  }

  const bypass = options?.bypass === true
  if (bypass && ctx.globalRole !== 'SUPERADMIN') {
    return { ok: false, error: t.srvTenant2.domain.superadminOnly }
  }

  let verifiedVia: 'dns' | 'bypass' = 'dns'

  if (bypass) {
    verifiedVia = 'bypass'
  } else {
    const host = `${TXT_RECORD_PREFIX}.${tenant.customDomain}`
    const lookup = await resolveTxtWithTimeout(host, DNS_LOOKUP_TIMEOUT_MS)

    if (Array.isArray(lookup)) {
      const expected = tenant.domainVerificationToken
      const matched = lookup.some((chunks) => chunks.join('').trim() === expected)
      if (!matched) {
        return {
          ok: false,
          error: t.srvTenant2.domain.txtMismatch,
        }
      }
    } else if ('timeout' in lookup) {
      return {
        ok: false,
        error: t.srvTenant2.domain.dnsTimeout,
      }
    } else {
      return {
        ok: false,
        error: t.srvTenant2.domain.txtNotFound,
      }
    }
  }

  try {
    const now = new Date()
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { domainVerifiedAt: now },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.domain',
        resourceId: tenant.id,
        metadata: {
          verified: true,
          domain: tenant.customDomain,
          via: verifiedVia,
          bypass: verifiedVia === 'bypass',
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${tenantSlug}/domain`)
    return { ok: true, data: { verifiedAt: now, bypass: verifiedVia === 'bypass' } }
  } catch (err) {
    console.error('[verifyCustomDomain] failed', err)
    return { ok: false, error: t.srvTenant2.domain.genericError }
  }
}

/**
 * Detach the tenant's custom domain. Clears customDomain, token, and
 * verifiedAt so the tenant returns to the platform-default hostname.
 */
export async function removeCustomDomain(
  tenantSlug: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadTenantForDomain(tenantSlug, t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (!ctx.tenant.customDomain) {
    return { ok: true }
  }

  try {
    const prior = ctx.tenant.customDomain
    await prisma.tenant.update({
      where: { id: ctx.tenant.id },
      data: {
        customDomain: null,
        domainVerificationToken: null,
        domainVerifiedAt: null,
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.DELETE,
        resource: 'tenant.domain',
        resourceId: ctx.tenant.id,
        metadata: { from: prior, to: null } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${tenantSlug}/domain`)
    return { ok: true }
  } catch (err) {
    console.error('[removeCustomDomain] failed', err)
    return { ok: false, error: t.srvTenant2.domain.genericError }
  }
}
