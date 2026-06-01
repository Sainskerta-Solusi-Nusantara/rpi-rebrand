/**
 * Thin Stripe REST client — no SDK.
 *
 * Why no SDK?
 *  - Hard constraint: no new npm dependencies.
 *  - Stripe's HTTP surface is small and stable. We use `fetch()` directly
 *    against api.stripe.com with `application/x-www-form-urlencoded` bodies
 *    (Stripe's required content type for POST).
 *
 * Webhook signature verification implements the standard Stripe v1 scheme:
 *  - parse `Stripe-Signature` header for `t=<ts>` and `v1=<sig>` pairs
 *  - HMAC-SHA256 over `${t}.${rawBody}` keyed by `STRIPE_WEBHOOK_SECRET`
 *  - timing-safe comparison
 *
 * IMPORTANT: All helpers here are pure transport. Persisting Subscription /
 * Tenant updates happens in `lib/billing/stripe-webhook.ts`.
 */
import crypto from 'crypto'
import { prisma } from '@/lib/db'

const STRIPE_API_BASE = 'https://api.stripe.com/v1'
const STRIPE_API_VERSION = '2024-06-20'

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it in your environment to enable live billing.',
    )
  }
  return key
}

/** Encode a (possibly nested) plain object into Stripe's bracketed form-urlencoded format. */
function encodeForm(
  data: Record<string, unknown>,
  prefix?: string,
): string[] {
  const out: string[] = []
  for (const [rawKey, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    const key = prefix ? `${prefix}[${rawKey}]` : rawKey
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (item && typeof item === 'object') {
          out.push(...encodeForm(item as Record<string, unknown>, `${key}[${idx}]`))
        } else {
          out.push(`${encodeURIComponent(`${key}[${idx}]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else if (typeof value === 'object') {
      out.push(...encodeForm(value as Record<string, unknown>, key))
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }
  return out
}

async function stripeRequest<T = unknown>(
  path: string,
  init: { method: 'GET' | 'POST' | 'DELETE'; body?: Record<string, unknown> },
): Promise<T> {
  const key = getSecretKey()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Stripe-Version': STRIPE_API_VERSION,
  }
  let body: string | undefined
  if (init.body && init.method !== 'GET') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    body = encodeForm(init.body).join('&')
  }
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: init.method,
    headers,
    body,
    cache: 'no-store',
  })
  const text = await res.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      // leave parsed=null
    }
  }
  if (!res.ok) {
    const errObj = (parsed as { error?: { message?: string; code?: string } } | null)?.error
    throw new Error(
      `Stripe API ${res.status}: ${errObj?.message ?? text.slice(0, 200) ?? 'unknown error'}`,
    )
  }
  return (parsed ?? {}) as T
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type StripeCustomer = {
  id: string
  email?: string | null
  name?: string | null
}

/**
 * Find Tenant.stripeCustomerId if present; otherwise create a Stripe customer
 * keyed by tenant metadata and persist its id. Idempotent on the tenant id.
 */
export async function createOrGetCustomer(params: {
  tenantId: string
  email?: string | null
  name?: string | null
}): Promise<StripeCustomer> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: { id: true, name: true, stripeCustomerId: true },
  })
  if (!tenant) throw new Error('Tenant not found.')
  if (tenant.stripeCustomerId) {
    return { id: tenant.stripeCustomerId, email: params.email ?? null, name: params.name ?? tenant.name }
  }
  const customer = await stripeRequest<StripeCustomer>('/customers', {
    method: 'POST',
    body: {
      email: params.email ?? undefined,
      name: params.name ?? tenant.name,
      'metadata[tenantId]': tenant.id,
    },
  })
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { stripeCustomerId: customer.id },
  })
  return customer
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export type StripeCheckoutSession = {
  id: string
  url: string | null
  customer?: string | null
  subscription?: string | null
}

export async function createCheckoutSession(params: {
  tenantId: string
  priceId: string
  customerId: string
  successUrl: string
  cancelUrl: string
}): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>('/checkout/sessions', {
    method: 'POST',
    body: {
      mode: 'subscription',
      customer: params.customerId,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      'line_items[0][price]': params.priceId,
      'line_items[0][quantity]': 1,
      'metadata[tenantId]': params.tenantId,
      'subscription_data[metadata][tenantId]': params.tenantId,
      allow_promotion_codes: 'true',
    },
  })
}

