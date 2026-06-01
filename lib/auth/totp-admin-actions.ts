'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { sendEmail } from '@/lib/mailer'

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
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = '2FA akun RPI Anda telah di-reset oleh administrator'
  const text = [
    greeting,
    '',
    'Two-factor authentication (2FA) pada akun Rumah Pekerja Indonesia Anda',
    `(${opts.email}) baru saja di-reset oleh administrator (${opts.actorEmail}).`,
    '',
    'Setelah reset:',
    '  • Anda dapat login dengan password seperti biasa tanpa kode 2FA.',
    '  • Recovery code lama tidak lagi berlaku.',
    '  • Kami menyarankan Anda mengaktifkan kembali 2FA segera setelah login.',
    '',
    'Alasan reset (dicatat oleh administrator):',
    opts.reason,
    '',
    'Jika Anda tidak meminta reset ini, segera hubungi tim keamanan kami.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Two-factor authentication (2FA) pada akun Rumah Pekerja Indonesia Anda (<strong>${opts.email}</strong>) baru saja di-reset oleh administrator (<code>${opts.actorEmail}</code>).</p>
  <ul>
    <li>Anda dapat login dengan password seperti biasa tanpa kode 2FA.</li>
    <li>Recovery code lama tidak lagi berlaku.</li>
    <li>Kami menyarankan Anda mengaktifkan kembali 2FA segera setelah login.</li>
  </ul>
  <p style="font-size:13px;color:#475569"><strong>Alasan reset (dicatat oleh administrator):</strong><br>${opts.reason.replace(/[<>]/g, '')}</p>
  <p style="font-size:13px;color:#475569">Jika Anda tidak meminta reset ini, segera hubungi tim keamanan kami.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
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
  const actor = await requireSuperadmin()
  if (!actor) return { ok: false, error: 'Akses ditolak.' }

  const cleanReason = (reason ?? '').toString().trim()
  if (cleanReason.length < MIN_REASON_LEN) {
    return {
      ok: false,
      error: `Alasan reset wajib, minimal ${MIN_REASON_LEN} karakter.`,
      field: 'reason',
    }
  }
  if (!userId) return { ok: false, error: 'Pengguna tidak ditemukan.' }

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
    if (!target) return { ok: false, error: 'Pengguna tidak ditemukan.' }

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
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
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
  const actor = await requireSuperadmin()
  if (!actor) return { ok: false, error: 'Akses ditolak.' }

  const cleanReason = (reason ?? '').toString().trim()
  if (cleanReason.length < MIN_REASON_LEN) {
    return {
      ok: false,
      error: `Alasan reset wajib, minimal ${MIN_REASON_LEN} karakter.`,
      field: 'reason',
    }
  }
  const ids = Array.from(new Set((userIds ?? []).filter((x) => typeof x === 'string' && x.length > 0)))
  if (ids.length === 0) {
    return { ok: false, error: 'Pilih minimal satu pengguna.' }
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
