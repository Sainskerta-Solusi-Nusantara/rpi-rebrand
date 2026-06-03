import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  attemptDelivery,
  buildDeliveryBody,
  type DeliveryOutcome,
} from '@/lib/webhooks/dispatch'
import {
  MAX_ATTEMPTS,
  computeNextRetry,
  isRetryableError,
  shouldDeadLetter,
} from '@/lib/webhooks/retry-policy'
import { captureException } from '@/lib/observability/report'

const MAX_RESPONSE_BODY_CHARS = 4096

export interface RetryQueueSummary {
  /** Rows examined this run (locked + attempted). */
  processed: number
  /** Deliveries that succeeded this run. */
  succeeded: number
  /** Deliveries that failed but remain pending for a future retry. */
  failed: number
  /** Deliveries that transitioned to dead_letter this run. */
  deadLettered: number
  /** Pending rows skipped because their webhook is disabled. */
  skippedDisabled: number
  /** Rows whose row-level lock was lost to a concurrent worker. */
  lockLost: number
}

function truncate(value: string | null, max: number): string | null {
  if (value == null) return null
  return value.length <= max ? value : value.slice(0, max)
}

/**
 * Atomically claim a pending delivery row. Returns true iff this caller won
 * the race and may proceed with the network attempt. Optimistic concurrency:
 * a sibling worker that also picked the row will fail this update because the
 * status no longer matches the WHERE clause.
 *
 * We toggle `nextRetryAt` to null while in-flight so a follow-up sweep cannot
 * re-select the same row before this attempt completes.
 */
async function claimDelivery(deliveryId: string): Promise<boolean> {
  try {
    const result = await prisma.webhookDelivery.updateMany({
      where: { id: deliveryId, status: 'pending' },
      data: { nextRetryAt: null },
    })
    return result.count === 1
  } catch {
    return false
  }
}

/**
 * Apply a delivery outcome to the WebhookDelivery row, updating status,
 * statusCode, error and nextRetryAt according to the retry policy.
 * Bumps `attempt` since the row has just been delivered (or attempted).
 */
async function recordOutcome(
  delivery: { id: string; webhookId: string; attempt: number },
  outcome: DeliveryOutcome,
): Promise<{ status: string }> {
  const nextAttempt = delivery.attempt + 1

  let data: Prisma.WebhookDeliveryUpdateInput

  if (outcome.kind === 'success') {
    data = {
      status: 'success',
      statusCode: outcome.statusCode,
      responseBody: truncate(outcome.responseBody, MAX_RESPONSE_BODY_CHARS),
      attempt: nextAttempt,
      error: null,
      nextRetryAt: null,
      deliveredAt: new Date(),
    }
  } else if (outcome.kind === 'http_failure') {
    const dead = shouldDeadLetter(nextAttempt, outcome.statusCode)
    data = {
      status: dead ? 'dead_letter' : 'pending',
      statusCode: outcome.statusCode,
      responseBody: truncate(outcome.responseBody, MAX_RESPONSE_BODY_CHARS),
      attempt: nextAttempt,
      error: `HTTP ${outcome.statusCode}`,
      nextRetryAt: dead ? null : computeNextRetry(nextAttempt),
    }
  } else {
    const retryable = isRetryableError(outcome.error)
    const dead = !retryable || shouldDeadLetter(nextAttempt)
    data = {
      status: dead ? 'dead_letter' : 'pending',
      responseBody: truncate(outcome.message, MAX_RESPONSE_BODY_CHARS),
      attempt: nextAttempt,
      error: truncate(outcome.message, MAX_RESPONSE_BODY_CHARS),
      nextRetryAt: dead ? null : computeNextRetry(nextAttempt),
    }
  }

  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data,
  })

  if (data.status === 'dead_letter') {
    await recordDeadLetterAudit(delivery.webhookId, delivery.id, String(data.error ?? ''))
  }

  return { status: String(data.status) }
}

