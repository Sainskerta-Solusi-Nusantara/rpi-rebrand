import { createHash } from 'node:crypto'
import { prisma } from '@/lib/db'

/**
 * Compute a fingerprint that's stable across normal IP changes (mobile, ISP
 * reassignment) but flips when the user moves to a clearly different device
 * or rough location. We hash the User-Agent + the first two IPv4 octets (or
 * first 32 bits of IPv6). Salt with userId so fingerprints don't leak
 * cross-user.
 */
export function fingerprintDevice(opts: {
  userId: string
  userAgent: string | null
  ip: string | null
}): string {
  const ua = (opts.userAgent ?? 'unknown').trim().slice(0, 256).toLowerCase()
  const ipApprox = approximateIp(opts.ip)
  return createHash('sha256').update(`${opts.userId}|${ua}|${ipApprox}`).digest('hex')
}

export function approximateIp(ip: string | null): string {
  if (!ip) return 'no-ip'
  const trimmed = ip.trim()
  if (!trimmed) return 'no-ip'
  // IPv6 — keep first 4 hex groups
  if (trimmed.includes(':')) {
    return trimmed.split(':').slice(0, 4).join(':') + '::'
  }
  // IPv4 — keep first 2 octets
  const parts = trimmed.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`
  return trimmed
}

export type DeviceRecordResult = {
  device: { id: string; alertSentAt: Date | null }
  isNew: boolean
}

/**
 * Record a login: upsert UserDevice keyed by (userId, fingerprint). Returns
 * whether the device is newly seen so the caller can decide to email an
 * alert. Best-effort — failures swallowed (callers should never let auth
 * break because of telemetry).
 */
export async function recordLoginDevice(opts: {
  userId: string
  userAgent: string | null
  ip: string | null
}): Promise<DeviceRecordResult | null> {
  try {
    const fingerprint = fingerprintDevice({
      userId: opts.userId,
      userAgent: opts.userAgent,
      ip: opts.ip,
    })
    const ua = (opts.userAgent ?? 'unknown').slice(0, 512)
    const ip = opts.ip ?? null
    const existing = await prisma.userDevice.findUnique({
      where: { userId_fingerprint: { userId: opts.userId, fingerprint } },
      select: { id: true, alertSentAt: true },
    })

    if (!existing) {
      const created = await prisma.userDevice.create({
        data: {
          userId: opts.userId,
          fingerprint,
          userAgent: ua,
          ipFirstSeen: ip,
          ipLastSeen: ip,
        },
        select: { id: true, alertSentAt: true },
      })
      return { device: created, isNew: true }
    }

    const updated = await prisma.userDevice.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        ipLastSeen: ip,
        loginCount: { increment: 1 },
      },
      select: { id: true, alertSentAt: true },
    })
    return { device: updated, isNew: false }
  } catch (err) {
    console.error('[recordLoginDevice] failed', err)
    return null
  }
}

export async function markDeviceAlertSent(deviceId: string): Promise<void> {
  try {
    await prisma.userDevice.update({
      where: { id: deviceId },
      data: { alertSentAt: new Date() },
    })
  } catch {
    // swallow
  }
}
