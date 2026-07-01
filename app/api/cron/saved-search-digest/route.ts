import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { isCronAuthorized } from '@/lib/cron/auth'
import { runWeeklyDigest } from '@/lib/saved-search/digest-sender'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/saved-search-digest
 *
 * Auth: header `x-cron-secret` must equal `env.CRON_SECRET`. When the env
 * var is unset the endpoint returns 503 — deliberately so an unconfigured
 * deployment cannot accidentally trigger digest mail.
 *
 * Body: ignored. Returns the run summary as JSON:
 *   { processed, sent, skipped, byUser: [...] }
 */
export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET_NOT_CONFIGURED' },
      { status: 503 },
    )
  }

  if (!isCronAuthorized(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const summary = await runWeeklyDigest({ dryRun: false })
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[cron/saved-search-digest] failed', err)
    return NextResponse.json(
      { error: 'DIGEST_FAILED', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
