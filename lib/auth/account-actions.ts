'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvAuth1 } from '@/lib/i18n/dictionaries/srv-auth1'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

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

function anonymizedEmail(userId: string): string {
  return `deleted-${userId}-${Date.now()}@deleted.local`
}

/**
 * Soft-delete the signed-in user's account.
 *
 * Behaviour:
 * - Password confirm required (refuses unconditionally for Google-only users
 *   to preserve a recoverable hold; they should set a password first).
 * - Refuses if the user is OWNER of any tenant (must transfer first).
 * - status set to DELETED, PII fields nulled, email anonymized so the unique
 *   constraint stays satisfied and the user cannot sign in again.
 * - Sessions, OAuth Accounts, reset/verification tokens are wiped.
 * - Memberships are removed (cascades via FKs but we delete explicitly).
 * - AuditLog rows are preserved (compliance) with the original userId pointer.
 *
 * The session cookie still lives on the client; the next call to auth() will
 * find an inactive user and treat it as unauthenticated.
 */
export async function requestAccountDeletion(formData: FormData): Promise<ActionResult> {
  const locale = await getServerLocale()
  const t = srvAuth1[locale].account
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.mustLogin }
  }
  const userId = session.user.id

  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (confirm !== 'HAPUS') {
    return {
      ok: false,
      error: t.typeHapus,
      field: 'confirm',
    }
  }
  if (!password) {
    return { ok: false, error: t.enterPassword, field: 'password' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, status: true },
    })
    if (!user) return { ok: false, error: t.notFound }
    if (user.status === 'DELETED') {
      return { ok: false, error: t.alreadyDeleted }
    }
    if (!user.passwordHash) {
      return {
        ok: false,
        error: t.oauthNoPassword,
        field: 'password',
      }
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return { ok: false, error: t.wrongPassword, field: 'password' }
    }

    // Refuse if user is the OWNER of any tenant.
    const ownedTenants = await prisma.tenant.findMany({
      where: { ownerUserId: userId },
      select: { slug: true, name: true },
    })
    if (ownedTenants.length > 0) {
      const list = ownedTenants.map((t) => t.name).join(', ')
      return {
        ok: false,
        error: t.ownerMustTransfer.replace('{list}', list),
      }
    }

    const meta = getRequestMeta()
    const newEmail = anonymizedEmail(userId)

    await prisma.$transaction([
      // Wipe membership rows (FK cascades exist, but explicit is safer).
      prisma.userTenant.deleteMany({ where: { userId } }),
      // Wipe OAuth accounts (forces re-link if user ever recovered).
      prisma.account.deleteMany({ where: { userId } }),
      // Wipe sessions.
      prisma.session.deleteMany({ where: { userId } }),
      // Wipe auth tokens.
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      // Anonymize the user row.
      prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          name: null,
          image: null,
          phone: null,
          bio: null,
          headline: null,
          location: null,
          passwordHash: null,
          emailVerified: null,
          status: 'DELETED',
          lastLoginAt: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.DELETE,
          resource: 'account',
          resourceId: userId,
          metadata: { previousEmail: user.email },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[requestAccountDeletion] failed', err)
    return { ok: false, error: t.genericError }
  }
}
