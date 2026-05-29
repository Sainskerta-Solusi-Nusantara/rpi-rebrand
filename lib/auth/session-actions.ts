'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'

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
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  if (!deviceId) return { ok: false, error: 'ID perangkat tidak valid.' }

  try {
    const device = await prisma.userDevice.findUnique({
      where: { id: deviceId },
      select: { id: true, userId: true, userAgent: true, revokedAt: true },
    })
    if (!device) return { ok: false, error: 'Perangkat tidak ditemukan.' }
    if (device.userId !== session.user.id) {
      return { ok: false, error: 'Perangkat bukan milik Anda.' }
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
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * Sign out every device by bumping User.sessionsValidFrom. All existing JWTs
 * with iat < this timestamp are rejected by the jwt callback on next call.
 * Also revokes all UserDevice rows so the device list reflects the action.
 * Requires the current password (refused for OAuth-only users).
 */
export async function signOutAllDevices(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  const password = String(formData.get('password') ?? '')
  if (!password) {
    return { ok: false, error: 'Masukkan password Anda.', field: 'password' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user) return { ok: false, error: 'Akun tidak ditemukan.' }
    if (!user.passwordHash) {
      return {
        ok: false,
        error:
          'Akun OAuth tidak dapat menggunakan aksi ini. Atur password terlebih dulu.',
        field: 'password',
      }
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return { ok: false, error: 'Password salah.', field: 'password' }

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
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
