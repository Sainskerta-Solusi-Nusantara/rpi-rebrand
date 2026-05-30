import { createHmac } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { WebhookEvent } from '@/lib/webhooks/events'

const DELIVERY_TIMEOUT_MS = 5_000
const MAX_RESPONSE_BODY_CHARS = 1_000

type DeliveryStatus = 'success' | 'failed'

/**
 * HMAC-sign the JSON-encoded payload with the webhook secret using SHA-256.
 * Returns the hex digest (no `sha256=` prefix — caller adds it on the header).
 */
function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max)
}

/**
 * Deliver a single payload to one webhook. Records the outcome as a
 * WebhookDelivery row. Never throws — failures are swallowed (logged + stored
 * as a `failed` row) so they cannot break the calling business action.
 */
async function deliverOnce(
  webhook: { id: string; url: string; secret: string },
  event: WebhookEvent,
  payload: unknown,
  body: string,
): Promise<void> {
  const signature = signPayload(webhook.secret, body)
  let status: DeliveryStatus = 'failed'
  let statusCode: number | null = null
  let responseBody: string | null = null

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
    statusCode = res.status
    try {
      const text = await res.text()
      responseBody = truncate(text, MAX_RESPONSE_BODY_CHARS)
    } catch {
      responseBody = null
    }
    status = res.ok ? 'success' : 'failed'
  } catch (err) {
    status = 'failed'
    responseBody = truncate(
      err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      MAX_RESPONSE_BODY_CHARS,
    )
  }

  try {
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as Prisma.InputJsonValue,
        status,
        statusCode,
        responseBody,
        attempt: 1,
        deliveredAt: new Date(),
      },
    })
  } catch (logErr) {
    console.error('[webhooks/dispatch] failed to record delivery', logErr)
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
