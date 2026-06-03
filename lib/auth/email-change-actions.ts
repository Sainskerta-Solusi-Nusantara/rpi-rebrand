'use server'

import { createHash, randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { auth } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import {
  emailChangeNoticeEmail,
  emailChangeVerifyEmail,
  sendEmail,
} from '@/lib/mailer'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function appUrl() {
  return env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || env.NEXTAUTH_URL?.replace(/\/$/, '') || ''
}

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

const requestSchema = z.object({
  newEmail: z.string().email('Email baru tidak valid').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Masukkan password'),
})

/**
 * Request an email change. Sends a verification link to the NEW email and a
 * security notice to the OLD email. Requires current password (refused for
 * OAuth-only accounts since we cannot prove identity safely).
 */
export async function requestEmailChange(formData: FormData): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvAuth2.emailChange.mustLogin }
  }

  const parsed = requestSchema.safeParse({
    newEmail: formData.get('newEmail'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { newEmail, password } = parsed.data

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, passwordHash: true },
    })
    if (!user) return { ok: false, error: t.srvAuth2.emailChange.accountNotFound }
    if (!user.passwordHash) {
      return {
        ok: false,
        error: t.srvAuth2.emailChange.oauthNoEmailChange,
        field: 'password',
      }
    }
    if (user.email.toLowerCase() === newEmail) {
      return { ok: false, error: t.srvAuth2.emailChange.emailSameAsCurrent, field: 'newEmail' }
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return { ok: false, error: t.srvAuth2.emailChange.passwordWrong, field: 'password' }

    const taken = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    })
    if (taken) {
      return { ok: false, error: t.srvAuth2.emailChange.emailTaken, field: 'newEmail' }
    }

    const meta = getRequestMeta()

    // Invalidate any prior active requests so only the latest token works.
    await prisma.emailChangeRequest.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })

    const token = randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS)

    await prisma.emailChangeRequest.create({
      data: {
        userId: user.id,
        oldEmail: user.email,
        newEmail,
        tokenHash,
        expiresAt,
        requestIp: meta.ip,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        resource: 'email_change.requested',
        resourceId: user.id,
        metadata: { from: user.email, to: newEmail },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    const link = `${appUrl()}/verify-email-change/${token}`
    const [verifyTpl, noticeTpl] = [
      emailChangeVerifyEmail({
        name: user.name,
        oldEmail: user.email,
        newEmail,
        link,
      }),
      emailChangeNoticeEmail({
        name: user.name,
        oldEmail: user.email,
        newEmail,
        requestIp: meta.ip,
      }),
    ]
    const [verifySend, noticeSend] = await Promise.all([
      sendEmail({ to: newEmail, ...verifyTpl }),
      sendEmail({ to: user.email, ...noticeTpl }),
    ])
    if (!verifySend.ok) console.error('[requestEmailChange] verify mail failed', verifySend.error)
    if (!noticeSend.ok) console.error('[requestEmailChange] notice mail failed', noticeSend.error)

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[requestEmailChange] failed', err)
    return { ok: false, error: t.srvAuth2.emailChange.genericError }
  }
}

/**
 * Validate an email-change token (does NOT consume). Used by the confirm page.
 */
export async function checkEmailChangeToken(token: string): Promise<
  | { valid: true; newEmail: string; oldEmail: string; expiresAt: Date }
  | { valid: false; reason: 'invalid' | 'expired' | 'used' | 'taken' }
> {
  if (!token || token.length < 32) return { valid: false, reason: 'invalid' }
  try {
    const record = await prisma.emailChangeRequest.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        newEmail: true,
        oldEmail: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { email: true } },
      },
    })
    if (!record) return { valid: false, reason: 'invalid' }
    if (record.usedAt) return { valid: false, reason: 'used' }
    if (record.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'expired' }
    if (record.user?.email && record.user.email !== record.oldEmail) {
      // Email already moved since the request was issued — treat as invalid.
      return { valid: false, reason: 'invalid' }
    }
    // Re-check that newEmail is still free.
    const taken = await prisma.user.findUnique({
      where: { email: record.newEmail },
      select: { id: true },
    })
    if (taken) return { valid: false, reason: 'taken' }
    return {
      valid: true,
      newEmail: record.newEmail,
      oldEmail: record.oldEmail,
      expiresAt: record.expiresAt,
    }
  } catch (err) {
    console.error('[checkEmailChangeToken] failed', err)
    return { valid: false, reason: 'invalid' }
  }
}

/**
 * Consume an email-change token. The user must be signed in as the request's
 * owner (or signed out — in which case we still allow consumption since the
 * token itself proves intent and the old email holder already received the
 * notice). On success, User.email is updated, emailVerified is set to now,
 * and the token is marked used.
 */
export async function confirmEmailChange(token: string): Promise<ActionResult> {
  const t = await getServerT()
  if (!token || token.length < 32) return { ok: false, error: t.srvAuth2.emailChange.tokenInvalid }
  try {
    const record = await prisma.emailChangeRequest.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        userId: true,
        oldEmail: true,
        newEmail: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { email: true } },
      },
    })
    if (!record) return { ok: false, error: t.srvAuth2.emailChange.linkInvalid }
    if (record.usedAt) return { ok: false, error: t.srvAuth2.emailChange.linkUsed }
    if (record.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: t.srvAuth2.emailChange.linkExpired }
    }
    if (record.user?.email && record.user.email !== record.oldEmail) {
      return { ok: false, error: t.srvAuth2.emailChange.linkStale }
    }
    const taken = await prisma.user.findUnique({
      where: { email: record.newEmail },
      select: { id: true },
    })
    if (taken) return { ok: false, error: t.srvAuth2.emailChange.emailTaken }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { email: record.newEmail, emailVerified: new Date() },
      }),
      prisma.emailChangeRequest.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: record.userId,
          action: AuditAction.UPDATE,
          resource: 'email_change.completed',
          resourceId: record.userId,
          metadata: { from: record.oldEmail, to: record.newEmail },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[confirmEmailChange] failed', err)
    return { ok: false, error: t.srvAuth2.emailChange.genericError }
  }
}
