import fs from 'node:fs/promises'
import path from 'node:path'
import type { SavedSearch } from '@prisma/client'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/mailer'
import { matchJobsForSearch, type MatchingJob } from './saved-search-queries'
import { signUnsubscribeToken } from './unsubscribe-token'

/**
 * Weekly saved-search digest worker.
 *
 * Run once per hour by cron. Each saved search that has alerts enabled and
 * has not been processed within the past 7 days is re-evaluated: matching
 * newly-published jobs are gathered, an email is rendered, and the
 * SavedSearch.lastAlertAt / lastAlertCount fields are bumped so we don't
 * re-pick up the same row every hour.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type DigestUser = {
  id: string
  email: string
  name: string | null
}

export type DigestJobItem = {
  title: string
  slug: string
  location: string
  tenantName: string
  salaryMin: number | null
  salaryMax: number | null
}

export type DigestPayload = {
  subject: string
  htmlBody: string
  textBody: string
}

function formatRupiah(min: number | null, max: number | null): string {
  if (min == null && max == null) return ''
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
  if (min != null && max != null) return ` — Rp ${fmt(min)}–${fmt(max)}`
  if (min != null) return ` — mulai Rp ${fmt(min)}`
  return ` — hingga Rp ${fmt(max as number)}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function criteriaSummary(s: Pick<SavedSearch, 'query' | 'categorySlug' | 'location' | 'employmentType'>): string {
  const parts: string[] = []
  if (s.query) parts.push(`Kata kunci: ${s.query}`)
  if (s.categorySlug) parts.push(`Kategori: ${s.categorySlug}`)
  if (s.location) parts.push(`Lokasi: ${s.location}`)
  if (s.employmentType) parts.push(`Tipe: ${s.employmentType}`)
  return parts.length === 0 ? 'Semua lowongan' : parts.join(' · ')
}

function baseUrl(): string {
  return env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
}

/**
 * Render the subject + HTML + text bodies for a digest email. Jobs that
 * arrive as full DB rows are mapped to a slimmer per-item shape first so
 * this function is also reusable in tests with simple fixtures.
 */
