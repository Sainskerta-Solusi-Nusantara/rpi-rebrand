/**
 * GET /api/health
 *
 * Liveness + lightweight readiness probe. Returns `{ ok, uptime, db, time }`.
 * Used by external monitors (Vercel/Cloudflare/etc.) and the admin dashboard
 * health card. No auth required by design.
 */

import { prisma } from '@/lib/db'
import { apiSuccess } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const start = Date.now()
  let dbOk = true
  let dbLatencyMs = 0
  try {
    const t = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - t
  } catch {
    dbOk = false
  }

  return apiSuccess({
    ok: dbOk,
    uptimeSeconds: Math.round(process.uptime()),
    db: { ok: dbOk, latencyMs: dbLatencyMs },
    time: new Date().toISOString(),
    durationMs: Date.now() - start,
  })
}
