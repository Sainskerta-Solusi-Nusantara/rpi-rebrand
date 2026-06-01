import { createHmac } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { WebhookEvent } from '@/lib/webhooks/events'
import {
  computeNextRetry,
  isRetryableError,
  shouldDeadLetter,
} from '@/lib/webhooks/retry-policy'

const DELIVERY_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BODY_CHARS = 4096

/**
 * HMAC-sign the JSON-encoded payload with the webhook secret using SHA-256.
 * Returns the hex digest (no `sha256=` prefix — caller adds it on the header).
 */
export function signWebhookPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max)
}

/**
 * Single HTTP delivery attempt. Pure — does not write to the DB. Returns a
 * classification of the outcome that callers map onto WebhookDelivery row
 * fields (initial dispatch vs. retry-worker logic share this primitive).
 */
export type DeliveryOutcome =
  | {
      kind: 'success'
      statusCode: number
      responseBody: string | null
    }
  | {
      kind: 'http_failure'
      statusCode: number
      responseBody: string | null
    }
  | {
      kind: 'transport_failure'
      error: Error
      message: string
    }

export async function attemptDelivery(
  webhook: { id: string; url: string; secret: string },
  event: WebhookEvent | string,
  body: string,
): Promise<DeliveryOutcome> {
  const signature = signWebhookPayload(webhook.secret, body)
  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RPI-Event': event,
        'X-RPI-Signature': `sha256=${signature}`,
        'X-RPI-Webhook-Id': webhook.id,
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    })
    let responseBody: string | null = null
    try {
      const text = await res.text()
      responseBody = truncate(text, MAX_RESPONSE_BODY_CHARS)
    } catch {
      responseBody = null
    }
    if (res.ok) {
      return { kind: 'success', statusCode: res.status, responseBody }
    }
    return { kind: 'http_failure', statusCode: res.status, responseBody }
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err))
    return {
      kind: 'transport_failure',
      error: e,
      message: truncate(`${e.name}: ${e.message}`, MAX_RESPONSE_BODY_CHARS),
    }
  }
}

/**
 * Deliver a single payload to one webhook and record the outcome as a
 * WebhookDelivery row. Never throws. When the attempt fails and is
 * recoverable, the row is left as `pending` with `nextRetryAt` set — the
 * retry worker picks it up later. When exhausted or permanently rejected,
 * the row is set to `dead_letter`.
 */
async function deliverOnce(
  webhook: { id: string; url: string; secret: string },
  event: WebhookEvent,
  payload: unknown,
  body: string,
): Promise<void> {
  const outcome = await attemptDelivery(webhook, event, body)
  const attempt = 1

  let data: Prisma.WebhookDeliveryUncheckedCreateInput = {
    webhookId: webhook.id,
    event,
    payload: payload as Prisma.InputJsonValue,
    status: 'pending',
    statusCode: null,
    responseBody: null,
    attempt,
    error: null,
    nextRetryAt: null,
    deliveredAt: null,
  }

  if (outcome.kind === 'success') {
    data = {
      ...data,
      status: 'success',
      statusCode: outcome.statusCode,
      responseBody: outcome.responseBody,
      deliveredAt: new Date(),
    }
  } else if (outcome.kind === 'http_failure') {
    const dead = shouldDeadLetter(attempt, outcome.statusCode)
    data = {
      ...data,
      status: dead ? 'dead_letter' : 'pending',
      statusCode: outcome.statusCode,
      responseBody: outcome.responseBody,
      error: `HTTP ${outcome.statusCode}`,
      nextRetryAt: dead ? null : computeNextRetry(attempt),
    }
  } else {
    const retryable = isRetryableError(outcome.error)
    const dead = !retryable || shouldDeadLetter(attempt)
    data = {
      ...data,
      status: dead ? 'dead_letter' : 'pending',
      responseBody: outcome.message,
      error: outcome.message,
      nextRetryAt: dead ? null : computeNextRetry(attempt),
    }
  }

  try {
    const created = await prisma.webhookDelivery.create({ data })
    if (data.status === 'dead_letter') {
      await recordDeadLetterAudit(webhook.id, created.id, data.error ?? null)
    }
  } catch (logErr) {
    console.error('[webhooks/dispatch] failed to record delivery', logErr)
  }
}

/**
 * Write an audit row for a delivery transitioning to dead_letter. Best-effort:
 * never throws. Looks up the tenant from the webhook so the audit is
 * tenant-scoped.
 */
async function recordDeadLetterAudit(
  webhookId: string,
  deliveryId: string,
  reason: string | null,
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
        metadata: {
          webhookId,
          reason: reason ?? 'unknown',
        },
      },
    })
  } catch (err) {
    console.error('[webhooks/dispatch] dead_letter audit failed', err)
  }
}

/**
 * Fire-and-forget dispatch of a tenant event to every enabled webhook
 * subscribed to that event. Returns immediately; deliveries continue in the
 * background. Never throws.
 *
 * Caller usage:
 *   void dispatchTenantEvent(tenantId, 'tenant.member.added', { ... })
 */
export function dispatchTenantEvent(
  tenantId: string,
  event: WebhookEvent,
  payload: unknown,
): void {
  void (async () => {
    try {
      const webhooks = await prisma.tenantWebhook.findMany({
        where: {
          tenantId,
          enabled: true,
          events: { has: event },
        },
        select: { id: true, url: true, secret: true },
      })
      if (webhooks.length === 0) return

      const body = JSON.stringify({
        event,
        tenantId,
        sentAt: new Date().toISOString(),
        data: payload,
      })

      await Promise.allSettled(
        webhooks.map((w) => deliverOnce(w, event, payload, body)),
      )
    } catch (err) {
      // Best-effort: never let webhook delivery break the caller.
      console.error('[webhooks/dispatch] dispatchTenantEvent failed', err)
    }
  })()
}

/**
 * Build the canonical JSON body for a stored delivery. Used by the retry
 * worker to reconstruct the exact bytes signed during the initial attempt.
 */
export function buildDeliveryBody(
  tenantId: string,
  event: string,
  payload: unknown,
  sentAt: Date,
): string {
  return JSON.stringify({
    event,
    tenantId,
    sentAt: sentAt.toISOString(),
    data: payload,
  })
}
