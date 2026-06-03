'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvAuth3 } from '@/lib/i18n/dictionaries/srv-auth3'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

/**
 * Soft-revoke a single device. The device row is marked revokedAt; any
 * future request from a matching fingerprint will be invalidated by the
 * jwt callback. Existing JWTs from other devices remain valid until expiry
 * (JWT sessions are stateless — see signOutAllDevices for the global kill).
 */
export async function revokeDevice(deviceId: string): Promise<ActionResult> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth3.session.mustLogin }
  if (!deviceId) return { ok: false, error: t.srvAuth3.session.invalidDeviceId }

  try {
    const device = await prisma.userDevice.findUnique({
      where: { id: deviceId },
      select: { id: true, userId: true, userAgent: true, revokedAt: true },
    })
    if (!device) return { ok: false, error: t.srvAuth3.session.deviceNotFound }
    if (device.userId !== session.user.id) {
      return { ok: false, error: t.srvAuth3.session.deviceNotOwned }
    }
    if (device.revokedAt) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.userDevice.update({
        where: { id: device.id },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.REVOKE,
          resource: 'device',
          resourceId: device.id,
          metadata: { userAgent: device.userAgent.slice(0, 200) },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[revokeDevice] failed', err)
    return { ok: false, error: t.srvAuth3.session.saveFailed }
  }
}

/**
 * Sign out every device by bumping User.sessionsValidFrom. All existing JWTs
 * with iat < this timestamp are rejected by the jwt callback on next call.
 * Also revokes all UserDevice rows so the device list reflects the action.
 * Requires the current password (refused for OAuth-only users).
 */
export async function signOutAllDevices(formData: FormData): Promise<ActionResult> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth3.session.mustLogin }

  const password = String(formData.get('password') ?? '')
  if (!password) {
    return { ok: false, error: t.srvAuth3.session.passwordRequired, field: 'password' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user) return { ok: false, error: t.srvAuth3.session.accountNotFound }
    if (!user.passwordHash) {
      return {
        ok: false,
        error: t.srvAuth3.session.oauthNoPassword,
        field: 'password',
      }
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return { ok: false, error: t.srvAuth3.session.wrongPassword, field: 'password' }

    const meta = getRequestMeta()
    const now = new Date()
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { sessionsValidFrom: now },
      }),
      prisma.userDevice.updateMany({
        where: { userId: session.user.id, revokedAt: null },
        data: { revokedAt: now },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.REVOKE,
          resource: 'session.all',
          resourceId: session.user.id,
          metadata: { reason: 'sign_out_everywhere' },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[signOutAllDevices] failed', err)
    return { ok: false, error: t.srvAuth3.session.saveFailed }
  }
}
