'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction, NotificationType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

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

async function loadTenantByOwner(
  tenantSlug: string,
): Promise<{ id: string; slug: string; name: string; ownerUserId: string | null } | null> {
  if (!tenantSlug) return null
  return prisma.tenant
    .findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true, ownerUserId: true },
    })
    .catch(() => null)
}

/**
 * OWNER-only — flip `Tenant.requireTwoFactor`. Audits the policy change.
 * When turned ON, members without 2FA will be blocked at the dashboard
 * entry by `userMustEnrollTwoFactor` (see `lib/auth/totp-policy.ts`).
 */
export async function setTenantTwoFactorRequirement(
  tenantSlug: string,
  required: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: 'Anda harus masuk.' }

  const tenant = await loadTenantByOwner(tenantSlug)
  if (!tenant) return { ok: false, error: 'Tenant tidak ditemukan.' }

  const isOwner =
    tenant.ownerUserId === session.user.id ||
    session.user.globalRole === 'SUPERADMIN'
  if (!isOwner) {
    return { ok: false, error: 'Hanya OWNER tenant yang dapat mengubah kebijakan ini.' }
  }

  try {
    const current = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { requireTwoFactor: true },
    })
    if (!current) return { ok: false, error: 'Tenant tidak ditemukan.' }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenant.id },
        data: { requireTwoFactor: Boolean(required) },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: session.user.id,
          action: AuditAction.UPDATE,
          resource: 'tenant.security.two_factor.policy_updated',
          resourceId: tenant.id,
          metadata: {
            required: Boolean(required),
            previous: current.requireTwoFactor,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/dashboard/tenants/${tenantSlug}/keamanan`)
    revalidatePath(`/dashboard/tenants/${tenantSlug}`)
    return { ok: true }
  } catch (err) {
    console.error('[setTenantTwoFactorRequirement] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * OWNER/ADMIN-only — drops an in-app notification reminding a tenant member
 * to enroll 2FA. No-op (but ok=true) if the user has already enrolled, so
 * callers can fire-and-forget. Audited as `tenant.security.two_factor.nudged`.
 */
export async function nudgeUserToEnrollTwoFactor(
  tenantSlug: string,
  userId: string,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: 'Anda harus masuk.' }
  if (!userId) return { ok: false, error: 'Pengguna tidak ditemukan.' }

  const tenant = await loadTenantByOwner(tenantSlug)
  if (!tenant) return { ok: false, error: 'Tenant tidak ditemukan.' }

  const canNudge = hasTenantPermission(
    session.user.globalRole,
    session.user.tenants,
    tenant.id,
    'team.update',
  )
  if (!canNudge) {
    return { ok: false, error: 'Anda tidak punya akses untuk tindakan ini.' }
  }

  try {
    const [target, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, totpEnabledAt: true, name: true, email: true },
      }),
      prisma.userTenant.findFirst({
        where: { userId, tenantId: tenant.id, status: 'active' },
        select: { id: true },
      }),
    ])
    if (!target || !membership) {
      return { ok: false, error: 'Pengguna bukan anggota tenant ini.' }
    }
    if (target.totpEnabledAt) {
      // Compliant already — silently succeed.
      return { ok: true }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.notification.create({
        data: {
          userId: target.id,
          type: NotificationType.SYSTEM,
          title: `Aktifkan 2FA untuk ${tenant.name}`,
          body: `Tenant ${tenant.name} mewajibkan two-factor authentication. Aktifkan sekarang agar akses dasbor tetap lancar.`,
          link: '/dashboard/keamanan/2fa',
        },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: session.user.id,
          action: AuditAction.UPDATE,
          resource: 'tenant.security.two_factor.nudged',
          resourceId: target.id,
          metadata: { targetUserId: target.id, tenantSlug: tenant.slug },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/dashboard/tenants/${tenantSlug}/keamanan`)
    return { ok: true }
  } catch (err) {
    console.error('[nudgeUserToEnrollTwoFactor] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * Bulk variant — nudges every member of the tenant who has not yet enrolled
 * 2FA. Returns count of notifications dispatched.
 */
export async function bulkNudgeTwoFactor(
  tenantSlug: string,
): Promise<ActionResult<{ nudged: number }>> {
  const session = await auth()
  if (!session?.user) return { ok: false, error: 'Anda harus masuk.' }

  const tenant = await loadTenantByOwner(tenantSlug)
  if (!tenant) return { ok: false, error: 'Tenant tidak ditemukan.' }

  const canNudge = hasTenantPermission(
    session.user.globalRole,
    session.user.tenants,
    tenant.id,
    'team.update',
  )
  if (!canNudge) {
    return { ok: false, error: 'Anda tidak punya akses untuk tindakan ini.' }
  }

  try {
    const pending = await prisma.userTenant.findMany({
      where: {
        tenantId: tenant.id,
        status: 'active',
        user: { totpEnabledAt: null },
      },
      select: { userId: true },
    })

    let nudged = 0
    for (const m of pending) {
      const r = await nudgeUserToEnrollTwoFactor(tenantSlug, m.userId)
      if (r.ok) nudged += 1
    }

    revalidatePath(`/dashboard/tenants/${tenantSlug}/keamanan`)
    return { ok: true, data: { nudged } }
  } catch (err) {
    console.error('[bulkNudgeTwoFactor] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
