import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { sendEmail, weeklyDigestEmail } from '@/lib/mailer'
import { shouldSendEmail } from '@/lib/auth/notification-prefs'

/**
 * Compute the ISO-week label for a given date as `YYYY-Www`, e.g. `2026-W22`.
 *
 * Uses the standard ISO-8601 algorithm:
 *   - Weeks start on Monday.
 *   - The week containing the year's first Thursday is week 1.
 *   - Dates in late December / early January may belong to the adjacent
 *     ISO-year, which is what gets reported here (not the calendar year).
 */
export function weekPeriodFor(date: Date): string {
  // Work on a UTC copy so DST / local-timezone shifts can't move us between
  // ISO weeks. Cron will pass `new Date()` which is fine here.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  // ISO day of week: Mon=1 ... Sun=7
  const day = d.getUTCDay() || 7
  // Shift to the Thursday of the current ISO week (the canonical day).
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const isoYear = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

export type DigestPayload = {
  name: string | null
  recentLogins: number
  newDevices: number
  pendingInvites: number
  securityEvents: number
}

export type BuildResult = {
  shouldSend: boolean
  payload: DigestPayload
}

const SECURITY_PREFIXES = ['totp.', 'email_change.', 'account.oauth.'] as const

/**
 * Aggregate the last-7-days counters used by the weekly digest. Returns
 * `shouldSend=false` when every counter is zero so the cron job can skip
 * sending an empty mail.
 *
 * Counter semantics:
 *   - recentLogins: AuditLog rows with action=LOGIN for this user.
 *   - newDevices:   UserDevice rows whose `firstSeenAt` falls in the window
 *                   (i.e. devices first observed in the last 7 days — not
 *                   just devices that logged in again).
 *   - pendingInvites: Invitation rows matching the user's email that are
 *                   still pending (not accepted) and not expired.
 *   - securityEvents: AuditLog rows whose `resource` startsWith any of
 *                   `totp.`, `email_change.`, `account.oauth.` — covers
 *                   2FA changes, email change requests/completions, and
 *                   OAuth link/unlink. LOGIN is intentionally excluded
 *                   (counted separately).
 */
export async function buildUserDigest(userId: string): Promise<BuildResult> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const now = new Date()

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    .catch(() => null)

  if (!user) {
    return {
      shouldSend: false,
      payload: { name: null, recentLogins: 0, newDevices: 0, pendingInvites: 0, securityEvents: 0 },
    }
  }

  const [recentLogins, newDevices, pendingInvites, securityEvents] = await Promise.all([
    prisma.auditLog
      .count({
        where: {
          userId,
          action: AuditAction.LOGIN,
          createdAt: { gte: since },
        },
      })
      .catch(() => 0),
    prisma.userDevice
      .count({
        where: {
          userId,
          firstSeenAt: { gte: since },
        },
      })
      .catch(() => 0),
    prisma.invitation
      .count({
        where: {
          email: user.email,
          acceptedAt: null,
          expiresAt: { gt: now },
        },
      })
      .catch(() => 0),
    prisma.auditLog
      .count({
        where: {
          userId,
          createdAt: { gte: since },
          OR: SECURITY_PREFIXES.map((p) => ({
            resource: { startsWith: p },
          })),
        },
      })
      .catch(() => 0),
  ])

  const total = recentLogins + newDevices + pendingInvites + securityEvents
  return {
    shouldSend: total > 0,
    payload: {
      name: user.name,
      recentLogins,
      newDevices,
      pendingInvites,
      securityEvents,
    },
  }
}

export type SendResultRecord =
  | { sent: true }
  | { sent: false; reason: 'already_sent' | 'opted_out' | 'no_activity' | 'user_missing' | 'send_failed' | 'no_email' }

/**
 * Build & send the weekly digest for a single user. Idempotent per ISO week
 * thanks to `EmailDigestLog @@unique([userId, period])`.
 */
export async function sendUserDigest(userId: string): Promise<SendResultRecord> {
  const period = weekPeriodFor(new Date())

  // Idempotency check: skip if we already sent the digest for this period.
  const existing = await prisma.emailDigestLog
    .findUnique({
      where: { userId_period: { userId, period } },
      select: { id: true },
    })
    .catch(() => null)
  if (existing) return { sent: false, reason: 'already_sent' }

  // Gate on notification preference. We pick `security_event` because the
  // digest is dominated by security/account activity (login counts, new
  // devices, 2FA / email-change events). Users who want zero digest mail
  // can opt out there.
  const wantsEmail = await shouldSendEmail(userId, 'security_event')
  if (!wantsEmail) return { sent: false, reason: 'opted_out' }

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailVerified: true },
    })
    .catch(() => null)
  if (!user) return { sent: false, reason: 'user_missing' }
  if (!user.email) return { sent: false, reason: 'no_email' }

  const built = await buildUserDigest(userId)
  if (!built.shouldSend) return { sent: false, reason: 'no_activity' }

  const baseUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
  const dashboardUrl = `${baseUrl}/dashboard`

  const message = weeklyDigestEmail({
    name: built.payload.name,
    period,
    recentLogins: built.payload.recentLogins,
    newDevices: built.payload.newDevices,
    pendingInvites: built.payload.pendingInvites,
    securityEvents: built.payload.securityEvents,
    dashboardUrl,
  })

  const result = await sendEmail({
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  })

  if (!result.ok) {
    return { sent: false, reason: 'send_failed' }
  }

  // Record the send. If another concurrent run inserted the same row,
  // swallow the unique-constraint error — we still consider this "sent".
  try {
    await prisma.emailDigestLog.create({
      data: { userId, period },
    })
  } catch {
    // Already logged by a concurrent run — fine.
  }

  return { sent: true }
}
