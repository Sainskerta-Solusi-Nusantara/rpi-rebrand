'use server'

import QRCode from 'qrcode'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import {
  buildTotpUri,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from '@/lib/auth/totp'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvAuth3 } from '@/lib/i18n/dictionaries/srv-auth3'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

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

async function loadActor() {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return null
  return { id: session.user.id, email: session.user.email }
}

/**
 * Begin TOTP setup: generates a fresh secret, stores it on the user row
 * (totpSecret set, totpEnabledAt still null = "pending"), and returns the
 * QR-code data URL + provisioning URI for the authenticator app.
 *
 * If TOTP is already fully enabled (totpEnabledAt != null), refuses.
 */
export async function beginTotpSetup(): Promise<
  ActionResult<{ qrDataUrl: string; secret: string; uri: string }>
> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const actor = await loadActor()
  if (!actor) return { ok: false, error: t.srvAuth3.totp.mustLogin }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { totpEnabledAt: true, email: true },
    })
    if (!user) return { ok: false, error: t.srvAuth3.totp.accountNotFound }
    if (user.totpEnabledAt) {
      return { ok: false, error: t.srvAuth3.totp.alreadyEnabled }
    }

    const secret = generateTotpSecret()
    const uri = buildTotpUri(secret, user.email)
    const qrDataUrl = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 1 })

    await prisma.user.update({
      where: { id: actor.id },
      data: { totpSecret: secret, totpEnabledAt: null },
    })

    return { ok: true, data: { qrDataUrl, secret, uri } }
  } catch (err) {
    console.error('[beginTotpSetup] failed', err)
    return { ok: false, error: t.srvAuth3.totp.saveFailed }
  }
}

/**
 * Confirm TOTP setup: verifies a code against the pending secret, marks
 * 2FA enabled, generates and persists hashed recovery codes, and returns
 * the plain recovery codes (one-time view).
 */
export async function confirmTotpSetup(input: { code: string }): Promise<
  ActionResult<{ recoveryCodes: string[] }>
> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const actor = await loadActor()
  if (!actor) return { ok: false, error: t.srvAuth3.totp.mustLogin }
  const code = (input?.code ?? '').toString().trim()
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: t.srvAuth3.totp.invalidCode6, field: 'code' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { totpSecret: true, totpEnabledAt: true },
    })
    if (!user) return { ok: false, error: t.srvAuth3.totp.accountNotFound }
    if (user.totpEnabledAt) {
      return { ok: false, error: t.srvAuth3.totp.alreadyActive }
    }
    if (!user.totpSecret) {
      return { ok: false, error: t.srvAuth3.totp.setupNotStarted }
    }
    if (!verifyTotpCode(user.totpSecret, code)) {
      return { ok: false, error: t.srvAuth3.totp.codeExpired, field: 'code' }
    }

    const plainCodes = generateRecoveryCodes()
    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.user.update({
        where: { id: actor.id },
        data: { totpEnabledAt: new Date() },
      }),
      // Wipe any prior codes (should be none, but be defensive).
      prisma.totpRecoveryCode.deleteMany({ where: { userId: actor.id } }),
      prisma.totpRecoveryCode.createMany({
        data: plainCodes.map((c) => ({ userId: actor.id, codeHash: hashRecoveryCode(c) })),
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: AuditAction.UPDATE,
          resource: 'totp.enabled',
          resourceId: actor.id,
          metadata: { recoveryCount: plainCodes.length },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true, data: { recoveryCodes: plainCodes } }
  } catch (err) {
    console.error('[confirmTotpSetup] failed', err)
    return { ok: false, error: t.srvAuth3.totp.saveFailed }
  }
}

/**
 * Disable TOTP. Requires the current password and a valid TOTP code (or
 * recovery code) to prove possession. Wipes secret and all recovery codes.
 */
export async function disableTotp(formData: FormData): Promise<ActionResult> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const actor = await loadActor()
  if (!actor) return { ok: false, error: t.srvAuth3.totp.mustLogin }

  const password = String(formData.get('password') ?? '')
  const code = String(formData.get('code') ?? '').trim()

  if (!password) return { ok: false, error: t.srvAuth3.totp.passwordRequired, field: 'password' }
  if (!code) return { ok: false, error: t.srvAuth3.totp.codeRequired, field: 'code' }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { passwordHash: true, totpSecret: true, totpEnabledAt: true },
    })
    if (!user) return { ok: false, error: t.srvAuth3.totp.accountNotFound }
    if (!user.totpEnabledAt || !user.totpSecret) {
      return { ok: false, error: t.srvAuth3.totp.notActive }
    }
    if (!user.passwordHash) {
      return { ok: false, error: t.srvAuth3.totp.noPassword, field: 'password' }
    }

    const okPw = await verifyPassword(password, user.passwordHash)
    if (!okPw) return { ok: false, error: t.srvAuth3.totp.wrongPassword, field: 'password' }

    let codeOk = false
    if (/^\d{6}$/.test(code)) {
      codeOk = verifyTotpCode(user.totpSecret, code)
    }
    if (!codeOk) {
      // Try as recovery code
      const recovery = await prisma.totpRecoveryCode.findUnique({
        where: { codeHash: hashRecoveryCode(code) },
        select: { id: true, userId: true, usedAt: true },
      })
      if (recovery && recovery.userId === actor.id && !recovery.usedAt) {
        codeOk = true
      }
    }
    if (!codeOk) return { ok: false, error: t.srvAuth3.totp.invalidTotpCode, field: 'code' }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.user.update({
        where: { id: actor.id },
        data: { totpSecret: null, totpEnabledAt: null },
      }),
      prisma.totpRecoveryCode.deleteMany({ where: { userId: actor.id } }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: AuditAction.UPDATE,
          resource: 'totp.disabled',
          resourceId: actor.id,
          metadata: {},
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[disableTotp] failed', err)
    return { ok: false, error: t.srvAuth3.totp.saveFailed }
  }
}

/**
 * Regenerate recovery codes. Requires a valid current TOTP code. Wipes old.
 */
export async function regenerateRecoveryCodes(input: { code: string }): Promise<
  ActionResult<{ recoveryCodes: string[] }>
> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const actor = await loadActor()
  if (!actor) return { ok: false, error: t.srvAuth3.totp.mustLogin }
  const code = (input?.code ?? '').toString().trim()
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: t.srvAuth3.totp.invalidCode6Authenticator, field: 'code' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { totpSecret: true, totpEnabledAt: true },
    })
    if (!user?.totpEnabledAt || !user.totpSecret) {
      return { ok: false, error: t.srvAuth3.totp.notActive }
    }
    if (!verifyTotpCode(user.totpSecret, code)) {
      return { ok: false, error: t.srvAuth3.totp.invalidCodeShort, field: 'code' }
    }

    const plainCodes = generateRecoveryCodes()
    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.totpRecoveryCode.deleteMany({ where: { userId: actor.id } }),
      prisma.totpRecoveryCode.createMany({
        data: plainCodes.map((c) => ({ userId: actor.id, codeHash: hashRecoveryCode(c) })),
      }),
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: AuditAction.UPDATE,
          resource: 'totp.recovery_regenerated',
          resourceId: actor.id,
          metadata: { recoveryCount: plainCodes.length },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true, data: { recoveryCodes: plainCodes } }
  } catch (err) {
    console.error('[regenerateRecoveryCodes] failed', err)
    return { ok: false, error: t.srvAuth3.totp.saveFailed }
  }
}
