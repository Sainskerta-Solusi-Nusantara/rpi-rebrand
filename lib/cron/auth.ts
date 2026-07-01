/**
 * Shared cron-endpoint authentication.
 *
 * Every `/api/cron/*` route must verify the caller knows `CRON_SECRET`.
 * Historically routes did this inline with a plain `!==` comparison and split
 * across two header conventions (`Authorization: Bearer <secret>` vs
 * `x-cron-secret: <secret>`). This module centralizes both concerns:
 *
 *   1. Comparison is timing-safe (`crypto.timingSafeEqual`), matching how the
 *      rest of the codebase compares secrets (Stripe signature, OAuth state,
 *      unsubscribe tokens).
 *   2. BOTH header conventions are accepted, so existing cron schedules keep
 *      working regardless of which header they were configured with, while the
 *      route code stays uniform.
 */

import { timingSafeEqual } from 'node:crypto'

/** Constant-time string equality. Length mismatch short-circuits to false. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/**
 * Extract the presented secret from either supported convention:
 *   - `Authorization: Bearer <secret>`
 *   - `x-cron-secret: <secret>`
 * Returns an empty string when neither header is present.
 */
export function extractCronSecret(req: Request): string {
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length)
  }
  return req.headers.get('x-cron-secret') ?? ''
}

/**
 * Timing-safe check that the request carries the configured cron secret.
 * Returns false when `secret` is empty/unset so an unconfigured deployment
 * never authorizes.
 */
export function isCronAuthorized(req: Request, secret: string | undefined | null): boolean {
  if (!secret) return false
  return safeEqual(extractCronSecret(req), secret)
}
