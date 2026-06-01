/**
 * Lightweight, in-process probes for the public status page.
 *
 * These are intentionally fast and side-effect free:
 *  - DB probe runs `SELECT 1` (no table I/O).
 *  - Storage probe writes & deletes a tiny marker file under `public/uploads`.
 *  - Email probe only inspects env vars (does NOT call Resend's API — we don't
 *    want the status page to incur cost or rate-limit risk).
 *  - Auth probe verifies env config + DB reachability.
 *
 * Every probe is wrapped in a 3-second timeout. Errors never propagate — the
 * page must always render even when half the platform is on fire.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '@/lib/db'

export type HealthStatus = 'operational' | 'degraded' | 'down'

export interface HealthResult {
  status: HealthStatus
  latencyMs: number
  error?: string
}

const TIMEOUT_MS = 3000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; latencyMs: number; value: T } | { ok: false; latencyMs: number; error: string }> {
  const started = Date.now()
  try {
    const value = await withTimeout(fn(), TIMEOUT_MS)
    return { ok: true, latencyMs: Date.now() - started, value }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/** Roundtrip a trivial query to verify the DB pool is healthy. */
export async function checkDatabase(): Promise<HealthResult> {
  const r = await timed(async () => {
    await prisma.$queryRaw`SELECT 1`
  })
  if (!r.ok) {
    return { status: 'down', latencyMs: r.latencyMs, error: r.error }
  }
  // Slow query (>1.5s) → degraded so operators notice.
  if (r.latencyMs > 1500) {
    return {
      status: 'degraded',
      latencyMs: r.latencyMs,
      error: 'Latensi basis data tinggi.',
    }
  }
  return { status: 'operational', latencyMs: r.latencyMs }
}

/** Write & delete a marker file to confirm uploads directory is writable. */
export async function checkStorage(): Promise<HealthResult> {
  const r = await timed(async () => {
    const baseDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(baseDir, { recursive: true })
    const marker = path.join(baseDir, `.healthcheck-${process.pid}`)
    await fs.writeFile(marker, 'ok')
    await fs.unlink(marker).catch(() => {
      /* harmless */
    })
  })
  if (!r.ok) {
    return { status: 'down', latencyMs: r.latencyMs, error: r.error }
  }
  return { status: 'operational', latencyMs: r.latencyMs }
}

/**
 * Only verifies that a mailer is configured. Calling Resend's API on every
 * status page hit would be expensive and unnecessary.
 */
export async function checkEmail(): Promise<HealthResult> {
  const started = Date.now()
  const hasResend = Boolean(process.env.RESEND_API_KEY)
  const hasFrom = Boolean(process.env.EMAIL_FROM)
  if (!hasResend) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - started,
      error: 'RESEND_API_KEY belum dikonfigurasi.',
    }
  }
  if (!hasFrom) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - started,
      error: 'EMAIL_FROM belum dikonfigurasi.',
    }
  }
  return { status: 'operational', latencyMs: Date.now() - started }
}

/** Auth depends on NEXTAUTH_SECRET + a reachable user table. */
export async function checkAuth(): Promise<HealthResult> {
  const started = Date.now()
  if (!process.env.NEXTAUTH_SECRET) {
    return {
      status: 'down',
      latencyMs: Date.now() - started,
      error: 'NEXTAUTH_SECRET tidak ditemukan.',
    }
  }
  const r = await timed(async () => {
    await prisma.$queryRaw`SELECT 1`
  })
  if (!r.ok) {
    return { status: 'down', latencyMs: r.latencyMs, error: r.error }
  }
  return { status: 'operational', latencyMs: r.latencyMs }
}

/** Web tier is the process serving this request — by definition reachable. */
async function checkWeb(): Promise<HealthResult> {
  return { status: 'operational', latencyMs: 0 }
}

/**
 * API tier shares the Next.js runtime with the web tier; we just verify the
 * env URL is present so misconfigured deployments surface as degraded.
 */
async function checkApi(): Promise<HealthResult> {
  const started = Date.now()
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - started,
      error: 'NEXT_PUBLIC_APP_URL belum dikonfigurasi.',
    }
  }
  return { status: 'operational', latencyMs: Date.now() - started }
}

/** Webhooks are configured per-tenant; the platform side is operational if DB is up. */
async function checkWebhooks(): Promise<HealthResult> {
  const r = await timed(async () => {
    await prisma.$queryRaw`SELECT 1`
  })
  if (!r.ok) {
    return { status: 'degraded', latencyMs: r.latencyMs, error: r.error }
  }
  return { status: 'operational', latencyMs: r.latencyMs }
}

/** Cron tier is healthy if CRON_SECRET is set (used to authenticate triggers). */
async function checkCron(): Promise<HealthResult> {
  const started = Date.now()
  if (!process.env.CRON_SECRET) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - started,
      error: 'CRON_SECRET belum dikonfigurasi.',
    }
  }
  return { status: 'operational', latencyMs: Date.now() - started }
}

/**
 * Run every component probe in parallel. Each probe has its own internal
 * timeout/catch so a single broken check never tanks the page.
 */
export async function runAllHealthChecks(): Promise<Record<string, HealthResult>> {
  const safe = async (fn: () => Promise<HealthResult>): Promise<HealthResult> => {
    try {
      return await fn()
    } catch (err) {
      return {
        status: 'down',
        latencyMs: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  const [web, api, database, email, storage, auth, webhooks, cron] = await Promise.all([
    safe(checkWeb),
    safe(checkApi),
    safe(checkDatabase),
    safe(checkEmail),
    safe(checkStorage),
    safe(checkAuth),
    safe(checkWebhooks),
    safe(checkCron),
  ])

  return { web, api, database, email, storage, auth, webhooks, cron }
}
