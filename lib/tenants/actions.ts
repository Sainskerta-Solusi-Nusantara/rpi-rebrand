'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, type TenantRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { shouldSendEmail } from '@/lib/auth/notification-prefs'
import { sendEmail, tenantInviteEmail } from '@/lib/mailer'
import { dispatchTenantEvent } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/
const RESERVED_SLUGS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'static',
  'public',
  'dashboard',
  'onboarding',
  'login',
  'register',
  'forgot',
  'reset',
  'verify',
  'accept',
])

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const INVITABLE_ROLES = ['ADMIN', 'RECRUITER', 'MEMBER'] as const

function appUrl() {
  return env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || env.NEXTAUTH_URL?.replace(/\/$/, '') || ''
}

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

const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .refine((v) => SLUG_RE.test(v), { params: { i18n: 'slugFormat' } }),
})

/**
 * Create a new tenant owned by the current user. Promotes USER → PARTNER.
 * Idempotent in spirit: refuses if slug taken; succeeds once.
 */
export async function createTenant(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvTenant1.tenant.mustLogin }
  }

  const parsed = await localizedParse(createTenantSchema, {
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant1.tenant.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { name, slug } = parsed.data

  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: t.srvTenant1.tenant.slugReserved, field: 'slug' }
  }

  try {
    const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (existing) {
      return { ok: false, error: t.srvTenant1.tenant.slugTaken, field: 'slug' }
    }

    const meta = getRequestMeta()
    const userId = session.user.id

    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          slug,
          name,
          planTier: 'FREE',
          status: 'ACTIVE',
          ownerUserId: userId,
          branding: { create: {} },
          users: { create: { userId, role: 'OWNER' } },
        },
        select: { id: true, slug: true },
      })

      if (session.user.globalRole === 'USER') {
        await tx.user.update({ where: { id: userId }, data: { globalRole: 'PARTNER' } })
      }

      await tx.auditLog.create({
        data: {
          tenantId: t.id,
          userId,
          action: AuditAction.CREATE,
          resource: 'tenant',
          resourceId: t.id,
          metadata: { slug, name },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })

      return t
    })

    revalidatePath('/dashboard/tenants')
    return { ok: true, data: { slug: tenant.slug } }
  } catch (err) {
    console.error('[createTenant] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.createFailed }
  }
}

const inviteSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  role: z.enum(INVITABLE_ROLES),
})

/**
 * Create an invitation for a tenant. Requires team.invite permission.
 * Sends an email with the accept link. Token is returned plain to caller.
 */
