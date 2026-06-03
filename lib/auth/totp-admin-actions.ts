'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { sendEmail } from '@/lib/mailer'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const MIN_REASON_LEN = 8

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

async function requireSuperadmin() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== 'SUPERADMIN') return null
  return session.user
}

function buildResetEmail(opts: {
  name: string | null
  email: string
  actorEmail: string
  reason: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tEmail: any
}): { subject: string; text: string; html: string } {
  const { tEmail } = opts
  const greeting = opts.name
    ? (tEmail.greeting as string).replace('{name}', opts.name)
    : tEmail.greetingFallback
  const line2 = (tEmail.line2 as string)
    .replace('{email}', opts.email)
    .replace('{actor}', opts.actorEmail)
  const subject = tEmail.subject
  const text = [
    greeting,
    '',
    tEmail.line1,
    line2,
    '',
    tEmail.afterResetHeading,
    `  • ${tEmail.bullet1}`,
    `  • ${tEmail.bullet2}`,
    `  • ${tEmail.bullet3}`,
    '',
    tEmail.reasonLabel,
    opts.reason,
    '',
    tEmail.contactSecurity,
    '',
    tEmail.signature,
  ].join('\n')
  const line2Html = (tEmail.line2 as string)
    .replace('{email}', `<strong>${opts.email}</strong>`)
    .replace('{actor}', `<code>${opts.actorEmail}</code>`)
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>${tEmail.line1} ${line2Html}</p>
  <ul>
    <li>${tEmail.bullet1}</li>
    <li>${tEmail.bullet2}</li>
    <li>${tEmail.bullet3}</li>
  </ul>
  <p style="font-size:13px;color:#475569"><strong>${tEmail.reasonLabel}</strong><br>${opts.reason.replace(/[<>]/g, '')}</p>
  <p style="font-size:13px;color:#475569">${tEmail.contactSecurity}</p>
  <p style="font-size:13px;color:#475569">${tEmail.signature}</p>
</body></html>`
  return { subject, text, html }
}

/**
 * SUPERADMIN-only emergency reset of a user's 2FA. Used when the user loses
 * their authenticator device and all recovery codes (after manual identity
 * verification handled out-of-band).
 *
 * Wipes `totpSecret`, `totpEnabledAt`, and ALL recovery codes. Audits
 * `user.totp.admin_reset` with the supplied reason.
 */
export async function resetUserTwoFactor(
  userId: string,
  reason: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const actor = await requireSuperadmin()
  if (!actor) return { ok: false, error: t.srvAuth4.totpAdmin.accessDenied }

  const cleanReason = (reason ?? '').toString().trim()
  if (cleanReason.length < MIN_REASON_LEN) {
    return {
      ok: false,
      error: (t.srvAuth4.totpAdmin.reasonRequired as string).replace('{min}', String(MIN_REASON_LEN)),
      field: 'reason',
    }
  }
  if (!userId) return { ok: false, error: t.srvAuth4.totpAdmin.userNotFound }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        totpEnabledAt: true,
      },
    })
    if (!target) return { ok: false, error: t.srvAuth4.totpAdmin.userNotFound }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { totpSecret: null, totpEnabledAt: null },
      }),
      prisma.totpRecoveryCode.deleteMany({ where: { userId } }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: AuditAction.UPDATE,
          resource: 'user.totp.admin_reset',
          resourceId: userId,
          metadata: {
            targetUserId: userId,
            reason: cleanReason,
            wasEnabled: Boolean(target.totpEnabledAt),
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    // Best-effort notification — mailer falls back to dev transport.
    try {
      const tpl = buildResetEmail({
        name: target.name,
        email: target.email,
        actorEmail: actor.email,
        reason: cleanReason,
        tEmail: t.srvAuth4.totpAdmin.email,
      })
      await sendEmail({ to: target.email, ...tpl })
    } catch (mailErr) {
      console.warn('[resetUserTwoFactor] mail send failed', mailErr)
    }

    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/users/${userId}/two-factor`)
    return { ok: true }
  } catch (err) {
    console.error('[resetUserTwoFactor] failed', err)
    return { ok: false, error: t.srvAuth4.totpAdmin.internalError }
  }
}

/**
 * SUPERADMIN-only bulk version of `resetUserTwoFactor`. Each user is reset
 * independently in its own transaction so a single failure doesn't unwind
 * the others. Returns aggregate counts.
 */
export async function bulkResetTwoFactor(
  userIds: string[],
  reason: string,
): Promise<ActionResult<{ successCount: number; failedCount: number }>> {
  const t = await getServerT()
  const actor = await requireSuperadmin()
  if (!actor) return { ok: false, error: t.srvAuth4.totpAdmin.accessDenied }

  const cleanReason = (reason ?? '').toString().trim()
  if (cleanReason.length < MIN_REASON_LEN) {
    return {
      ok: false,
      error: (t.srvAuth4.totpAdmin.reasonRequired as string).replace('{min}', String(MIN_REASON_LEN)),
      field: 'reason',
    }
  }
  const ids = Array.from(new Set((userIds ?? []).filter((x) => typeof x === 'string' && x.length > 0)))
  if (ids.length === 0) {
    return { ok: false, error: t.srvAuth4.totpAdmin.selectAtLeastOne }
  }

  let successCount = 0
  let failedCount = 0
  for (const id of ids) {
    const r = await resetUserTwoFactor(id, cleanReason)
    if (r.ok) successCount += 1
    else failedCount += 1
  }

  return { ok: true, data: { successCount, failedCount } }
}
