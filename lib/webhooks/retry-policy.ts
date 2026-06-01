/**
 * Retry policy for outbound webhook deliveries.
 *
 * Schedule: 5 total attempts. After the initial attempt fails, the worker
 * waits per `RETRY_DELAYS_MS[attempt - 1]` before the next try.
 *
 *   attempt=1 (initial fail) → wait 1m  → attempt=2
 *   attempt=2 (fail)         → wait 5m  → attempt=3
 *   attempt=3 (fail)         → wait 30m → attempt=4
 *   attempt=4 (fail)         → wait 2h  → attempt=5 (last)
 *   attempt=5 (fail)         → dead-letter
 *
 * Permanent failures (4xx that signal the consumer will never accept the
 * payload — auth, schema, gone) skip the retry queue and go straight to
 * `dead_letter` regardless of attempt count.
 */

export const MAX_ATTEMPTS = 5

/**
 * Backoff delays in milliseconds, indexed by `attempt - 1` of the *just-failed*
 * attempt. Length is MAX_ATTEMPTS - 1 (no delay after the final attempt).
 *   1 minute, 5 minutes, 30 minutes, 2 hours.
 */
export const RETRY_DELAYS_MS: ReadonlyArray<number> = [
  60_000,
  300_000,
  1_800_000,
  7_200_000,
]

/**
 * HTTP status codes from the receiver that indicate the request will never
 * succeed: do not retry, jump straight to dead-letter.
 *
 *   400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found,
 *   410 Gone, 422 Unprocessable Entity.
 */
export const PERMANENT_FAILURE_STATUS_CODES: ReadonlySet<number> = new Set([
  400, 401, 403, 404, 410, 422,
])

/**
 * Compute the next retry timestamp after a failed attempt.
 *
 * @param attempt - The attempt number that just *failed* (1-based).
 * @returns A future Date when the next retry is due, or null if the retry
 *   budget has been exhausted (caller should dead-letter).
 */
export function computeNextRetry(attempt: number): Date | null {
  if (!Number.isFinite(attempt) || attempt < 1) return null
  if (attempt >= MAX_ATTEMPTS) return null
  const delay = RETRY_DELAYS_MS[attempt - 1]
  if (delay == null) return null
  return new Date(Date.now() + delay)
}

/**
 * Decide whether a failed delivery should bypass the retry queue and be
 * marked `dead_letter` immediately.
 *
 * @param attempt - Attempt number that just failed (1-based).
 * @param statusCode - HTTP status from the receiver, if any.
 */
export function shouldDeadLetter(
  attempt: number,
  statusCode?: number | null,
): boolean {
  if (attempt >= MAX_ATTEMPTS) return true
  if (statusCode != null && PERMANENT_FAILURE_STATUS_CODES.has(statusCode)) {
    return true
  }
  return false
}

/**
 * Classify a thrown error as retryable (transient) or terminal (permanent).
 *
 * Retryable: network / DNS / timeout / connection-reset errors.
 * Terminal: malformed URL, invalid argument, programmer errors.
 *
 * Used by the dispatcher to decide whether a thrown (not HTTP-status) error
 * should enter the retry queue or jump to dead-letter.
 */
export function isRetryableError(error: Error): boolean {
  const msg = `${error.name}: ${error.message}`.toLowerCase()

  // Non-retryable: a fetch() URL/argument problem cannot self-heal.
  if (
    msg.includes('invalid url') ||
    msg.includes('invalid argument') ||
    msg.includes('typeerror') && msg.includes('url')
  ) {
    return false
  }

  // Common transient signals — all retryable.
  const retryableMarkers = [
    'timeout',
    'timed out',
    'abort',
    'econnreset',
    'econnrefused',
    'enotfound',
    'eai_again',
    'ehostunreach',
    'enetunreach',
    'epipe',
    'network',
    'fetch failed',
    'socket hang up',
  ]
  if (retryableMarkers.some((m) => msg.includes(m))) return true

  // Unknown errors → default to retryable so that a transient blip does not
  // immediately dead-letter a delivery. The MAX_ATTEMPTS cap eventually
  // bounds the retries anyway.
  return true
}