// ---------------------------------------------------------------------------
// Billing Portal
// ---------------------------------------------------------------------------

export type StripePortalSession = { id: string; url: string }

export async function createBillingPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<StripePortalSession> {
  return stripeRequest<StripePortalSession>('/billing_portal/sessions', {
    method: 'POST',
    body: {
      customer: params.customerId,
      return_url: params.returnUrl,
    },
  })
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export type StripeSubscriptionShape = {
  id: string
  status: string
  customer: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end?: boolean
  items?: {
    data?: Array<{
      price?: { id?: string; product?: string; lookup_key?: string | null }
    }>
  }
  metadata?: Record<string, string>
}

export async function getSubscription(stripeSubscriptionId: string): Promise<StripeSubscriptionShape> {
  return stripeRequest<StripeSubscriptionShape>(
    `/subscriptions/${encodeURIComponent(stripeSubscriptionId)}`,
    { method: 'GET' },
  )
}

// ---------------------------------------------------------------------------
// Webhook signature verification (Stripe v1 scheme)
// ---------------------------------------------------------------------------

/**
 * Verify a Stripe webhook signature.
 *
 * @param rawBody The raw POST body as a UTF-8 string (DO NOT use the parsed JSON).
 * @param sigHeader The `Stripe-Signature` request header value.
 * @param secret   The `STRIPE_WEBHOOK_SECRET` for this endpoint.
 * @param tolerance Allowed timestamp drift in seconds (default 300 = 5 minutes).
 */
export function verifyWebhookSignature(
  rawBody: string,
  sigHeader: string | null | undefined,
  secret: string,
  tolerance = 300,
): { valid: boolean; reason?: string } {
  if (!sigHeader) return { valid: false, reason: 'missing signature header' }
  if (!secret) return { valid: false, reason: 'missing webhook secret' }

  let timestamp: string | null = null
  const signatures: string[] = []
  for (const part of sigHeader.split(',')) {
    const [k, v] = part.split('=', 2)
    if (!k || !v) continue
    if (k.trim() === 't') timestamp = v.trim()
    else if (k.trim() === 'v1') signatures.push(v.trim())
  }
  if (!timestamp) return { valid: false, reason: 'no timestamp' }
  if (signatures.length === 0) return { valid: false, reason: 'no v1 signature' }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return { valid: false, reason: 'invalid timestamp' }
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - ts) > tolerance) {
    return { valid: false, reason: 'timestamp outside tolerance' }
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')

  const match = signatures.some((s) => {
    let sBuf: Buffer
    try {
      sBuf = Buffer.from(s, 'hex')
    } catch {
      return false
    }
    if (sBuf.length !== expectedBuf.length) return false
    return crypto.timingSafeEqual(sBuf, expectedBuf)
  })

  return match ? { valid: true } : { valid: false, reason: 'no matching signature' }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Plan tier → priceId. Returns undefined for FREE. Falls back to placeholders. */
export function priceIdForPlan(plan: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'): string | undefined {
  switch (plan) {
    case 'PRO':
      return process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder'
    case 'BUSINESS':
      return process.env.STRIPE_PRICE_BUSINESS || 'price_business_placeholder'
    case 'ENTERPRISE':
      return process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder'
    default:
      return undefined
  }
}

/** Map a Stripe priceId / lookup_key back to a PlanTier. */
export function planFromStripePrice(priceId?: string | null, lookupKey?: string | null): 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE' {
  if (priceId) {
    if (priceId === process.env.STRIPE_PRICE_PRO) return 'PRO'
    if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'BUSINESS'
    if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'ENTERPRISE'
  }
  if (lookupKey) {
    const lk = lookupKey.toLowerCase()
    if (lk.includes('enterprise')) return 'ENTERPRISE'
    if (lk.includes('business')) return 'BUSINESS'
    if (lk.includes('pro')) return 'PRO'
  }
  return 'FREE'
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
