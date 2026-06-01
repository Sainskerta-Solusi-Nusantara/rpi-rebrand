import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { rescoreAllStaleApplications } from '@/lib/match/match-actions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/match-rescore
 *
 * Auth: `x-cron-secret: <CRON_SECRET>` — must match env. Returns 503 when
 * CRON_SECRET is not set in the deployment so misconfigured environments
 * don't silently re-score (and run up DB load) without operator intent.
 *
 * Body / query (optional):
 *   - olderThanDays?: number  default 7
 *   - limit?:         number  default 100, hard-capped at 500 by the action
 *
 * Drains applications that are either unscored or were last scored before
 * `now - olderThanDays`, oldest first. Per-row failures are counted; the
 * sweep itself never throws.
 */
export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_DISABLED' },
      { status: 503 },
    )
  }

  const secret = req.headers.get('x-cron-secret') ?? ''
  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Accept tuning parameters from query string OR JSON body.
  const url = new URL(req.url)
  let olderThanDays = Number(url.searchParams.get('olderThanDays') ?? '')
  let limit = Number(url.searchParams.get('limit') ?? '')
  if (req.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = (await req.json()) as {
        olderThanDays?: number
        limit?: number
      }
      if (typeof body.olderThanDays === 'number') olderThanDays = body.olderThanDays
      if (typeof body.limit === 'number') limit = body.limit
    } catch {
      // Body is optional — ignore parse errors.
    }
  }

  const r = await rescoreAllStaleApplications({
    olderThanDays: Number.isFinite(olderThanDays) ? olderThanDays : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  })

  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 500 })
  }

  return NextResponse.json({
    scored: r.data?.scored ?? 0,
    errors: r.data?.errors ?? 0,
  })
}
