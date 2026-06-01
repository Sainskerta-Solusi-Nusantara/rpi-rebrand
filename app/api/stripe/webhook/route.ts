/**
 * Stripe webhook endpoint.
 *
 * Contract:
 *  - Reads raw request body via `req.text()` (required for HMAC verification).
 *  - Verifies the `Stripe-Signature` header using STRIPE_WEBHOOK_SECRET.
 *  - Idempotently records the event in `StripeWebhookEvent` (eventId is unique
 *    — a duplicate insert returns 200 immediately).
 *  - Dispatches to `handleStripeEvent`; marks `processedAt` on success, or
 *    `error` on failure. Always returns 200 after recording so Stripe stops
 *    retrying on persistent app bugs (we can replay manually from the table).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/billing/stripe'
import { handleStripeEvent } from '@/lib/billing/stripe-webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 },
    )
  }

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  const verification = verifyWebhookSignature(rawBody, sig, secret)
  if (!verification.valid) {
    console.warn('[stripe-webhook] signature verification failed:', verification.reason)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    )
  }

  let event: { id: string; type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!event?.id || !event?.type) {
    return NextResponse.json({ error: 'Malformed event' }, { status: 400 })
  }

  // Idempotent record. If we've seen this event id before, short-circuit.
  let recordId: string | null = null
  try {
    const record = await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, processedAt: true },
    })
    recordId = record.id
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Replay — already recorded. Return 200 so Stripe stops retrying.
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }
    console.error('[stripe-webhook] failed to record event', err)
    // Still return 200 — we don't want infinite retries when DB is the issue.
    return NextResponse.json({ received: true, recorded: false }, { status: 200 })
  }

  try {
    await handleStripeEvent(event)
    if (recordId) {
      await prisma.stripeWebhookEvent.update({
        where: { id: recordId },
        data: { processedAt: new Date() },
      })
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err)
    if (recordId) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      await prisma.stripeWebhookEvent
        .update({
          where: { id: recordId },
          data: { error: msg.slice(0, 1000) },
        })
        .catch(() => {})
    }
    // Always 200: we've recorded the event; replay via admin if needed.
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
