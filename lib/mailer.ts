import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '@/lib/env'

export type MailMessage = {
  to: string
  subject: string
  text: string
  html?: string
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string }

const FROM_FALLBACK = 'no-reply@rumahpekerja.id'

async function sendViaResend(msg: MailMessage): Promise<SendResult> {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM ?? FROM_FALLBACK,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` }
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id ?? 'resend-ok' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'resend error' }
  }
}

async function sendViaDevTransport(msg: MailMessage): Promise<SendResult> {
  const stamp = new Date().toISOString()
  const lines = [
    `--- ${stamp} ---`,
    `To: ${msg.to}`,
    `From: ${env.EMAIL_FROM ?? FROM_FALLBACK}`,
    `Subject: ${msg.subject}`,
    '',
    msg.text,
    '',
  ].join('\n')

  // eslint-disable-next-line no-console
  console.info('[mailer:dev] %s', lines)
  try {
    const file = path.join(process.cwd(), 'dev-mailbox.log')
    await fs.appendFile(file, lines + '\n')
  } catch {
    // Best-effort write — log already on console.
  }
  return { ok: true, id: `dev-${stamp}` }
}

export async function sendEmail(msg: MailMessage): Promise<SendResult> {
  if (env.RESEND_API_KEY) return sendViaResend(msg)
  return sendViaDevTransport(msg)
}

export function tenantInviteEmail(opts: {
  inviterName?: string | null
  tenantName: string
  role: string
  link: string
}): { subject: string; text: string; html: string } {
  const subject = `Undangan bergabung ke ${opts.tenantName}`
  const inviter = opts.inviterName ?? 'Tim RPI'
  const text = [
    'Halo,',
    '',
    `${inviter} mengundang Anda bergabung ke ${opts.tenantName} di Rumah Pekerja Indonesia sebagai ${opts.role}.`,
    'Klik tautan berikut untuk menerima undangan (berlaku 7 hari):',
    '',
    opts.link,
    '',
    'Jika Anda tidak mengharapkan undangan ini, abaikan email ini.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>Halo,</p>
  <p><strong>${inviter}</strong> mengundang Anda bergabung ke <strong>${opts.tenantName}</strong> di Rumah Pekerja Indonesia sebagai <strong>${opts.role}</strong>.</p>
  <p style="margin:24px 0"><a href="${opts.link}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Terima undangan</a></p>
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser (berlaku 7 hari):<br><span style="word-break:break-all">${opts.link}</span></p>
  <p style="font-size:13px;color:#475569">Jika Anda tidak mengharapkan undangan ini, abaikan email ini.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function emailVerificationEmail(opts: { name?: string | null; link: string }): {
  subject: string
  text: string
  html: string
} {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = 'Verifikasi alamat email akun RPI Anda'
  const text = [
    greeting,
    '',
    'Terima kasih telah mendaftar di Rumah Pekerja Indonesia.',
    'Klik tautan berikut untuk memverifikasi alamat email Anda (berlaku 24 jam):',
    '',
    opts.link,
    '',
    'Jika Anda tidak membuat akun ini, abaikan email ini.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Terima kasih telah mendaftar di Rumah Pekerja Indonesia. Klik tombol berikut untuk memverifikasi alamat email Anda (tautan berlaku 24 jam):</p>
  <p style="margin:24px 0"><a href="${opts.link}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Verifikasi email</a></p>
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${opts.link}</span></p>
  <p style="font-size:13px;color:#475569">Jika Anda tidak membuat akun ini, abaikan email ini.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function passwordResetEmail(opts: { name?: string | null; link: string }): {
  subject: string
  text: string
  html: string
} {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = 'Reset password akun RPI Anda'
  const text = [
    greeting,
    '',
    'Kami menerima permintaan untuk mengatur ulang password akun RPI Anda.',
    'Klik tautan berikut untuk melanjutkan (berlaku 1 jam):',
    '',
    opts.link,
    '',
    'Jika Anda tidak meminta reset password, abaikan email ini — akun Anda tetap aman.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Kami menerima permintaan untuk mengatur ulang password akun RPI Anda. Klik tombol berikut untuk melanjutkan (tautan berlaku 1 jam):</p>
  <p style="margin:24px 0"><a href="${opts.link}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Reset password</a></p>
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${opts.link}</span></p>
  <p style="font-size:13px;color:#475569">Jika Anda tidak meminta reset password, abaikan email ini — akun Anda tetap aman.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}
