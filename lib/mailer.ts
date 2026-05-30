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

export function savedSearchAlertEmail(opts: {
  name: string | null
  searchName: string
  jobs: {
    title: string
    slug: string
    location: string
    tenantName: string
    salaryMin: number | null
    salaryMax: number | null
  }[]
  dashboardUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = `Lowongan baru cocok untuk pencarian "${opts.searchName}"`
  const baseUrl = opts.dashboardUrl.replace(/\/$/, '')

  const formatSalary = (min: number | null, max: number | null): string => {
    if (min == null && max == null) return ''
    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
    if (min != null && max != null) return ` — Rp ${fmt(min)}–${fmt(max)}`
    if (min != null) return ` — mulai Rp ${fmt(min)}`
    return ` — hingga Rp ${fmt(max as number)}`
  }

  const textLines = [
    greeting,
    '',
    `Kami menemukan ${opts.jobs.length} lowongan baru untuk pencarian tersimpan Anda "${opts.searchName}":`,
    '',
    ...opts.jobs.map((j) => {
      const salary = formatSalary(j.salaryMin, j.salaryMax)
      return `• ${j.title} — ${j.tenantName} (${j.location})${salary}\n  ${baseUrl}/lowongan/${j.slug}`
    }),
    '',
    `Kelola alert di ${baseUrl}/dashboard/lowongan-disimpan`,
    '',
    '— Tim Rumah Pekerja Indonesia',
  ]
  const text = textLines.join('\n')

  const items = opts.jobs
    .map((j) => {
      const salary = formatSalary(j.salaryMin, j.salaryMax)
      return `<li style="margin:8px 0">
        <a href="${baseUrl}/lowongan/${j.slug}" style="color:hsl(220,50%,14%);font-weight:600;text-decoration:underline">${j.title}</a>
        <div style="font-size:13px;color:#475569">${j.tenantName} · ${j.location}${salary}</div>
      </li>`
    })
    .join('')

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Kami menemukan <strong>${opts.jobs.length}</strong> lowongan baru untuk pencarian tersimpan Anda <strong>"${opts.searchName}"</strong>:</p>
  <ul style="padding-left:18px;margin:16px 0">${items}</ul>
  <p style="margin:24px 0"><a href="${baseUrl}/dashboard/lowongan-disimpan" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Kelola alert</a></p>
  <p style="font-size:13px;color:#475569">Kelola alert di <code>/dashboard/lowongan-disimpan</code>. Anda menerima email ini karena Anda mengaktifkan alert pada pencarian ini.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`

  return { subject, text, html }
}

export function applicationReceivedEmail(opts: {
  name?: string | null
  jobTitle: string
  tenantName: string
  applicationUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = `Lamaran Anda untuk ${opts.jobTitle} telah diterima`
  const text = [
    greeting,
    '',
    `Terima kasih — lamaran Anda untuk posisi "${opts.jobTitle}" di ${opts.tenantName} telah kami terima.`,
    '',
    'Tim rekrutmen akan meninjau profil dan CV Anda dalam beberapa hari ke depan.',
    'Anda dapat memantau status lamaran kapan saja di dashboard RPI:',
    '',
    opts.applicationUrl,
    '',
    'Tetap semangat dan jaga profil Anda agar selalu lengkap untuk peluang berikutnya.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Terima kasih — lamaran Anda untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong> telah kami terima.</p>
  <p>Tim rekrutmen akan meninjau profil dan CV Anda dalam beberapa hari ke depan. Anda dapat memantau status lamaran kapan saja di dashboard RPI.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat lamaran saya</a></p>
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${opts.applicationUrl}</span></p>
  <p style="font-size:13px;color:#475569">Tetap semangat dan jaga profil Anda agar selalu lengkap untuk peluang berikutnya.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function applicationNotifyEmail(opts: {
  recipientName?: string | null
  applicantName: string
  applicantEmail: string
  jobTitle: string
  dashboardUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.recipientName ? `Halo ${opts.recipientName},` : 'Halo,'
  const subject = `Lamaran baru untuk ${opts.jobTitle}`
  const text = [
    greeting,
    '',
    `Anda menerima lamaran baru untuk posisi "${opts.jobTitle}".`,
    '',
    `Nama pelamar : ${opts.applicantName}`,
    `Email        : ${opts.applicantEmail}`,
    '',
    'Tinjau lamaran dan CV pelamar di dashboard tenant:',
    '',
    opts.dashboardUrl,
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Anda menerima lamaran baru untuk posisi <strong>${opts.jobTitle}</strong>.</p>
  <table style="font-size:14px;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Nama pelamar</td><td style="padding:4px 0"><strong>${opts.applicantName}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#475569">Email</td><td style="padding:4px 0"><code>${opts.applicantEmail}</code></td></tr>
  </table>
  <p style="margin:24px 0"><a href="${opts.dashboardUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Tinjau lamaran</a></p>
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${opts.dashboardUrl}</span></p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function applicationStatusEmail(opts: {
  name: string | null
  jobTitle: string
  tenantName: string
  oldStatus: string
  newStatus: string // ApplicationStatus enum value
  applicationUrl: string // for candidate to check
  recruiterNote?: string | null // optional note from Application.notes
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const footer = `— Tim ${opts.tenantName} (via RPI)`
  const dateStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
    new Date(),
  )

  let subject: string
  let bodyTextLines: string[]
  let bodyHtml: string

  switch (opts.newStatus) {
    case 'REVIEWED': {
      subject = `Lamaran Anda untuk ${opts.jobTitle} sedang ditinjau`
      bodyTextLines = [
        `Kabar baik — lamaran Anda untuk posisi "${opts.jobTitle}" di ${opts.tenantName} kini sedang ditinjau oleh tim rekrutmen kami.`,
        '',
        'Kami sedang mempelajari profil dan kualifikasi Anda. Kami akan menghubungi Anda kembali begitu ada perkembangan.',
        '',
        'Anda dapat memantau status lamaran kapan saja di dashboard RPI:',
        opts.applicationUrl,
      ]
      bodyHtml = `
  <p>Kabar baik — lamaran Anda untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong> kini sedang <strong>ditinjau</strong> oleh tim rekrutmen kami.</p>
  <p>Kami sedang mempelajari profil dan kualifikasi Anda. Kami akan menghubungi Anda kembali begitu ada perkembangan.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat status lamaran</a></p>`
      break
    }
    case 'SHORTLISTED': {
      subject = `Anda masuk shortlist untuk ${opts.jobTitle}`
      bodyTextLines = [
        `Selamat! Anda masuk dalam shortlist kandidat untuk posisi "${opts.jobTitle}" di ${opts.tenantName}.`,
        '',
        'Profil Anda menonjol di antara pelamar lain. Tim rekrutmen kami akan menghubungi Anda mengenai langkah selanjutnya — biasanya berupa undangan wawancara atau permintaan informasi tambahan.',
        '',
        'Pastikan profil dan kontak Anda di RPI selalu terkini:',
        opts.applicationUrl,
      ]
      bodyHtml = `
  <p>Selamat! Anda masuk dalam <strong>shortlist</strong> kandidat untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong>.</p>
  <p>Profil Anda menonjol di antara pelamar lain. Tim rekrutmen kami akan menghubungi Anda mengenai langkah selanjutnya — biasanya berupa undangan wawancara atau permintaan informasi tambahan.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat status lamaran</a></p>`
      break
    }
    case 'INTERVIEW': {
      subject = `Anda diundang wawancara untuk ${opts.jobTitle}`
      bodyTextLines = [
        `Selamat — Anda diundang untuk mengikuti wawancara untuk posisi "${opts.jobTitle}" di ${opts.tenantName}.`,
        '',
        'Detail jadwal wawancara (tanggal, waktu, tautan/lokasi) tersedia di dashboard RPI Anda. Mohon segera memeriksa dan mengonfirmasi ketersediaan Anda:',
        opts.applicationUrl,
        '',
        'Tip: siapkan portofolio, dokumen pendukung, dan cek koneksi Anda jauh sebelum waktu wawancara.',
      ]
      bodyHtml = `
  <p>Selamat — Anda diundang untuk mengikuti <strong>wawancara</strong> untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong>.</p>
  <p>Detail jadwal wawancara (tanggal, waktu, tautan/lokasi) tersedia di dashboard RPI Anda. Mohon segera memeriksa dan mengonfirmasi ketersediaan Anda.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat detail wawancara</a></p>
  <p style="font-size:13px;color:#475569">Tip: siapkan portofolio, dokumen pendukung, dan cek koneksi Anda jauh sebelum waktu wawancara.</p>`
      break
    }
    case 'OFFERED': {
      subject = `Penawaran kerja: ${opts.jobTitle}`
      bodyTextLines = [
        `Kabar gembira! ${opts.tenantName} mengajukan penawaran kerja kepada Anda untuk posisi "${opts.jobTitle}".`,
        '',
        'Detail penawaran (kompensasi, tanggal mulai, dan dokumen) tersedia di dashboard RPI Anda. Mohon tinjau dan respons sesegera mungkin:',
        opts.applicationUrl,
        '',
        'Jika ada pertanyaan, jangan ragu menghubungi tim rekrutmen kami melalui kanal komunikasi yang biasa digunakan.',
      ]
      bodyHtml = `
  <p>Kabar gembira! <strong>${opts.tenantName}</strong> mengajukan <strong>penawaran kerja</strong> kepada Anda untuk posisi <strong>${opts.jobTitle}</strong>.</p>
  <p>Detail penawaran (kompensasi, tanggal mulai, dan dokumen) tersedia di dashboard RPI Anda. Mohon tinjau dan respons sesegera mungkin.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat detail penawaran</a></p>
  <p style="font-size:13px;color:#475569">Jika ada pertanyaan, jangan ragu menghubungi tim rekrutmen kami melalui kanal komunikasi yang biasa digunakan.</p>`
      break
    }
    case 'HIRED': {
      subject = `Selamat! Anda diterima untuk ${opts.jobTitle}`
      bodyTextLines = [
        `Selamat dan welcome aboard! Anda resmi diterima bekerja di ${opts.tenantName} untuk posisi "${opts.jobTitle}".`,
        '',
        'Kami senang menyambut Anda bergabung. Tim rekrutmen akan mengirimkan informasi onboarding (kontrak, dokumen administrasi, dan hari pertama kerja) secara terpisah.',
        '',
        'Pantau dashboard Anda untuk informasi terkait:',
        opts.applicationUrl,
        '',
        'Sekali lagi, selamat — kami percaya Anda akan memberi kontribusi yang berarti.',
      ]
      bodyHtml = `
  <p>Selamat dan <strong>welcome aboard!</strong> Anda resmi <strong>diterima bekerja</strong> di <strong>${opts.tenantName}</strong> untuk posisi <strong>${opts.jobTitle}</strong>.</p>
  <p>Kami senang menyambut Anda bergabung. Tim rekrutmen akan mengirimkan informasi onboarding (kontrak, dokumen administrasi, dan hari pertama kerja) secara terpisah.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Buka dashboard saya</a></p>
  <p style="font-size:13px;color:#475569">Sekali lagi, selamat — kami percaya Anda akan memberi kontribusi yang berarti.</p>`
      break
    }
    case 'REJECTED': {
      // Tactful tone — deliberately avoid the word "ditolak". Emphasize candidate
      // effort, depersonalize the decision, and explicitly encourage future
      // applications. Soft phrasing per product copy guidelines for REJECTED.
      subject = `Update lamaran Anda untuk ${opts.jobTitle}`
      bodyTextLines = [
        `Terima kasih sudah meluangkan waktu melamar posisi "${opts.jobTitle}" di ${opts.tenantName}.`,
        '',
        'Setelah pertimbangan matang, posisi ini telah diisi kandidat lain untuk saat ini. Keputusan ini sama sekali bukan cerminan dari kemampuan atau pengalaman Anda — proses seleksi melibatkan banyak faktor, termasuk kebutuhan spesifik tim pada periode tertentu.',
        '',
        'Kami sangat menghargai upaya, waktu, dan minat yang Anda tunjukkan selama proses ini. Profil Anda akan tetap tersimpan di RPI, dan kami sangat menganjurkan Anda untuk melamar peluang lain yang sesuai di masa depan — baik di kami maupun mitra RPI lainnya.',
        '',
        'Lihat lamaran lain yang sedang dibuka:',
        opts.applicationUrl,
        '',
        'Tetap semangat — kami yakin peluang yang tepat akan datang.',
      ]
      bodyHtml = `
  <p>Terima kasih sudah meluangkan waktu melamar posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong>.</p>
  <p>Setelah pertimbangan matang, posisi ini telah diisi kandidat lain untuk saat ini. Keputusan ini sama sekali bukan cerminan dari kemampuan atau pengalaman Anda — proses seleksi melibatkan banyak faktor, termasuk kebutuhan spesifik tim pada periode tertentu.</p>
  <p>Kami sangat menghargai upaya, waktu, dan minat yang Anda tunjukkan selama proses ini. Profil Anda akan tetap tersimpan di RPI, dan kami sangat menganjurkan Anda untuk melamar peluang lain yang sesuai di masa depan — baik di kami maupun mitra RPI lainnya.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Jelajahi lamaran saya</a></p>
  <p style="font-size:13px;color:#475569">Tetap semangat — kami yakin peluang yang tepat akan datang.</p>`
      break
    }
    default: {
      // Generic fallback for any unhandled status. updateApplicationStatus is
      // expected to filter out APPLIED/WITHDRAWN before calling this template,
      // so this branch should not be reached in practice.
      subject = `Update lamaran Anda untuk ${opts.jobTitle}`
      bodyTextLines = [
        `Status lamaran Anda untuk posisi "${opts.jobTitle}" di ${opts.tenantName} telah diperbarui menjadi: ${opts.newStatus}.`,
        '',
        'Lihat detail di dashboard RPI:',
        opts.applicationUrl,
      ]
      bodyHtml = `
  <p>Status lamaran Anda untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong> telah diperbarui menjadi <strong>${opts.newStatus}</strong>.</p>
  <p style="margin:24px 0"><a href="${opts.applicationUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat detail</a></p>`
    }
  }

  const noteTextBlock = opts.recruiterNote
    ? ['', 'Catatan dari rekruter:', opts.recruiterNote, '']
    : []
  const noteHtmlBlock = opts.recruiterNote
    ? `
  <table style="font-size:14px;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:6px">
    <tr><td style="padding:12px 16px;color:#475569">
      <div style="font-weight:600;margin-bottom:4px;color:#0f172a">Catatan dari rekruter</div>
      <div style="white-space:pre-wrap">${escapeHtml(opts.recruiterNote)}</div>
    </td></tr>
  </table>`
    : ''

  const text = [
    greeting,
    '',
    ...bodyTextLines,
    ...noteTextBlock,
    '',
    `Tanggal pembaruan: ${dateStr}`,
    '',
    footer,
  ].join('\n')

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  ${bodyHtml}
  ${noteHtmlBlock}
  <p style="font-size:13px;color:#475569">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${opts.applicationUrl}</span></p>
  <p style="font-size:13px;color:#475569">Tanggal pembaruan: ${dateStr}</p>
  <p style="font-size:13px;color:#475569">${footer}</p>
