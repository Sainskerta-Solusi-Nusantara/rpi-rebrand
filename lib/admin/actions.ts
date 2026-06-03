'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction, type GlobalRole, type PlanTier, type TenantStatus, type UserStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult = { ok: true } | { ok: false; error: string }

const GLOBAL_ROLES = ['SUPERADMIN', 'ADMIN', 'PARTNER', 'USER'] as const
const USER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'] as const
const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED', 'PROVISIONING'] as const
const PLAN_TIERS = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const

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

async function requireAdmin(level: 'ADMIN' | 'SUPERADMIN' = 'ADMIN') {
  const session = await auth()
  if (!session?.user) return null
  const role = session.user.globalRole
  if (level === 'SUPERADMIN' && role !== 'SUPERADMIN') return null
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') return null
  return session.user
}

const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(GLOBAL_ROLES),
})

/**
 * Change a user's global role. SUPERADMIN only.
 * Logs PERMISSION_CHANGE with before/after metadata.
 * Refuses to change the actor's own role.
 */
export async function updateUserRole(input: { userId: string; role: GlobalRole }): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = userRoleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: t.srvAdmin.adminActions.invalidInput }
  const { userId, role } = parsed.data

  const actor = await requireAdmin('SUPERADMIN')
  if (!actor) return { ok: false, error: t.srvAdmin.adminActions.accessDenied }
  if (actor.id === userId) return { ok: false, error: t.srvAdmin.adminActions.cannotChangeOwnRole }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, globalRole: true },
    })
    if (!target) return { ok: false, error: t.srvAdmin.adminActions.userNotFound }
    if (target.globalRole === role) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { globalRole: role } }),
      prisma.auditLog.create({
        data: {
          action: AuditAction.PERMISSION_CHANGE,
          userId: actor.id,
          resource: 'user',
          resourceId: userId,
          metadata: { from: target.globalRole, to: role },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/admin/users')
    return { ok: true }
  } catch (err) {
    console.error('[updateUserRole] failed', err)
    return { ok: false, error: t.srvAdmin.adminActions.genericError }
  }
}

const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(USER_STATUSES),
})

/**
 * Change a user's status (suspend, reactivate, etc). Admin+.
 * Refuses to change the actor's own status.
 */
export async function updateUserStatus(input: { userId: string; status: UserStatus }): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = userStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: t.srvAdmin.adminActions.invalidInput }
  const { userId, status } = parsed.data

  const actor = await requireAdmin('ADMIN')
  if (!actor) return { ok: false, error: t.srvAdmin.adminActions.accessDenied }
  if (actor.id === userId) return { ok: false, error: t.srvAdmin.adminActions.cannotChangeOwnStatus }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, globalRole: true },
    })
    if (!target) return { ok: false, error: t.srvAdmin.adminActions.userNotFound }

    // Non-SUPERADMIN actors cannot touch SUPERADMIN/ADMIN accounts.
    if (
      actor.globalRole !== 'SUPERADMIN' &&
      (target.globalRole === 'SUPERADMIN' || target.globalRole === 'ADMIN')
    ) {
      return { ok: false, error: t.srvAdmin.adminActions.cannotChangeAdminStatus }
    }

    if (target.status === status) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { status } }),
      prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          userId: actor.id,
          resource: 'user.status',
          resourceId: userId,
          metadata: { from: target.status, to: status },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/admin/users')
    return { ok: true }
  } catch (err) {
    console.error('[updateUserStatus] failed', err)
    return { ok: false, error: t.srvAdmin.adminActions.genericError }
  }
}

const tenantStatusSchema = z.object({
  tenantId: z.string().min(1),
  status: z.enum(TENANT_STATUSES),
})

export async function updateTenantStatus(input: { tenantId: string; status: TenantStatus }): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = tenantStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: t.srvAdmin.adminActions.invalidInput }
  const { tenantId, status } = parsed.data

  const actor = await requireAdmin('SUPERADMIN')
  if (!actor) return { ok: false, error: t.srvAdmin.adminActions.accessDenied }

  try {
    const target = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    })
    if (!target) return { ok: false, error: t.srvAdmin.adminActions.tenantNotFound }
    if (target.status === status) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.tenant.update({ where: { id: tenantId }, data: { status } }),
      prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          userId: actor.id,
          tenantId,
          resource: 'tenant.status',
          resourceId: tenantId,
          metadata: { from: target.status, to: status },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/admin/tenants/${tenantId}`)
    revalidatePath('/admin/tenants')
    return { ok: true }
  } catch (err) {
    console.error('[updateTenantStatus] failed', err)
    return { ok: false, error: t.srvAdmin.adminActions.genericError }
  }
}

const tenantPlanSchema = z.object({
  tenantId: z.string().min(1),
  plan: z.enum(PLAN_TIERS),
})

export async function updateTenantPlan(input: { tenantId: string; plan: PlanTier }): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = tenantPlanSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: t.srvAdmin.adminActions.invalidInput }
  const { tenantId, plan } = parsed.data

  const actor = await requireAdmin('SUPERADMIN')
  if (!actor) return { ok: false, error: t.srvAdmin.adminActions.accessDenied }

  try {
    const target = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, planTier: true },
    })
    if (!target) return { ok: false, error: t.srvAdmin.adminActions.tenantNotFound }
    if (target.planTier === plan) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.tenant.update({ where: { id: tenantId }, data: { planTier: plan } }),
      prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          userId: actor.id,
          tenantId,
          resource: 'tenant.plan',
          resourceId: tenantId,
          metadata: { from: target.planTier, to: plan },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/admin/tenants/${tenantId}`)
    revalidatePath('/admin/tenants')
    return { ok: true }
  } catch (err) {
    console.error('[updateTenantPlan] failed', err)
    return { ok: false, error: t.srvAdmin.adminActions.genericError }
  }
}