export function buildDigestPayload(
  search: SavedSearch,
  jobs: MatchingJob[] | DigestJobItem[],
  opts?: {
    userName?: string | null
    settingsUrl?: string
    unsubscribeUrl?: string
  },
): DigestPayload {
  const items: DigestJobItem[] = jobs.map((j) => {
    if ('tenant' in j) {
      return {
        title: j.title,
        slug: j.slug,
        location: j.location,
        tenantName: j.tenant.name,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
      }
    }
    return j
  })

  const base = baseUrl()
  const settingsUrl =
    opts?.settingsUrl ?? `${base}/dashboard/pencarian-tersimpan`
  const unsubscribeUrl = opts?.unsubscribeUrl ?? `${base}/saved-search/unsubscribe/_`
  const greeting = opts?.userName ? `Halo ${opts.userName},` : 'Halo,'

  const subject = `${items.length} lowongan baru untuk pencarian Anda: ${search.name}`

  // ---- Plain-text body ----------------------------------------------------
  const textLines = [
    greeting,
    '',
    `Kami menemukan ${items.length} lowongan baru cocok dengan pencarian Anda "${search.name}".`,
    '',
    `Kriteria: ${criteriaSummary(search)}`,
    '',
    ...items.map((j) => {
      const salary = formatRupiah(j.salaryMin, j.salaryMax)
      return `• ${j.title} — ${j.tenantName} (${j.location})${salary}\n  ${base}/jobs/${j.slug}`
    }),
    '',
    `Kelola alert: ${settingsUrl}`,
    `Berhenti berlangganan: ${unsubscribeUrl}`,
    '',
    '— Tim SSN Pekerja',
  ]
  const textBody = textLines.join('\n')

  // ---- HTML body ----------------------------------------------------------
  const liItems = items
    .map((j) => {
      const salary = formatRupiah(j.salaryMin, j.salaryMax)
      const safeTitle = escapeHtml(j.title)
      const safeTenant = escapeHtml(j.tenantName)
      const safeLocation = escapeHtml(j.location)
      const safeSalary = escapeHtml(salary)
      const safeSlug = encodeURIComponent(j.slug)
      return `<li style="margin:8px 0">
        <a href="${base}/jobs/${safeSlug}" style="color:hsl(220,50%,14%);font-weight:600;text-decoration:underline">${safeTitle}</a>
        <div style="font-size:13px;color:#475569">${safeTenant} · ${safeLocation}${safeSalary}</div>
      </li>`
    })
    .join('')

  const htmlBody = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6">
  <p>${escapeHtml(greeting)}</p>
  <p>Kami menemukan <strong>${items.length}</strong> lowongan baru cocok dengan pencarian Anda <strong>"${escapeHtml(search.name)}"</strong>.</p>
  <p style="font-size:13px;color:#475569">Kriteria: ${escapeHtml(criteriaSummary(search))}</p>
  <ul style="padding-left:18px;margin:16px 0">${liItems}</ul>
  <p style="margin:24px 0">
    <a href="${settingsUrl}" style="display:inline-block;background:hsl(220,50%,14%);color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Kelola alert</a>
  </p>
  <p style="font-size:13px;color:#475569">
    Kelola alert: <a href="${settingsUrl}">${settingsUrl}</a><br>
    Berhenti berlangganan: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a>
  </p>
  <p style="font-size:13px;color:#475569">— Tim SSN Pekerja</p>
</body></html>`

  return { subject, htmlBody, textBody }
}

export type DeliveryStatus =
  | { sent: true; id: string }
  | { sent: false; reason: string }

/**
 * Render and dispatch the digest mail for a single (user, search, jobs)
 * tuple. Uses the project mailer (Resend in prod / dev-log + outbox file
 * fallback otherwise). Returns a DeliveryStatus the caller can summarize.
 */
export async function sendDigestEmail(
  user: DigestUser,
  search: SavedSearch,
  jobs: MatchingJob[],
): Promise<DeliveryStatus> {
  if (!user.email) return { sent: false, reason: 'no_email' }
  if (jobs.length === 0) return { sent: false, reason: 'no_matches' }

  const base = baseUrl()
  const settingsUrl = `${base}/dashboard/pencarian-tersimpan`
  const token = signUnsubscribeToken(search.id, user.id)
  const unsubscribeUrl = token
    ? `${base}/saved-search/unsubscribe/${token}`
    : `${base}/dashboard/pencarian-tersimpan`

  const payload = buildDigestPayload(search, jobs, {
    userName: user.name,
    settingsUrl,
    unsubscribeUrl,
  })

  try {
    const result = await sendEmail({
      to: user.email,
      subject: payload.subject,
      text: payload.textBody,
      html: payload.htmlBody,
    })

    if (result.ok) {
      // Mirror to an on-disk outbox in development so testers can inspect
      // the actual rendered payload. Best-effort — log-only on failure.
      if (!env.RESEND_API_KEY) {
        await writeOutboxCopy(user.id, search.id, payload).catch(() => undefined)
      }
      return { sent: true, id: result.id }
    }
    return { sent: false, reason: result.error }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'send_failed'
    console.error('[sendDigestEmail] failed', { searchId: search.id, msg })
    return { sent: false, reason: msg }
  }
}

async function writeOutboxCopy(
  userId: string,
  searchId: string,
  payload: DigestPayload,
): Promise<void> {
  const datePart = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const dir = path.join(process.cwd(), 'uploads', 'email-outbox', datePart)
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, `${userId}-${searchId}.eml`)
  const body = [
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="ssn-digest"',
    '',
    '--ssn-digest',
    'Content-Type: text/plain; charset="utf-8"',
    '',
    payload.textBody,
    '',
    '--ssn-digest',
    'Content-Type: text/html; charset="utf-8"',
    '',
    payload.htmlBody,
    '',
    '--ssn-digest--',
    '',
  ].join('\n')
  await fs.writeFile(file, body, 'utf8')
}

export type DigestUserSummary = {
  userId: string
  searchId: string
  searchName: string
  matches: number
  sent: boolean
  reason?: string
}

export type DigestRunSummary = {
  processed: number
  sent: number
  skipped: number
  byUser: DigestUserSummary[]
}

/**
 * Sweep all saved searches that are due for an alert and (optionally)
 * send digest emails to their owners.
 *
 * "Due" = `emailAlerts=true` AND (`lastAlertAt IS NULL` OR
 * `lastAlertAt < now - 7d`).
 *
 * For each due row:
 *   - Resolve `since = max(lastAlertAt, now - 7d)` — clamps first-time
 *     sends to a 7d window so a brand-new search doesn't blast months of
 *     archived listings.
 *   - Re-filter matched jobs at send time to drop anything that became
 *     un-PUBLISHED between match and now (defensive).
 *   - Send the mail (when not dry-run). Update lastAlertAt/Count even when
 *     zero matches so we don't re-evaluate the same row every hour.
 *   - Skip silently when the owner was deleted between scheduling & send.
 */
export async function runWeeklyDigest(
  opts: { dryRun: boolean },
): Promise<DigestRunSummary> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - WEEK_MS)
  const summary: DigestRunSummary = {
    processed: 0,
    sent: 0,
    skipped: 0,
    byUser: [],
  }

  let dueSearches: SavedSearch[]
  try {
    dueSearches = await prisma.savedSearch.findMany({
      where: {
        emailAlerts: true,
        OR: [{ lastAlertAt: null }, { lastAlertAt: { lt: cutoff } }],
      },
      orderBy: { id: 'asc' },
    })
  } catch (err) {
    console.error('[runWeeklyDigest] findMany failed', err)
    return summary
  }

  for (const search of dueSearches) {
    summary.processed++

    const user = await prisma.user
      .findUnique({
        where: { id: search.userId },
        select: { id: true, email: true, name: true },
      })
      .catch(() => null)

    if (!user) {
      // Owner deleted between insertion and send. Skip silently — the row
      // will be cascade-deleted, so we don't even need to bump cooldown.
      summary.skipped++
      continue
    }

    const sinceBase = search.lastAlertAt ?? cutoff
    const since = sinceBase < cutoff ? cutoff : sinceBase

    let jobs: MatchingJob[] = []
    try {
      jobs = await matchJobsForSearch(search, since)
    } catch (err) {
      console.error('[runWeeklyDigest] match failed', { searchId: search.id, err })
    }

    // Defensive re-filter — drop any jobs that became un-PUBLISHED since
    // the initial match. matchJobsForSearch already filters by status, but
    // be paranoid in case of races between SELECT and SEND.
    if (jobs.length > 0) {
      try {
        const stillPublished = await prisma.job.findMany({
          where: {
            id: { in: jobs.map((j) => j.id) },
            status: 'PUBLISHED',
          },
          select: { id: true },
        })
        const live = new Set(stillPublished.map((j) => j.id))
        jobs = jobs.filter((j) => live.has(j.id))
      } catch (err) {
        console.error('[runWeeklyDigest] re-verify failed', { searchId: search.id, err })
      }
    }

    let sent = false
    let reason: string | undefined
    if (jobs.length > 0 && !opts.dryRun) {
      const status = await sendDigestEmail(
        { id: user.id, email: user.email ?? '', name: user.name },
        search,
        jobs,
      )
      sent = status.sent
      reason = status.sent ? undefined : status.reason
    } else if (jobs.length > 0 && opts.dryRun) {
      sent = false
      reason = 'dry_run'
    } else {
      reason = 'no_matches'
    }

    // Always bump the cooldown — even on zero matches — so the row isn't
    // re-evaluated every cron tick within the next 7 days. Exception: when
    // a real send failed, leave lastAlertAt unchanged so the next run can
    // retry.
    const shouldBumpCooldown = opts.dryRun || jobs.length === 0 || sent
    if (shouldBumpCooldown) {
      try {
        await prisma.savedSearch.update({
          where: { id: search.id },
          data: { lastAlertAt: now, lastAlertCount: jobs.length },
        })
      } catch (err) {
        console.error('[runWeeklyDigest] cooldown update failed', {
          searchId: search.id,
          err,
        })
      }
    }

    if (sent) summary.sent++
    else if (jobs.length === 0) summary.skipped++

    summary.byUser.push({
      userId: user.id,
      searchId: search.id,
      searchName: search.name,
      matches: jobs.length,
      sent,
      reason,
    })
  }

  return summary
}
