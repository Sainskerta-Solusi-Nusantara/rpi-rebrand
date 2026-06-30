import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { isCronAuthorized } from '@/lib/cron/auth'
import { sendEmail, interviewReminderEmail } from '@/lib/mailer'
import { shouldSendEmail } from '@/lib/auth/notification-prefs'

export const dynamic = 'force-dynamic'

const MAX_REPORT_ENTRIES = 100

type ReportEntry =
  | { interviewId: string; sent: true }
  | { interviewId: string; sent: false; reason: string }

/**
 * POST /api/cron/interview-reminders
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` — required, identical pattern
 * to /api/cron/digest. Sweeps `InterviewSchedule` rows where:
 *   - scheduledAt ∈ [now+23h, now+25h]  (H-1 window, with 1h slack)
 *   - status === 'scheduled'
 *   - reminderSentAt IS NULL
 *
 * For each candidate, checks the `security_event` notification pref so users
 * who opted out of account-related mail are skipped. Marks reminderSentAt
 * before/after to make double-fires idempotent within a cron tick.
 */
export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_DISABLED' }, { status: 401 })
  }

  if (!isCronAuthorized(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const now = Date.now()
  const windowStart = new Date(now + 23 * 60 * 60 * 1000)
  const windowEnd = new Date(now + 25 * 60 * 60 * 1000)

  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  const report: ReportEntry[] = []
  let processed = 0
  let sentCount = 0

  try {
    const candidates = await prisma.interviewSchedule.findMany({
      where: {
        status: 'scheduled',
        reminderSentAt: null,
        scheduledAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        scheduledAt: true,
        type: true,
        meetingUrl: true,
        location: true,
        application: {
          select: {
            id: true,
            userId: true,
            job: { select: { title: true } },
            tenant: { select: { name: true } },
            user: { select: { email: true, name: true } },
          },
        },
      },
      take: 500,
    })

    for (const iv of candidates) {
      processed++
      const candidate = iv.application.user
      const pushReport = (entry: ReportEntry) => {
        if (report.length < MAX_REPORT_ENTRIES) report.push(entry)
      }

      if (!candidate?.email) {
        pushReport({ interviewId: iv.id, sent: false, reason: 'no_email' })
        continue
      }

      // Pref gate: security_event (account-related, less urgent than the
      // initial schedule mail — recruiter has already alerted them).
      const wants = await shouldSendEmail(
        iv.application.userId,
        'security_event',
      ).catch(() => true)
      if (!wants) {
        // Still mark reminderSentAt so we don't re-evaluate this row each tick.
        await prisma.interviewSchedule
          .update({
            where: { id: iv.id },
            data: { reminderSentAt: new Date() },
          })
          .catch(() => null)
        pushReport({ interviewId: iv.id, sent: false, reason: 'opted_out' })
        continue
      }

      try {
        const tpl = interviewReminderEmail({
          name: candidate.name,
          jobTitle: iv.application.job.title,
          tenantName: iv.application.tenant.name,
          scheduledAt: iv.scheduledAt,
          type: iv.type,
          meetingUrl: iv.meetingUrl,
          location: iv.location,
          dashboardUrl: `${baseUrl}/dashboard/lamaran/${iv.application.id}/wawancara`,
        })
        const result = await sendEmail({
          to: candidate.email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        })

        // Mark reminderSentAt regardless of send result to prevent retry storms;
        // if Resend later transients, manual re-trigger via query param can
        // be added if needed.
        await prisma.interviewSchedule
          .update({
            where: { id: iv.id },
            data: { reminderSentAt: new Date() },
          })
          .catch(() => null)

        if (result.ok) {
          sentCount++
          pushReport({ interviewId: iv.id, sent: true })
        } else {
          console.error(
            '[cron/interview-reminders] mailer failed',
            iv.id,
            result.error,
          )
          pushReport({
            interviewId: iv.id,
            sent: false,
            reason: 'send_failed',
          })
        }
      } catch (err) {
        console.error('[cron/interview-reminders] threw', iv.id, err)
        pushReport({ interviewId: iv.id, sent: false, reason: 'send_failed' })
      }
    }
  } catch (err) {
    console.error('[cron/interview-reminders] sweep failed', err)
    return NextResponse.json(
      {
        error: 'SWEEP_FAILED',
        processed,
        sent: sentCount,
        results: report,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    processed,
    sent: sentCount,
    results: report,
  })
}