async function recordDeadLetterAudit(
  webhookId: string,
  deliveryId: string,
  reason: string,
): Promise<void> {
  try {
    const wh = await prisma.tenantWebhook.findUnique({
      where: { id: webhookId },
      select: { tenantId: true },
    })
    if (!wh) return
    const systemUser = await prisma.user.findFirst({
      where: { globalRole: 'SUPERADMIN' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })
    if (!systemUser) return
    await prisma.auditLog.create({
      data: {
        tenantId: wh.tenantId,
        userId: systemUser.id,
        action: 'UPDATE',
        resource: 'webhook.delivery.dead_lettered',
        resourceId: deliveryId,
        metadata: { webhookId, reason: reason || 'unknown' },
      },
    })
  } catch (err) {
    captureException(err, { scope: 'webhooks/retry-worker', at: 'dead_letter-audit', webhookId, deliveryId })
  }
}

/**
 * Drain the retry queue once. Intended to be called by a cron job every
 * minute or so. Selects up to `limit` pending deliveries whose `nextRetryAt`
 * is due, locks each row with an optimistic update, then attempts re-delivery.
 *
 * Safe to run concurrently — row locking via `updateMany({status: 'pending'})`
 * ensures at most one worker processes a given delivery per cycle.
 */
export async function processRetryQueue(
  opts: { limit?: number; dryRun?: boolean } = {},
): Promise<RetryQueueSummary> {
  const limit = opts.limit ?? 50
  const dryRun = opts.dryRun ?? false

  const now = new Date()
  const summary: RetryQueueSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    deadLettered: 0,
    skippedDisabled: 0,
    lockLost: 0,
  }

  const candidates = await prisma.webhookDelivery.findMany({
    where: {
      status: 'pending',
      nextRetryAt: { lte: now, not: null },
      attempt: { lt: MAX_ATTEMPTS },
    },
    orderBy: { nextRetryAt: 'asc' },
    take: limit,
    select: {
      id: true,
      webhookId: true,
      event: true,
      payload: true,
      attempt: true,
      createdAt: true,
      webhook: {
        select: {
          id: true,
          url: true,
          secret: true,
          enabled: true,
          tenantId: true,
        },
      },
    },
  })

  for (const d of candidates) {
    if (!d.webhook) {
      // FK cascade would normally clean this up; defensive.
      continue
    }
    if (!d.webhook.enabled) {
      summary.skippedDisabled += 1
      // Push out by 1 hour so a re-enabled webhook eventually retries.
      if (!dryRun) {
        await prisma.webhookDelivery
          .updateMany({
            where: { id: d.id, status: 'pending' },
            data: { nextRetryAt: new Date(Date.now() + 3_600_000) },
          })
          .catch(() => {})
      }
      continue
    }

    if (!dryRun) {
      const locked = await claimDelivery(d.id)
      if (!locked) {
        summary.lockLost += 1
        continue
      }
    }

    summary.processed += 1

    const body = buildDeliveryBody(
      d.webhook.tenantId,
      d.event,
      d.payload,
      d.createdAt,
    )

    if (dryRun) {
      // Simulate next action without an HTTP call.
      const nextAttempt = d.attempt + 1
      const dead = shouldDeadLetter(nextAttempt)
      if (dead) summary.deadLettered += 1
      else summary.failed += 1
      continue
    }

    const outcome = await attemptDelivery(
      { id: d.webhook.id, url: d.webhook.url, secret: d.webhook.secret },
      d.event,
      body,
    )

    const { status } = await recordOutcome(
      { id: d.id, webhookId: d.webhookId, attempt: d.attempt },
      outcome,
    )

    if (status === 'success') summary.succeeded += 1
    else if (status === 'dead_letter') summary.deadLettered += 1
    else summary.failed += 1
  }

  return summary
}

/**
 * Admin-triggered: move a delivery back into the retry queue with
 * `nextRetryAt = now` so the next worker run picks it up. Works on
 * pending / failed / dead_letter rows alike.
 */
export async function manuallyRetryDelivery(
  deliveryId: string,
  actorUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!deliveryId) return { ok: false, error: 'ID pengiriman tidak valid.' }
  const d = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      webhookId: true,
      status: true,
      attempt: true,
      webhook: { select: { tenantId: true } },
    },
  })
  if (!d || !d.webhook) {
    return { ok: false, error: 'Pengiriman tidak ditemukan.' }
  }

  // Reset for the worker. If already at MAX_ATTEMPTS we step it back by one
  // so the worker's "< MAX_ATTEMPTS" guard does not immediately exclude it.
  const safeAttempt = Math.min(d.attempt, MAX_ATTEMPTS - 1)

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: 'pending',
      nextRetryAt: new Date(),
      attempt: safeAttempt,
      error: null,
    },
  })

  await prisma.auditLog
    .create({
      data: {
        tenantId: d.webhook.tenantId,
        userId: actorUserId,
        action: 'UPDATE',
        resource: 'webhook.delivery.manual_retry',
        resourceId: deliveryId,
        metadata: {
          webhookId: d.webhookId,
          previousStatus: d.status,
        },
      },
    })
    .catch(() => {})

  return { ok: true }
}

/**
 * Admin-triggered: force a delivery to `dead_letter` regardless of attempt
 * count. Used to silence a delivery the operator does not want retried.
 */
export async function manuallyDeadLetter(
  deliveryId: string,
  actorUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!deliveryId) return { ok: false, error: 'ID pengiriman tidak valid.' }
  const d = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      webhookId: true,
      status: true,
      webhook: { select: { tenantId: true } },
    },
  })
  if (!d || !d.webhook) {
    return { ok: false, error: 'Pengiriman tidak ditemukan.' }
  }
  if (d.status === 'dead_letter') {
    return { ok: true }
  }

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: 'dead_letter',
      nextRetryAt: null,
    },
  })

  await prisma.auditLog
    .create({
      data: {
        tenantId: d.webhook.tenantId,
        userId: actorUserId,
        action: 'UPDATE',
        resource: 'webhook.delivery.dead_lettered',
        resourceId: deliveryId,
        metadata: {
          webhookId: d.webhookId,
          previousStatus: d.status,
          source: 'manual',
        },
      },
    })
    .catch(() => {})

  return { ok: true }
}

/**
 * Bulk re-queue a list of dead-letter deliveries. Used by the dead-letter
 * inbox "Coba kirim ulang semua" button.
 */
export async function bulkRetryDeadLetter(
  tenantId: string,
  deliveryIds: string[],
  actorUserId: string,
): Promise<{ ok: boolean; retried: number; error?: string }> {
  if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
    return { ok: true, retried: 0 }
  }
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      id: { in: deliveryIds },
      webhook: { tenantId },
    },
    select: { id: true, attempt: true, webhookId: true },
  })
  if (rows.length === 0) return { ok: true, retried: 0 }

  const now = new Date()
  await prisma.$transaction(
    rows.map((r) =>
      prisma.webhookDelivery.update({
        where: { id: r.id },
        data: {
          status: 'pending',
          nextRetryAt: now,
          attempt: Math.min(r.attempt, MAX_ATTEMPTS - 1),
          error: null,
        },
      }),
    ),
  )

  await prisma.auditLog
    .create({
      data: {
        tenantId,
        userId: actorUserId,
        action: 'UPDATE',
        resource: 'webhook.delivery.bulk_retried',
        resourceId: null,
        metadata: {
          deliveryIds: rows.map((r) => r.id),
          count: rows.length,
        } as Prisma.InputJsonValue,
      },
    })
    .catch(() => {})

  return { ok: true, retried: rows.length }
}