export async function createTenantInvite(input: {
  tenantSlug: string
  email: string
  role: TenantRole
}): Promise<ActionResult<{ inviteId: string }>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvTenant1.tenant.mustLoginInvite }
  }

  const parsed = await localizedParse(inviteSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant1.tenant.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, email, role } = parsed.data

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true },
    })
    if (!tenant) return { ok: false, error: t.srvTenant1.tenant.tenantNotFound }

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')) {
      return { ok: false, error: t.srvTenant1.tenant.noPermissionInvite }
    }

    // Refuse duplicate invite for same email + tenant if a pending one exists.
    const existing = await prisma.invitation.findFirst({
      where: {
        tenantId: tenant.id,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    })
    if (existing) {
      return { ok: false, error: t.srvTenant1.tenant.inviteActive, field: 'email' }
    }

    // Refuse if user is already a member.
    const member = await prisma.userTenant.findFirst({
      where: { tenantId: tenant.id, user: { email } },
      select: { id: true },
    })
    if (member) {
      return { ok: false, error: t.srvTenant1.tenant.alreadyMember, field: 'email' }
    }

    const token = randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
    const meta = getRequestMeta()

    const invite = await prisma.invitation.create({
      data: { tenantId: tenant.id, email, role, token, expiresAt },
      select: { id: true },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId,
        action: AuditAction.INVITE,
        resource: 'invitation',
        resourceId: invite.id,
        metadata: { email, role },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // If the invitee already has an account, respect their invitation pref.
    const inviteeUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    const wantsMail = inviteeUser
      ? await shouldSendEmail(inviteeUser.id, 'invitation')
      : true // new users have no prefs row yet; default-true matches DEFAULT_PREFS

    if (wantsMail) {
      const link = `${appUrl()}/accept/${token}`
      const { subject, text, html } = tenantInviteEmail({
        inviterName: session.user.name ?? null,
        tenantName: tenant.name,
        role,
        link,
      })
      const mail = await sendEmail({ to: email, subject, text, html })
      if (!mail.ok) {
        console.error('[createTenantInvite] mailer failed', mail.error)
      }
    }

    revalidatePath(`/dashboard/tenants/${tenantSlug}`)
    return { ok: true, data: { inviteId: invite.id } }
  } catch (err) {
    console.error('[createTenantInvite] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.inviteFailed }
  }
}

/**
 * Revoke (delete) a pending invitation. Requires team.invite permission on
 * the tenant the invitation belongs to.
 */
export async function revokeTenantInvite(invitationId: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvTenant1.tenant.mustLoginShort }
  }
  if (!invitationId) return { ok: false, error: t.srvTenant1.tenant.inviteIdInvalid }

  try {
    const invite = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        tenant: { select: { slug: true } },
      },
    })
    if (!invite) return { ok: false, error: t.srvTenant1.tenant.inviteNotFound }

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, invite.tenantId, 'team.invite')) {
      return { ok: false, error: t.srvTenant1.tenant.noPermissionRevoke }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.invitation.delete({ where: { id: invitationId } }),
      prisma.auditLog.create({
        data: {
          tenantId: invite.tenantId,
          userId,
          action: AuditAction.REVOKE,
          resource: 'invitation',
          resourceId: invitationId,
          metadata: { email: invite.email, role: invite.role },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    if (invite.tenant?.slug) {
      revalidatePath(`/dashboard/tenants/${invite.tenant.slug}`)
    }
    return { ok: true }
  } catch (err) {
    console.error('[revokeTenantInvite] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.revokeFailed }
  }
}

/**
 * Look up an invite by its plain token. Does NOT consume.
 */
export async function checkTenantInvite(token: string): Promise<
  | {
      valid: true
      tenantSlug: string
      tenantName: string
      email: string
      role: TenantRole
      expiresAt: Date
    }
  | { valid: false; reason: 'invalid' | 'expired' | 'used' }
> {
  if (!token || token.length < 16) return { valid: false, reason: 'invalid' }
  try {
    const invite = await prisma.invitation.findUnique({
      where: { token },
      select: {
        acceptedAt: true,
        expiresAt: true,
        email: true,
        role: true,
        tenant: { select: { slug: true, name: true } },
      },
    })
    if (!invite || !invite.tenant) return { valid: false, reason: 'invalid' }
    if (invite.acceptedAt) return { valid: false, reason: 'used' }
    if (invite.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'expired' }
    return {
      valid: true,
      tenantSlug: invite.tenant.slug,
      tenantName: invite.tenant.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    }
  } catch (err) {
    console.error('[checkTenantInvite] failed', err)
    return { valid: false, reason: 'invalid' }
  }
}

/**
 * Accept an invitation. Requires the signed-in user's email to match the
 * invite (case-insensitive). Creates a UserTenant membership and marks the
 * invitation accepted.
 */
export async function acceptTenantInvite(token: string): Promise<
  ActionResult<{ tenantSlug: string }>
> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: t.srvTenant1.tenant.mustLoginAccept }
  }
  if (!token) return { ok: false, error: t.srvTenant1.tenant.tokenInvalid }

  try {
    const invite = await prisma.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        acceptedAt: true,
        expiresAt: true,
        tenant: { select: { slug: true } },
      },
    })
    if (!invite || !invite.tenant) return { ok: false, error: t.srvTenant1.tenant.inviteNotFound }
    if (invite.acceptedAt) return { ok: false, error: t.srvTenant1.tenant.inviteUsed }
    if (invite.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: t.srvTenant1.tenant.inviteExpired }
    }
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return {
        ok: false,
        error: t.srvTenant1.tenant.inviteWrongEmail,
      }
    }

    const meta = getRequestMeta()
    const userId = session.user.id

    await prisma.$transaction([
      prisma.userTenant.upsert({
        where: { userId_tenantId: { userId, tenantId: invite.tenantId } },
        update: { role: invite.role, status: 'active' },
        create: { userId, tenantId: invite.tenantId, role: invite.role },
      }),
      prisma.invitation.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: invite.tenantId,
          userId,
          action: AuditAction.UPDATE,
          resource: 'invitation.accepted',
          resourceId: invite.id,
          metadata: { email: invite.email, role: invite.role },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    dispatchTenantEvent(invite.tenantId, 'tenant.member.added', {
      userId,
      email: invite.email,
      role: invite.role,
    })

    revalidatePath('/dashboard/tenants')
    revalidatePath(`/dashboard/tenants/${invite.tenant.slug}`)
    return { ok: true, data: { tenantSlug: invite.tenant.slug } }
  } catch (err) {
    console.error('[acceptTenantInvite] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.acceptFailed }
  }
}

// =============================================================================
// MEMBER MANAGEMENT
// =============================================================================

const MEMBER_ROLES = ['ADMIN', 'RECRUITER', 'MEMBER'] as const

const updateMemberRoleSchema = z.object({
  tenantSlug: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(MEMBER_ROLES),
})

type LoadResult =
  | { error: string }
  | {
      tenant: { id: string; slug: string; ownerUserId: string | null }
      actorId: string
    }

/**
 * Resolve tenant + actor membership for a member-management action.
 */
async function loadTenantForMemberOp(
  tenantSlug: string,
  permission: 'team.update' | 'team.remove',
): Promise<LoadResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant1.tenant.mustLoginShort }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, ownerUserId: true },
  })
  if (!tenant) return { error: t.srvTenant1.tenant.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: t.srvTenant1.tenant.noPermission }
  }
  return { tenant, actorId }
}

