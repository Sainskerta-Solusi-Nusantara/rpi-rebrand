'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export type ReferralRow = {
  id: string
  userId: string
  code: string
  uses: number
  createdAt: Date
  updatedAt: Date
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // skip 0/O/1/I for readability
const CODE_LENGTH = 8
const MAX_GENERATION_ATTEMPTS = 6

function generateCode(length = CODE_LENGTH): string {
  const buf = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    const byte = buf[i] ?? 0
    out += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  }
  return out
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

/**
 * Look up the caller's Referral row, lazily creating it on first request.
 * Generates an 8-char alphanumeric code (skipping ambiguous glyphs) and
 * retries on the rare unique-collision. Audit logs CREATE on insertion.
 */
export async function getOrCreateMyReferral(): Promise<ActionResult<ReferralRow>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvCalendar.referrals.mustLogin }
  const userId = session.user.id

  try {
    const existing = await prisma.referral.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    if (existing) {
      return { ok: true, data: existing }
    }

    let lastErr: unknown = null
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const code = generateCode()
      try {
        const created = await prisma.referral.create({
          data: { userId, code },
        })

        const meta = getRequestMeta()
        await prisma.auditLog.create({
          data: {
            userId,
            action: AuditAction.CREATE,
            resource: 'referral',
            resourceId: created.id,
            metadata: { code: created.code },
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        }).catch((err) => {
          console.error('[getOrCreateMyReferral] audit failed', err)
        })

        revalidatePath('/dashboard/referral')
        return { ok: true, data: created }
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          lastErr = err
          continue
        }
        throw err
      }
    }

    console.error('[getOrCreateMyReferral] exhausted attempts', lastErr)
    return { ok: false, error: t.srvCalendar.referrals.createCodeFailed }
  } catch (err) {
    console.error('[getOrCreateMyReferral] failed', err)
    return { ok: false, error: t.srvCalendar.referrals.genericError }
  }
}

const applySchema = z.object({
  code: z
    .string({ required_error: 'Kode referral wajib diisi' })
    .trim()
    .min(4, 'Kode referral terlalu pendek')
    .max(32, 'Kode referral terlalu panjang'),
})

/**
 * Apply a referral code on behalf of the signed-in user. Idempotent — if
 * the user already has a referrer or the ReferralUsage row exists, the
 * call is a no-op. Refuses self-referral.
 */
export async function applyReferralCode(input: {
  code: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvCalendar.referrals.mustLogin }
  const userId = session.user.id

  const parsed = applySchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvCalendar.referrals.codeInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const rawCode = parsed.data.code

  return _applyReferralForUser({ userId, code: rawCode })
}

/**
 * Internal helper: apply a referral code on behalf of `userId` without
 * requiring an active session. Used by `registerUser` so the code on the
 * `rpi_ref` cookie can be applied immediately after sign-up.
 */
export async function _applyReferralForUser(input: {
  userId: string
  code: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const userId = input.userId
  const rawCode = (input.code ?? '').trim()
  if (!userId) return { ok: false, error: t.srvCalendar.referrals.userNotFound }
  if (!rawCode) return { ok: false, error: t.srvCalendar.referrals.codeRequired }

  try {
    const referral = await prisma.referral.findFirst({
      where: { code: { equals: rawCode, mode: 'insensitive' } },
      select: { id: true, code: true, userId: true },
    })
    if (!referral) {
      return { ok: false, error: t.srvCalendar.referrals.codeNotFound }
    }
    if (referral.userId === userId) {
      return { ok: false, error: t.srvCalendar.referrals.selfReferral }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referredByCode: true },
    })
    if (!user) return { ok: false, error: t.srvCalendar.referrals.userNotFound }
    if (user.referredByCode) {
      return {
        ok: false,
        error: t.srvCalendar.referrals.alreadyUsedCode,
      }
    }

    // Check for existing usage row (idempotent path) — referredUserId is unique
    const existingUsage = await prisma.referralUsage.findUnique({
      where: { referredUserId: userId },
      select: { id: true },
    })
    if (existingUsage) {
      // Still set referredByCode if missing, but skip the increment.
      await prisma.user.update({
        where: { id: userId },
        data: { referredByCode: referral.code },
      })
      return { ok: true }
    }

    const meta = getRequestMeta()

    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { referredByCode: referral.code },
        }),
        prisma.referralUsage.create({
          data: {
            referralId: referral.id,
            referredUserId: userId,
          },
        }),
        prisma.referral.update({
          where: { id: referral.id },
          data: { uses: { increment: 1 } },
        }),
        prisma.auditLog.create({
          data: {
            userId,
            action: AuditAction.UPDATE,
            resource: 'referral',
            resourceId: referral.id,
            metadata: {
              code: referral.code,
              referrerUserId: referral.userId,
            },
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        }),
      ])
    } catch (err) {
      // Concurrent insert hit the @@unique on referredUserId — treat as success.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return { ok: true }
      }
      throw err
    }

    revalidatePath('/dashboard/referral')
    return { ok: true }
  } catch (err) {
    console.error('[_applyReferralForUser] failed', err)
    return { ok: false, error: t.srvCalendar.referrals.applyFailed }
  }
}

const recordSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
})

/**
 * Mark the user's existing ReferralUsage row with an `appliedJobId` once
 * they submit an application. Best-effort: a no-op when the user was not
 * referred, when there's no matching usage row, or when the usage already
 * has an appliedJobId.
 */
export async function recordReferralApplication(input: {
  applicationId: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvCalendar.referrals.mustLogin }
  const userId = session.user.id

  const parsed = recordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: t.srvCalendar.referrals.inputInvalid }
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: parsed.data.applicationId },
      select: { id: true, userId: true, jobId: true },
    })
    if (!application || application.userId !== userId) {
      return { ok: false, error: t.srvCalendar.referrals.applicationNotFound }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByCode: true },
    })
    if (!user?.referredByCode) {
      return { ok: true } // Not referred — silently no-op.
    }

    const usage = await prisma.referralUsage.findUnique({
      where: { referredUserId: userId },
      select: { id: true, appliedJobId: true, referralId: true },
    })
    if (!usage) {
      return { ok: true } // No usage row recorded — nothing to update.
    }
    if (usage.appliedJobId) {
      return { ok: true } // First-application semantics — keep earliest.
    }

    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.referralUsage.update({
        where: { id: usage.id },
        data: { appliedJobId: application.jobId },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          resource: 'referral',
          resourceId: usage.referralId,
          metadata: {
            event: 'referral.applied',
            usageId: usage.id,
            applicationId: application.id,
            jobId: application.jobId,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/referral')
    return { ok: true }
  } catch (err) {
    console.error('[recordReferralApplication] failed', err)
    return { ok: false, error: t.srvCalendar.referrals.recordFailed }
  }
}
