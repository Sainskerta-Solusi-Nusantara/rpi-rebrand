import { NextResponse, type NextRequest } from 'next/server'
import type { SavedSearch } from '@prisma/client'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { sendEmail, savedSearchAlertEmail } from '@/lib/mailer'
import { findMatchingJobs, type MatchingJob } from '@/lib/saved-searches/queries'

export const dynamic = 'force-dynamic'

const BATCH_SIZE = 50
const MAX_REPORT_ENTRIES = 100
// Cap how far back we'll backfill matches for new saved searches that have
// never been alerted yet. Prevents flooding a fresh subscriber with months of
// archived listings on the first run.
const MAX_BACKFILL_MS = 7 * 24 * 60 * 60 * 1000

type ReportEntry = {
  savedSearchId: string
  sent: boolean
  matches?: number
  reason?:
    | 'no_matches'
    | 'no_email'
    | 'user_missing'
    | 'send_failed'
    | 'alerts_disabled'
    | 'not_found'
}

function computeSince(
  search: Pick<SavedSearch, 'lastAlertAt'>,
  userCreatedAt: Date,
  now: Date,
): Date {
  const earliestAllowed = new Date(now.getTime() - MAX_BACKFILL_MS)
  const base = search.lastAlertAt ?? userCreatedAt
  return base > earliestAllowed ? base : earliestAllowed
}

/**
 * POST /api/cron/saved-search-alerts
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` — must match env. When
 * CRON_SECRET is unset the endpoint always returns 401.
 *
 * Query params:
 *   - `savedSearchId=<id>`: process only this saved search (manual test).
 *
 * Otherwise iterates all SavedSearch rows with `emailAlerts=true` in
 * cursor-paginated batches of 50 and emits one alert email per row that has
 * at least one matching newly-published job.
 */
export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_DISABLED' }, { status: 401 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const url = new URL(req.url)
  const singleId = url.searchParams.get('savedSearchId')?.trim() || null

  const report: ReportEntry[] = []
  let processed = 0
  let sentCount = 0
  const now = new Date()

  const baseUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''

  async function runOne(searchId: string) {
    processed++
    const search = await prisma.savedSearch
      .findUnique({ where: { id: searchId } })
      .catch(() => null)
    if (!search) {
      if (report.length < MAX_REPORT_ENTRIES) {
        report.push({ savedSearchId: searchId, sent: false, reason: 'not_found' })
      }
      return
    }
    if (!search.emailAlerts) {
      if (report.length < MAX_REPORT_ENTRIES) {
        report.push({
          savedSearchId: searchId,
          sent: false,
          reason: 'alerts_disabled',
        })
      }
      return
    }

    const user = await prisma.user
      .findUnique({
        where: { id: search.userId },
        select: { id: true, email: true, name: true, createdAt: true },
      })
      .catch(() => null)
    if (!user) {
      if (report.length < MAX_REPORT_ENTRIES) {
        report.push({ savedSearchId: searchId, sent: false, reason: 'user_missing' })
      }
      return
    }
    if (!user.email) {
      if (report.length < MAX_REPORT_ENTRIES) {
        report.push({ savedSearchId: searchId, sent: false, reason: 'no_email' })
      }
      return
    }

    const since = computeSince(search, user.createdAt, now)
    let matches: MatchingJob[]
    try {
      matches = await findMatchingJobs(search, since, 5)
    } catch (err) {
      console.error('[cron/saved-search-alerts] findMatchingJobs failed', {
        searchId,
        err,
      })
      matches = []
    }

    if (matches.length === 0) {
      if (report.length < MAX_REPORT_ENTRIES) {
        report.push({
          savedSearchId: searchId,
          sent: false,
          reason: 'no_matches',
          matches: 0,
        })
      }
      return
    }

    const message = savedSearchAlertEmail({
      name: user.name,
      searchName: search.name,
      jobs: matches.map((j) => ({
        title: j.title,
        slug: j.slug,
        location: j.location,
        tenantName: j.tenant.name,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
      })),
      dashboardUrl: baseUrl,
    })

    const result = await sendEmail({
      to: user.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })

    if (!result.ok) {
      console.error('[cron/saved-search-alerts] sendEmail failed', {
        searchId,
        error: result.error,
      })
      if (report.length < MAX_REPORT_ENTRIES) {
        report.push({
          savedSearchId: searchId,
          sent: false,
          reason: 'send_failed',
          matches: matches.length,
        })
      }
      return
    }

    // Record the send so the next run picks up at this cutoff.
    try {
      await prisma.savedSearch.update({
        where: { id: searchId },
        data: { lastAlertAt: now, lastAlertCount: matches.length },
      })
    } catch (err) {
      console.error('[cron/saved-search-alerts] update SavedSearch failed', {
        searchId,
        err,
      })
    }

    sentCount++
    if (report.length < MAX_REPORT_ENTRIES) {
      report.push({ savedSearchId: searchId, sent: true, matches: matches.length })
    }
  }

  try {
    if (singleId) {
      await runOne(singleId)
    } else {
      let cursor: string | null = null
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const batch: { id: string }[] = await prisma.savedSearch.findMany({
          where: { emailAlerts: true },
          select: { id: true },
          orderBy: { id: 'asc' },
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        })
        if (batch.length === 0) break
        for (const s of batch) {
          await runOne(s.id)
        }
        if (batch.length < BATCH_SIZE) break
        const last = batch[batch.length - 1]
        if (!last) break
        cursor = last.id
      }
    }
  } catch (err) {
    console.error('[cron/saved-search-alerts] sweep failed', err)
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