/**
 * Change a tenant member's role. Cannot change OWNER's role here (use
 * transferOwnership for that). Cannot change own role.
 */
export async function updateMemberRole(input: {
  tenantSlug: string
  userId: string
  role: TenantRole
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = await localizedParse(updateMemberRoleSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? t.srvTenant1.tenant.dataInvalid }
  }
  const { tenantSlug, userId, role } = parsed.data

  const ctx = await loadTenantForMemberOp(tenantSlug, 'team.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { tenant, actorId } = ctx

  if (actorId === userId) {
    return { ok: false, error: t.srvTenant1.tenant.cannotChangeOwnRole }
  }

  try {
    const member = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId: tenant.id } },
      select: { id: true, role: true },
    })
    if (!member) return { ok: false, error: t.srvTenant1.tenant.memberNotFound }
    if (member.role === 'OWNER') {
      return {
        ok: false,
        error: t.srvTenant1.tenant.ownerRoleProtected,
      }
    }
    if (member.role === role) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.userTenant.update({
        where: { id: member.id },
        data: { role },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: actorId,
          action: AuditAction.PERMISSION_CHANGE,
          resource: 'membership.role',
          resourceId: member.id,
          metadata: { targetUserId: userId, from: member.role, to: role },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    dispatchTenantEvent(tenant.id, 'tenant.member.role_changed', {
      userId,
      from: member.role,
      to: role,
    })

    revalidatePath(`/dashboard/tenants/${tenant.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[updateMemberRole] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.updateRoleFailed }
  }
}

/**
 * Remove a member from a tenant. Cannot remove the OWNER. Cannot remove self
 * via this action — use leaveTenant instead.
 */
export async function removeMember(input: {
  tenantSlug: string
  userId: string
}): Promise<ActionResult> {
  const t = await getServerT()
  if (!input.tenantSlug || !input.userId) {
    return { ok: false, error: t.srvTenant1.tenant.dataInvalid }
  }

  const ctx = await loadTenantForMemberOp(input.tenantSlug, 'team.remove')
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { tenant, actorId } = ctx

  if (actorId === input.userId) {
    return { ok: false, error: t.srvTenant1.tenant.useSelfLeave }
  }

  try {
    const member = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: input.userId, tenantId: tenant.id } },
      select: { id: true, role: true, user: { select: { email: true } } },
    })
    if (!member) return { ok: false, error: t.srvTenant1.tenant.memberNotFound }
    if (member.role === 'OWNER') {
      return {
        ok: false,
        error: t.srvTenant1.tenant.ownerCannotBeRemoved,
      }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.userTenant.delete({ where: { id: member.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: actorId,
          action: AuditAction.REVOKE,
          resource: 'membership',
          resourceId: member.id,
          metadata: { targetUserId: input.userId, role: member.role, email: member.user.email },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    dispatchTenantEvent(tenant.id, 'tenant.member.removed', {
      userId: input.userId,
      email: member.user.email,
      role: member.role,
    })

    revalidatePath(`/dashboard/tenants/${tenant.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[removeMember] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.removeMemberFailed }
  }
}

/**
 * Transfer ownership of a tenant. Only the current OWNER may call this.
 * Promotes the target member to OWNER, demotes the current OWNER to ADMIN,
 * and updates tenant.ownerUserId. Refuses if target is not an existing
 * active member.
 */
export async function transferOwnership(input: {
  tenantSlug: string
  newOwnerUserId: string
}): Promise<ActionResult> {
  const t = await getServerT()
  if (!input.tenantSlug || !input.newOwnerUserId) {
    return { ok: false, error: t.srvTenant1.tenant.dataInvalid }
  }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvTenant1.tenant.mustLoginShort }
  const actorId = session.user.id

  if (actorId === input.newOwnerUserId) {
    return { ok: false, error: t.srvTenant1.tenant.alreadyOwner }
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true, slug: true, ownerUserId: true },
    })
    if (!tenant) return { ok: false, error: t.srvTenant1.tenant.tenantNotFound }
    if (tenant.ownerUserId !== actorId) {
      return { ok: false, error: t.srvTenant1.tenant.onlyOwnerCanTransfer }
    }

    const target = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: input.newOwnerUserId, tenantId: tenant.id } },
      select: { id: true, role: true, status: true },
    })
    if (!target || target.status !== 'active') {
      return { ok: false, error: t.srvTenant1.tenant.newOwnerMustBeActive }
    }

    const actorMembership = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: actorId, tenantId: tenant.id } },
      select: { id: true },
    })
    if (!actorMembership) {
      return { ok: false, error: t.srvTenant1.tenant.ownerMembershipNotFound }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.userTenant.update({
        where: { id: target.id },
        data: { role: 'OWNER' },
      }),
      prisma.userTenant.update({
        where: { id: actorMembership.id },
        data: { role: 'ADMIN' },
      }),
      prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerUserId: input.newOwnerUserId },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: actorId,
          action: AuditAction.PERMISSION_CHANGE,
          resource: 'tenant.owner',
          resourceId: tenant.id,
          metadata: { from: actorId, to: input.newOwnerUserId },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/dashboard/tenants/${tenant.slug}`)
    revalidatePath('/dashboard/tenants')
    return { ok: true }
  } catch (err) {
    console.error('[transferOwnership] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.transferFailed }
  }
}

/**
 * Current user leaves a tenant. OWNER must transfer first — refused here.
 */
export async function leaveTenant(tenantSlug: string): Promise<ActionResult> {
  const t = await getServerT()
  if (!tenantSlug) return { ok: false, error: t.srvTenant1.tenant.dataInvalid }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvTenant1.tenant.mustLoginShort }
  const actorId = session.user.id

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, ownerUserId: true },
    })
    if (!tenant) return { ok: false, error: t.srvTenant1.tenant.tenantNotFound }

    if (tenant.ownerUserId === actorId) {
      return {
        ok: false,
        error: t.srvTenant1.tenant.ownerCannotLeave,
      }
    }

    const member = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: actorId, tenantId: tenant.id } },
      select: { id: true, role: true },
    })
    if (!member) return { ok: false, error: t.srvTenant1.tenant.notMember }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.userTenant.delete({ where: { id: member.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: actorId,
          action: AuditAction.REVOKE,
          resource: 'membership.leave',
          resourceId: member.id,
          metadata: { role: member.role },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/tenants')
    revalidatePath(`/dashboard/tenants/${tenant.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[leaveTenant] failed', err)
    return { ok: false, error: t.srvTenant1.tenant.leaveFailed }
  }
}
