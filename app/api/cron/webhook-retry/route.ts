import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { processRetryQueue } from '@/lib/webhooks/retry-worker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/webhook-retry
 *
 * Auth: `x-cron-secret` header must match `process.env.CRON_SECRET`.
 * If `CRON_SECRET` is unset, returns 503 "Cron disabled".
 *
 * Query params:
 *   - `dryRun=1`  — report what would happen, do not POST or mutate rows.
 *   - `limit=N`   — override the default batch size (default 50, max 200).
 *
 * Recommended cadence: every 1 minute. The worker is idempotent: rows are
 * claimed via an optimistic update so concurrent runs cannot double-deliver.
 */
export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_DISABLED', message: 'Cron disabled (CRON_SECRET unset).' },
      { status: 503 },
    )
  }
  const provided = req.headers.get('x-cron-secret') ?? ''
  if (provided !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === '1'
  const rawLimit = Number(url.searchParams.get('limit') ?? '50')
  const limit = Math.max(1, Math.min(200, Number.isFinite(rawLimit) ? rawLimit : 50))

  try {
    const summary = await processRetryQueue({ limit, dryRun })
    return NextResponse.json({ ok: true, dryRun, limit, ...summary })
  } catch (err) {
    console.error('[cron/webhook-retry] failed', err)
    return NextResponse.json(
      { error: 'RETRY_FAILED', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
