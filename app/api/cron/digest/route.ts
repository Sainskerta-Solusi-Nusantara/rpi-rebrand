import { NextResponse, type NextRequest } from 'next/server'
import { UserStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { sendUserDigest, type SendResultRecord } from '@/lib/digest/builder'

export const dynamic = 'force-dynamic'

const BATCH_SIZE = 100
const MAX_REPORT_ENTRIES = 100

type FailureReason = Extract<SendResultRecord, { sent: false }>['reason']

type ReportEntry = {
  userId: string
  sent: boolean
  reason?: FailureReason
}

/**
 * POST /api/cron/digest
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` — must match env. When
 * CRON_SECRET is unset the endpoint always returns 401 so an unconfigured
 * deployment cannot accidentally blast emails.
 *
 * Query params:
 *   - `userId=<id>`: process only this user (handy for manual testing).
 *
 * Otherwise iterates ALL active, email-verified users in batches of 100 via
 * cursor pagination and dispatches one digest mail per user. Errors per
 * user are caught and reported as `sent:false, reason:'send_failed'` —
 * one bad user must not abort the whole sweep.
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
  const singleUserId = url.searchParams.get('userId')?.trim() || null

  const report: ReportEntry[] = []
  let processed = 0
  let sentCount = 0

  async function runOne(userId: string) {
    processed++
    let result: SendResultRecord
    try {
      result = await sendUserDigest(userId)
    } catch (err) {
      console.error('[cron/digest] sendUserDigest threw', { userId, err })
      result = { sent: false, reason: 'send_failed' }
    }
    if (result.sent) sentCount++
    if (report.length < MAX_REPORT_ENTRIES) {
      report.push(
        result.sent
          ? { userId, sent: true }
          : { userId, sent: false, reason: result.reason },
      )
    }
  }

  try {
    if (singleUserId) {
      await runOne(singleUserId)
    } else {
      let cursor: string | null = null
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const batch: { id: string }[] = await prisma.user.findMany({
          where: {
            status: UserStatus.ACTIVE,
            emailVerified: { not: null },
          },
          select: { id: true },
          orderBy: { id: 'asc' },
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        })
        if (batch.length === 0) break
        for (const u of batch) {
          await runOne(u.id)
        }
        if (batch.length < BATCH_SIZE) break
        const last = batch[batch.length - 1]
        if (!last) break
        cursor = last.id
      }
    }
  } catch (err) {
    console.error('[cron/digest] sweep failed', err)
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
