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

export function emailChangeVerifyEmail(opts: {
  name?: string | null
  oldEmail: string
  newEmail: string
  link: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = 'Konfirmasi alamat email baru'
  const text = [
    greeting,
    '',
    `Anda meminta untuk mengganti email akun RPI dari ${opts.oldEmail} ke ${opts.newEmail}.`,
    'Klik tautan berikut untuk mengonfirmasi (berlaku 1 jam):',
    '',
    opts.link,
    '',
    'Setelah konfirmasi, Anda akan login menggunakan email baru.',
    'Jika Anda tidak meminta perubahan ini, abaikan email ini.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Anda meminta untuk mengganti email akun RPI dari <strong>${opts.oldEmail}</strong> ke <strong>${opts.newEmail}</strong>. Klik tombol berikut untuk mengonfirmasi (berlaku 1 jam):</p>
  <p style="margin:24px 0"><a href="${opts.link}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Konfirmasi email baru</a></p>
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${opts.link}</span></p>
  <p style="font-size:13px;color:#475569">Setelah konfirmasi, Anda akan login menggunakan email baru. Jika Anda tidak meminta perubahan ini, abaikan email ini.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function emailChangeNoticeEmail(opts: {
  name?: string | null
  oldEmail: string
  newEmail: string
  requestIp: string | null
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = 'Permintaan perubahan email akun RPI'
  const ipLine = opts.requestIp ? `IP permintaan: ${opts.requestIp}.` : ''
  const text = [
    greeting,
    '',
    `Kami menerima permintaan untuk mengganti email akun RPI Anda dari ${opts.oldEmail} ke ${opts.newEmail}.`,
    ipLine,
    '',
    'Permintaan ini tidak akan diaktifkan sampai email baru dikonfirmasi.',
    'Jika Anda tidak meminta perubahan ini, segera:',
    '  1. Ubah password Anda di /dashboard/keamanan/password',
    '  2. Hubungi support kami.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Kami menerima permintaan untuk mengganti email akun RPI Anda dari <strong>${opts.oldEmail}</strong> ke <strong>${opts.newEmail}</strong>.</p>
  ${opts.requestIp ? `<p style="font-size:13px;color:#475569">IP permintaan: <code>${opts.requestIp}</code></p>` : ''}
  <p>Permintaan ini tidak akan diaktifkan sampai email baru dikonfirmasi.</p>
  <p style="font-size:13px;color:#475569">Jika Anda tidak meminta perubahan ini, segera ubah password Anda dan hubungi support.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function loginAlertEmail(opts: {
  name?: string | null
  userAgent: string
  ip: string | null
  ipApprox: string
  when: Date
  securityUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = 'Login baru terdeteksi di akun RPI Anda'
  const whenStr = opts.when.toISOString()
  const ipLine = opts.ip ? `${opts.ip} (sekitar ${opts.ipApprox})` : opts.ipApprox
  const text = [
    greeting,
    '',
    'Kami melihat login baru ke akun RPI Anda dari perangkat yang belum pernah dipakai sebelumnya:',
    '',
    `Waktu       : ${whenStr}`,
    `User-Agent  : ${opts.userAgent}`,
    `IP          : ${ipLine}`,
    '',
    'Jika Anda yang masuk, abaikan email ini.',
    'Jika BUKAN Anda, segera:',
    `  1. Ubah password di ${opts.securityUrl}/password`,
    `  2. Aktifkan 2FA di ${opts.securityUrl}/2fa`,
    `  3. Cabut session aktif lain dari ${opts.securityUrl}`,
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Kami melihat login baru ke akun RPI Anda dari perangkat yang belum pernah dipakai sebelumnya:</p>
  <table style="font-size:14px;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Waktu</td><td style="padding:4px 0"><code>${whenStr}</code></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#475569">User-Agent</td><td style="padding:4px 0"><code style="word-break:break-all">${opts.userAgent}</code></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#475569">IP</td><td style="padding:4px 0"><code>${ipLine}</code></td></tr>
  </table>
  <p style="margin:24px 0"><a href="${opts.securityUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Buka pengaturan keamanan</a></p>
  <p style="font-size:13px;color:#475569">Jika Anda yang masuk, abaikan email ini. Jika BUKAN Anda — segera ubah password, aktifkan 2FA, dan cabut session yang tidak Anda kenal.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
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

export function weeklyDigestEmail(opts: {
  name: string | null
  period: string
  recentLogins: number
  newDevices: number
  pendingInvites: number
  securityEvents: number
  dashboardUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = `Ringkasan mingguan akun RPI Anda (${opts.period})`
  const text = [
    greeting,
    '',
    `Berikut ringkasan aktivitas akun RPI Anda untuk periode ${opts.period}:`,
    '',
    `Login terbaru        : ${opts.recentLogins}`,
    `Perangkat baru       : ${opts.newDevices}`,
    `Undangan tertunda    : ${opts.pendingInvites}`,
    `Peristiwa keamanan   : ${opts.securityEvents}`,
    '',
    `Buka dashboard Anda untuk detail lengkap: ${opts.dashboardUrl}`,
    '',
    'Jika ada aktivitas yang tidak Anda kenali, segera ubah password dan tinjau perangkat aktif Anda di pengaturan keamanan.',
    '',
    'Anda menerima email ini karena preferensi notifikasi keamanan aktif. Untuk berhenti, ubah preferensi di pengaturan notifikasi akun.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Berikut ringkasan aktivitas akun RPI Anda untuk periode <strong>${opts.period}</strong>:</p>
  <table style="font-size:14px;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Login terbaru</td><td style="padding:4px 0"><strong>${opts.recentLogins}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Perangkat baru</td><td style="padding:4px 0"><strong>${opts.newDevices}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Undangan tertunda</td><td style="padding:4px 0"><strong>${opts.pendingInvites}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Peristiwa keamanan</td><td style="padding:4px 0"><strong>${opts.securityEvents}</strong></td></tr>
  </table>
  <p style="margin:24px 0"><a href="${opts.dashboardUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Buka dashboard</a></p>
  <p style="font-size:13px;color:#475569">Jika ada aktivitas yang tidak Anda kenali, segera ubah password dan tinjau perangkat aktif Anda di pengaturan keamanan.</p>
  <p style="font-size:13px;color:#475569">Anda menerima email ini karena preferensi notifikasi keamanan aktif. Untuk berhenti, ubah preferensi di pengaturan notifikasi akun.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}
