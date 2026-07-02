/**
 * Thin wrapper around the optional `web-push` npm package.
 *
 * Setup (one-time):
 *   1. Install the library:
 *        npm install web-push
 *        npm install -D @types/web-push
 *   2. Generate VAPID keys:
 *        npx web-push generate-vapid-keys
 *   3. Set env vars in .env.local (see lib/env.ts):
 *        NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # public key, URL-safe base64
 *        VAPID_PRIVATE_KEY=...              # private key, URL-safe base64
 *        VAPID_SUBJECT=mailto:ops@pekerja.sainskerta.net
 *
 * If `web-push` is NOT installed yet, this module falls back to a no-op stub
 * that logs once per send. This keeps the dashboard and server actions usable
 * during development before the dependency has been added.
 */

import { env } from '@/lib/env'

export type WebPushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type WebPushPayload = {
  title: string
  body?: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

export type SendResult =
  | { ok: true }
  | { ok: false; statusCode?: number; error: string; gone?: boolean }

let warned = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: any = null
let resolved = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadWebPush(): any | null {
  if (resolved) return cached
  resolved = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('web-push')
    cached = mod?.default ?? mod
    return cached
  } catch {
    cached = null
    return null
  }
}

function configure(): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lib: any | null
  configured: boolean
} {
  const lib = loadWebPush()
  if (!lib) return { lib: null, configured: false }
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = env.VAPID_PRIVATE_KEY
  const subject = env.VAPID_SUBJECT
  if (!pub || !priv || !subject) return { lib, configured: false }
  try {
    lib.setVapidDetails(subject, pub, priv)
    return { lib, configured: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[web-push] failed to set VAPID details', err)
    return { lib, configured: false }
  }
}

/**
 * Send a single Web Push notification. Never throws; returns a result object.
 *
 * When the subscription endpoint is no longer valid (404/410), `gone` is true
 * so the caller can prune the row from the database.
 */
export async function sendWebPush(args: {
  subscription: WebPushSubscription
  payload: WebPushPayload
}): Promise<SendResult> {
  const { subscription, payload } = args
  const { lib, configured } = configure()

  if (!lib) {
    if (!warned) {
      warned = true
      // eslint-disable-next-line no-console
      console.warn(
        '[web-push] library not installed — install with `npm install web-push` to enable real delivery.',
      )
    }
    return { ok: false, error: 'web-push library not installed' }
  }
  if (!configured) {
    if (!warned) {
      warned = true
      // eslint-disable-next-line no-console
      console.warn(
        '[web-push] VAPID env vars missing (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT) — skipping send.',
      )
    }
    return { ok: false, error: 'VAPID env vars not configured' }
  }

  try {
    await lib.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    )
    return { ok: true }
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any
    const statusCode: number | undefined =
      typeof e?.statusCode === 'number' ? e.statusCode : undefined
    const message: string =
      typeof e?.body === 'string'
        ? e.body
        : typeof e?.message === 'string'
          ? e.message
          : 'unknown web-push error'
    const gone = statusCode === 404 || statusCode === 410
    return { ok: false, statusCode, error: message, gone }
  }
}

/** Returns true when `web-push` is installed AND VAPID env vars are configured. */
export function isWebPushReady(): boolean {
  const { configured } = configure()
  return configured
}
