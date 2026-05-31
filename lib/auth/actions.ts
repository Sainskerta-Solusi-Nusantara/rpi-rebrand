'use server'

import { z } from 'zod'
import { createHash, randomBytes } from 'node:crypto'
import { headers, cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { hashPassword } from '@/lib/auth/password'
import { emailVerificationEmail, passwordResetEmail, sendEmail } from '@/lib/mailer'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const VERIFY_RESEND_COOLDOWN_MS = 60 * 1000 // 1 minute between resends

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function appUrl() {
  return env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || env.NEXTAUTH_URL?.replace(/\/$/, '') || ''
}

function getRequestIp(): string | null {
  try {
    const h = headers()
    return (
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      h.get('x-real-ip') ??
      null
    )
  } catch {
    return null
  }
}

async function issueVerificationEmail(opts: {
  userId: string
  email: string
  name: string | null
}): Promise<void> {
  await prisma.emailVerificationToken.updateMany({
    where: { userId: opts.userId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  })

  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)
  const requestIp = getRequestIp()

  await prisma.emailVerificationToken.create({
    data: {
      userId: opts.userId,
      email: opts.email,
      tokenHash,
      expiresAt,
      requestIp,
    },
  })

  const link = `${appUrl()}/verify/${token}`
  const { subject, text, html } = emailVerificationEmail({ name: opts.name, link })
  const result = await sendEmail({ to: opts.email, subject, text, html })
  if (!result.ok) {
    console.error('[issueVerificationEmail] mailer failed', result.error)
  }
}

// Password policy: min 8 chars, at least one letter and one number.
const passwordPolicy = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Password harus berisi huruf')
  .regex(/[0-9]/, 'Password harus berisi angka')

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
  email: z.string().email('Email tidak valid').transform((v) => v.toLowerCase().trim()),
  password: passwordPolicy,
  acceptTerms: z
    .union([z.literal('on'), z.literal('true'), z.boolean()])
    .transform((v) => v === true || v === 'on' || v === 'true')
    .refine((v) => v === true, 'Anda harus menyetujui syarat & ketentuan'),
})

/**
 * Register a new end-user (job seeker) with USER global role.
 * Returns a discriminated result; caller decides redirect.
 */
export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    acceptTerms: formData.get('acceptTerms'),
  }
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Data tidak valid', field: issue?.path[0] as string | undefined }
  }
  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return { ok: false, error: 'Email sudah terdaftar', field: 'email' }
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        globalRole: 'USER',
        status: 'ACTIVE',
      },
      select: { id: true, email: true, name: true },
    })

    try {
      await issueVerificationEmail({ userId: user.id, email: user.email, name: user.name })
    } catch (err) {
      // Don't fail registration on mailer issues; user can resend later.
      console.error('[registerUser] verification email failed', err)
    }

    // -----------------------------------------------------------------
    // BEGIN: Referral apply on sign-up — best-effort. Must NOT block
    // registration success. If anything fails here we swallow the error.
    // -----------------------------------------------------------------
    try {
      const refCookie = cookies().get('rpi_ref')?.value
      if (refCookie) {
        const { _applyReferralForUser } = await import('@/lib/referrals/actions')
        await _applyReferralForUser({ userId: user.id, code: refCookie })
        try {
          cookies().delete('rpi_ref')
        } catch {
          // Best-effort cookie clear.
        }
      }
    } catch (err) {
      console.error('[registerUser] referral apply failed', err)
    }
    // -----------------------------------------------------------------
    // END: Referral apply on sign-up
    // -----------------------------------------------------------------

    return { ok: true }
  } catch (err) {
    console.error('[registerUser] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

const forgotSchema = z.object({
  email: z.string().email('Email tidak valid').transform((v) => v.toLowerCase().trim()),
})

/**
 * Request a password reset email. Always returns ok:true on success to avoid
 * user enumeration. If a matching active user with a password is found, a
 * single-use token (1h TTL) is stored hashed and a reset link is emailed.
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Email tidak valid', field: 'email' }
  }
  const { email } = parsed.data

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true, status: true },
    })

    // Only issue a token for active users who have a password (i.e. not
    // OAuth-only). Silently no-op otherwise — do not leak existence.
    if (user && user.status === 'ACTIVE' && user.passwordHash) {
      // Invalidate any prior unused, non-expired tokens for this user.
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      })

      const token = randomBytes(32).toString('hex')
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
      const requestIp = getRequestIp()

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt, requestIp },
      })

      const link = `${appUrl()}/reset/${token}`
      const { subject, text, html } = passwordResetEmail({ name: user.name, link })
      const result = await sendEmail({ to: email, subject, text, html })
      if (!result.ok) {
        console.error('[requestPasswordReset] mailer failed', result.error)
      }
    } else {
      console.info('[requestPasswordReset] no eligible user for', email)
    }
  } catch (err) {
    console.error('[requestPasswordReset] failed', err)
    // Still return ok to prevent timing-based enumeration.
  }

  return { ok: true }
}

const resetSchema = z
  .object({
    token: z.string().min(32, 'Token tidak valid').max(128, 'Token tidak valid'),
    password: passwordPolicy,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Konfirmasi password tidak cocok',
  })

/**
 * Consume a password-reset token and set the new password. Tokens are
 * single-use and expire after 1 hour. Marks token used regardless of whether
 * the password change succeeds (defense in depth).
 */
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = {
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  }
  const parsed = resetSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { token, password } = parsed.data

  try {
    const tokenHash = hashToken(token)
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    })

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return {
        ok: false,
        error: 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.',
      }
    }

    const passwordHash = await hashPassword(password)
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
    ])

    return { ok: true }
  } catch (err) {
    console.error('[resetPassword] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * Validate a reset token for the /reset/[token] page. Returns whether the
 * token is currently usable; does NOT consume it.
 */
export async function checkResetToken(token: string): Promise<
  { valid: true; userName: string | null; expiresAt: Date } | { valid: false; reason: 'invalid' | 'expired' | 'used' }
> {
  if (!token || token.length < 32) return { valid: false, reason: 'invalid' }
  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        usedAt: true,
        expiresAt: true,
        user: { select: { name: true } },
      },
    })
    if (!record) return { valid: false, reason: 'invalid' }
    if (record.usedAt) return { valid: false, reason: 'used' }
    if (record.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'expired' }
    return { valid: true, userName: record.user?.name ?? null, expiresAt: record.expiresAt }
  } catch (err) {
    console.error('[checkResetToken] failed', err)
    return { valid: false, reason: 'invalid' }
  }
}