</body></html>`

  return { subject, text, html }
}

const INTERVIEW_TYPE_LABEL: Record<string, string> = {
  video: 'Video call',
  onsite: 'Onsite',
  phone: 'Telepon',
}

const interviewDateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'full',
  timeStyle: 'short',
})

function formatInterviewWhen(d: Date): string {
  try {
    return interviewDateFmt.format(d)
  } catch {
    return d.toISOString()
  }
}

export function interviewScheduledEmail(opts: {
  name?: string | null
  jobTitle: string
  tenantName: string
  scheduledAt: Date
  durationMin: number
  type: string
  meetingUrl?: string | null
  location?: string | null
  notes?: string | null
  dashboardUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = `Wawancara dijadwalkan untuk ${opts.jobTitle}`
  const typeLabel = INTERVIEW_TYPE_LABEL[opts.type] ?? opts.type
  const whenStr = formatInterviewWhen(opts.scheduledAt)

  const detailLinesText: string[] = [
    `Tanggal & jam : ${whenStr}`,
    `Durasi        : ${opts.durationMin} menit`,
    `Jenis         : ${typeLabel}`,
  ]
  if (opts.type === 'video' && opts.meetingUrl) {
    detailLinesText.push(`Tautan meeting: ${opts.meetingUrl}`)
  }
  if (opts.type === 'onsite' && opts.location) {
    detailLinesText.push(`Lokasi        : ${opts.location}`)
  }
  if (opts.notes) {
    detailLinesText.push('', 'Catatan dari rekruter:', opts.notes)
  }

  const text = [
    greeting,
    '',
    `${opts.tenantName} mengundang Anda untuk wawancara posisi "${opts.jobTitle}".`,
    '',
    ...detailLinesText,
    '',
    `Lihat detail dan tambahkan ke kalender Anda di: ${opts.dashboardUrl}`,
    '',
    'Mohon konfirmasi kehadiran dan persiapkan diri Anda sebaik mungkin.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')

  const detailRows: string[] = [
    `<tr><td style="padding:4px 12px 4px 0;color:#475569">Tanggal & jam</td><td style="padding:4px 0"><strong>${whenStr}</strong></td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;color:#475569">Durasi</td><td style="padding:4px 0"><strong>${opts.durationMin} menit</strong></td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;color:#475569">Jenis</td><td style="padding:4px 0"><strong>${typeLabel}</strong></td></tr>`,
  ]
  if (opts.type === 'video' && opts.meetingUrl) {
    detailRows.push(
      `<tr><td style="padding:4px 12px 4px 0;color:#475569">Tautan meeting</td><td style="padding:4px 0"><a href="${opts.meetingUrl}" style="word-break:break-all">${opts.meetingUrl}</a></td></tr>`,
    )
  }
  if (opts.type === 'onsite' && opts.location) {
    detailRows.push(
      `<tr><td style="padding:4px 12px 4px 0;color:#475569">Lokasi</td><td style="padding:4px 0">${opts.location}</td></tr>`,
    )
  }

  const notesBlock = opts.notes
    ? `<p style="font-size:13px;color:#475569"><strong>Catatan dari rekruter:</strong><br>${opts.notes.replace(/\n/g, '<br>')}</p>`
    : ''

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p><strong>${opts.tenantName}</strong> mengundang Anda untuk wawancara posisi <strong>${opts.jobTitle}</strong>.</p>
  <table style="font-size:14px;border-collapse:collapse;margin:16px 0">${detailRows.join('')}</table>
  ${notesBlock}
  <p style="margin:24px 0"><a href="${opts.dashboardUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat detail wawancara</a></p>
  <p style="font-size:13px;color:#475569">Mohon konfirmasi kehadiran dan persiapkan diri Anda sebaik mungkin.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function interviewReminderEmail(opts: {
  name?: string | null
  jobTitle: string
  tenantName: string
  scheduledAt: Date
  type: string
  meetingUrl?: string | null
  location?: string | null
  dashboardUrl: string
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = `Pengingat: wawancara besok untuk ${opts.jobTitle}`
  const typeLabel = INTERVIEW_TYPE_LABEL[opts.type] ?? opts.type
  const whenStr = formatInterviewWhen(opts.scheduledAt)

  const detailLinesText: string[] = [
    `Tanggal & jam : ${whenStr}`,
    `Jenis         : ${typeLabel}`,
  ]
  if (opts.type === 'video' && opts.meetingUrl) {
    detailLinesText.push(`Tautan meeting: ${opts.meetingUrl}`)
  }
  if (opts.type === 'onsite' && opts.location) {
    detailLinesText.push(`Lokasi        : ${opts.location}`)
  }

  const text = [
    greeting,
    '',
    `Pengingat: Anda dijadwalkan wawancara untuk posisi "${opts.jobTitle}" di ${opts.tenantName} besok.`,
    '',
    ...detailLinesText,
    '',
    `Detail lengkap: ${opts.dashboardUrl}`,
    '',
    'Pastikan koneksi/akses Anda siap sebelum wawancara dimulai.',
    '',
    'Anda menerima email ini karena preferensi notifikasi keamanan aktif.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')

  const detailRows: string[] = [
    `<tr><td style="padding:4px 12px 4px 0;color:#475569">Tanggal & jam</td><td style="padding:4px 0"><strong>${whenStr}</strong></td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;color:#475569">Jenis</td><td style="padding:4px 0"><strong>${typeLabel}</strong></td></tr>`,
  ]
  if (opts.type === 'video' && opts.meetingUrl) {
    detailRows.push(
      `<tr><td style="padding:4px 12px 4px 0;color:#475569">Tautan meeting</td><td style="padding:4px 0"><a href="${opts.meetingUrl}" style="word-break:break-all">${opts.meetingUrl}</a></td></tr>`,
    )
  }
  if (opts.type === 'onsite' && opts.location) {
    detailRows.push(
      `<tr><td style="padding:4px 12px 4px 0;color:#475569">Lokasi</td><td style="padding:4px 0">${opts.location}</td></tr>`,
    )
  }

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Pengingat: Anda dijadwalkan wawancara untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong> besok.</p>
  <table style="font-size:14px;border-collapse:collapse;margin:16px 0">${detailRows.join('')}</table>
  <p style="margin:24px 0"><a href="${opts.dashboardUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Lihat detail</a></p>
  <p style="font-size:13px;color:#475569">Pastikan koneksi/akses Anda siap sebelum wawancara dimulai.</p>
  <p style="font-size:13px;color:#475569">Anda menerima email ini karena preferensi notifikasi keamanan aktif. Untuk berhenti, ubah preferensi di pengaturan notifikasi akun.</p>
  <p style="font-size:13px;color:#475569">— Tim Rumah Pekerja Indonesia</p>
</body></html>`
  return { subject, text, html }
}

export function interviewCancelledEmail(opts: {
  name?: string | null
  jobTitle: string
  tenantName: string
  scheduledAt: Date
}): { subject: string; text: string; html: string } {
  const greeting = opts.name ? `Halo ${opts.name},` : 'Halo,'
  const subject = `Wawancara dibatalkan: ${opts.jobTitle}`
  const whenStr = formatInterviewWhen(opts.scheduledAt)
  const text = [
    greeting,
    '',
    `Wawancara Anda untuk posisi "${opts.jobTitle}" di ${opts.tenantName} yang dijadwalkan pada ${whenStr} telah dibatalkan oleh tim rekruter.`,
    '',
    'Jika ada pertanyaan, silakan menunggu kabar lanjutan dari tim rekruter atau hubungi mereka langsung.',
    '',
    '— Tim Rumah Pekerja Indonesia',
  ].join('\n')
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${greeting}</p>
  <p>Wawancara Anda untuk posisi <strong>${opts.jobTitle}</strong> di <strong>${opts.tenantName}</strong> yang dijadwalkan pada <strong>${whenStr}</strong> telah <strong>dibatalkan</strong> oleh tim rekruter.</p>
  <p style="font-size:13px;color:#475569">Jika ada pertanyaan, silakan menunggu kabar lanjutan dari tim rekruter atau hubungi mereka langsung.</p>
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
