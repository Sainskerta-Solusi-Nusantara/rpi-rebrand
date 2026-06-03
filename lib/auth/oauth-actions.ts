'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import { getServerT } from '@/lib/i18n/server-dictionary'

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

/**
 * Unlink the signed-in user's Google account. Requires the user to confirm
 * their current password (so a stolen session can't disable the alternate
 * sign-in path silently). Refuses if the user has no password set, since
 * unlinking would lock them out.
 */
export async function unlinkGoogleAccount(formData: FormData): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvAuth2.oauth.mustLogin }
  }

  const password = String(formData.get('password') ?? '')
  if (!password) {
    return { ok: false, error: t.srvAuth2.oauth.passwordRequired, field: 'password' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user) return { ok: false, error: t.srvAuth2.oauth.accountNotFound }
    if (!user.passwordHash) {
      return {
        ok: false,
        error: t.srvAuth2.oauth.noPasswordSet,
      }
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return { ok: false, error: t.srvAuth2.oauth.passwordWrong, field: 'password' }
    }

    const linked = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: 'google' },
      select: { id: true, providerAccountId: true },
    })
    if (!linked) {
      return { ok: false, error: t.srvAuth2.oauth.googleNotLinked }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.account.delete({ where: { id: linked.id } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.UPDATE,
          resource: 'account.oauth.unlink',
          resourceId: linked.id,
          metadata: { provider: 'google', providerAccountId: linked.providerAccountId },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[unlinkGoogleAccount] failed', err)
    return { ok: false, error: t.srvAuth2.oauth.genericError }
  }
}