/**
 * Consume an email verification token. Idempotent for tokens already used by
 * the same user (returns ok). Marks emailVerified = now() on success.
 */
export async function verifyEmail(
  token: string,
): Promise<
  | { ok: true; alreadyVerified?: boolean }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' }
> {
  if (!token || token.length < 32) return { ok: false, reason: 'invalid' }
  try {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        userId: true,
        email: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { email: true, emailVerified: true } },
      },
    })

    if (!record) return { ok: false, reason: 'invalid' }
    if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' }

    // If the email on the token no longer matches the user's email (changed
    // since the token was issued), reject as invalid.
    if (record.user?.email && record.user.email !== record.email) {
      return { ok: false, reason: 'invalid' }
    }

    // Already verified — accept silently (idempotent).
    if (record.user?.emailVerified) {
      if (!record.usedAt) {
        await prisma.emailVerificationToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        })
      }
      return { ok: true, alreadyVerified: true }
    }

    if (record.usedAt) return { ok: false, reason: 'used' }

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
    ])

    return { ok: true }
  } catch (err) {
    console.error('[verifyEmail] failed', err)
    return { ok: false, reason: 'invalid' }
  }
}

/**
 * Validate a verification token for /verify/[token]. Does NOT consume.
 */
export async function checkVerificationToken(token: string): Promise<
  | { valid: true; email: string; alreadyVerified: boolean }
  | { valid: false; reason: 'invalid' | 'expired' | 'used' }
> {
  if (!token || token.length < 32) return { valid: false, reason: 'invalid' }
  try {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        email: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { email: true, emailVerified: true } },
      },
    })
    if (!record) return { valid: false, reason: 'invalid' }
    if (record.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'expired' }
    if (record.user?.email && record.user.email !== record.email) {
      return { valid: false, reason: 'invalid' }
    }
    if (record.user?.emailVerified) {
      return { valid: true, email: record.email, alreadyVerified: true }
    }
    if (record.usedAt) return { valid: false, reason: 'used' }
    return { valid: true, email: record.email, alreadyVerified: false }
  } catch (err) {
    console.error('[checkVerificationToken] failed', err)
    return { valid: false, reason: 'invalid' }
  }
}

/**
 * Resend a verification email to the currently signed-in user (or, when
 * called server-side from registration flow, to the freshly created user).
 * Throttled by VERIFY_RESEND_COOLDOWN_MS. Returns ok:true even on cooldown
 * (so the UI doesn't reveal exact send timestamps).
 */
export async function requestEmailVerification(): Promise<ActionResult> {
  try {
    const { auth } = await import('@/lib/auth/session')
    const session = await auth()
    if (!session?.user?.id) {
      return { ok: false, error: 'Anda perlu masuk untuk meminta verifikasi.' }
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, emailVerified: true },
    })
    if (!user) return { ok: false, error: 'Akun tidak ditemukan.' }
    if (user.emailVerified) return { ok: false, error: 'Email Anda sudah terverifikasi.' }

    // Cooldown — find most recent active token, refuse if within window.
    const latest = await prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    if (latest && Date.now() - latest.createdAt.getTime() < VERIFY_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: 'Tunggu sebentar sebelum meminta tautan baru.',
      }
    }

    await issueVerificationEmail({ userId: user.id, email: user.email, name: user.name })
    return { ok: true }
  } catch (err) {
    console.error('[requestEmailVerification] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
