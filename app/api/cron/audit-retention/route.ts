import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { runGlobalRetentionCleanup } from '@/lib/audit/retention-cleanup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/audit-retention
 *
 * Auth: `x-cron-secret` header must match `process.env.CRON_SECRET`.
 * If `CRON_SECRET` is unset, returns 503 "Cron disabled" — never run
 * cleanup unauthenticated.
 *
 * Query params:
 *   - `dryRun=1` — report counts only, do not delete or archive.
 *
 * The endpoint also writes a single `audit.retention.cleanup.ran` audit
 * log row summarizing the run.
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

  try {
    const summary = await runGlobalRetentionCleanup({ dryRun })

    // Find a SUPERADMIN user to attribute the audit row to (AuditLog.userId
    // is non-null). Fall back to skipping the audit row if none exists.
    const systemUser = await prisma.user
      .findFirst({
        where: { globalRole: 'SUPERADMIN' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      .catch(() => null)

    if (systemUser) {
      await prisma.auditLog
        .create({
          data: {
            userId: systemUser.id,
            tenantId: null,
            action: 'DELETE',
            resource: 'audit.retention.cleanup.ran',
            metadata: {
              deleted: summary.deleted,
              archived: summary.archived,
              dryRun,
              byResourceType: summary.byResourceType,
              errors: summary.errors,
            },
          },
        })
        .catch(() => {})
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      deleted: summary.deleted,
      archived: summary.archived,
      byResourceType: summary.byResourceType,
      policies: summary.policies,
      errors: summary.errors,
    })
  } catch (err) {
    console.error('[cron/audit-retention] failed', err)
    return NextResponse.json(
      { error: 'CLEANUP_FAILED', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
