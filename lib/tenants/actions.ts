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
import { sendEmail, tenantInviteEmail } from '@/lib/mailer'

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
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug minimal 3 karakter')
    .max(40, 'Slug maksimal 40 karakter')
    .regex(SLUG_RE, 'Gunakan huruf kecil, angka, dan tanda hubung saja.'),
})

/**
 * Create a new tenant owned by the current user. Promotes USER → PARTNER.
 * Idempotent in spirit: refuses if slug taken; succeeds once.
 */
export async function createTenant(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk untuk membuat tenant.' }
  }

  const parsed = createTenantSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { name, slug } = parsed.data

  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: 'Slug ini dicadangkan, pilih yang lain.', field: 'slug' }
  }

  try {
    const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (existing) {
      return { ok: false, error: 'Slug sudah digunakan, pilih yang lain.', field: 'slug' }
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
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

const inviteSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email('Email tidak valid').transform((v) => v.toLowerCase().trim()),
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
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk untuk mengundang anggota.' }
  }

  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, email, role } = parsed.data

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true },
    })
    if (!tenant) return { ok: false, error: 'Tenant tidak ditemukan.' }

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk mengundang anggota.' }
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
      return { ok: false, error: 'Undangan untuk email ini masih aktif.', field: 'email' }
    }

    // Refuse if user is already a member.
    const member = await prisma.userTenant.findFirst({
      where: { tenantId: tenant.id, user: { email } },
      select: { id: true },
    })
    if (member) {
      return { ok: false, error: 'Pengguna ini sudah menjadi anggota tenant.', field: 'email' }
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

    revalidatePath(`/dashboard/tenants/${tenantSlug}`)
    return { ok: true, data: { inviteId: invite.id } }
  } catch (err) {
    console.error('[createTenantInvite] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * Revoke (delete) a pending invitation. Requires team.invite permission on
 * the tenant the invitation belongs to.
 */
export async function revokeTenantInvite(invitationId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  if (!invitationId) return { ok: false, error: 'ID undangan tidak valid.' }

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
    if (!invite) return { ok: false, error: 'Undangan tidak ditemukan.' }

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, invite.tenantId, 'team.invite')) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk mencabut undangan.' }
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
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
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
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: 'Anda harus masuk untuk menerima undangan.' }
  }
  if (!token) return { ok: false, error: 'Token tidak valid.' }

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
    if (!invite || !invite.tenant) return { ok: false, error: 'Undangan tidak ditemukan.' }
    if (invite.acceptedAt) return { ok: false, error: 'Undangan ini sudah digunakan.' }
    if (invite.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: 'Undangan sudah kedaluwarsa.' }
    }
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return {
        ok: false,
        error: 'Undangan ini ditujukan untuk email yang berbeda. Masuk dengan akun yang benar.',
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

    revalidatePath('/dashboard/tenants')
    revalidatePath(`/dashboard/tenants/${invite.tenant.slug}`)
    return { ok: true, data: { tenantSlug: invite.tenant.slug } }
  } catch (err) {
    console.error('[acceptTenantInvite] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
