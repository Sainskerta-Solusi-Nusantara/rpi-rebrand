'use server'

import { getServerT } from '@/lib/i18n/server-dictionary'

/**
 * Candidate-facing withdraw + reopen actions.
 *
 * Sibling to `lib/applications/actions.ts` which historically owned the simple
 * `withdrawApplication(applicationId)` flow. This module is the v2 take that
 * accepts a `reason`, records `withdrawnAt` / `withdrawnById`, fans out a
 * best-effort recruiter notification, and supports a 7-day reopen window.
 *
 * Both entry points are server actions; they return a discriminated
 * `ActionResult` so the calling client modal can render the error inline.
 */

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  ApplicationStatus,
  AuditAction,
  NotificationType,
  Prisma,
} from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

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

const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
]

const withdrawSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran tidak valid.'),
  reason: z
    .string()
    .max(2000, 'Alasan maksimal 2000 karakter.')
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
})

type WithdrawInput = {
  applicationId: string
  reason?: string | null
}

function readInput(input: WithdrawInput | FormData): WithdrawInput {
  if (input instanceof FormData) {
    return {
      applicationId: String(input.get('applicationId') ?? ''),
      reason: (input.get('reason') as string | null) ?? null,
    }
  }
  return input
}

/**
 * Withdraw an application owned by the signed-in candidate.
 *
 * Idempotency: rejects when the application is already WITHDRAWN or in a
 * terminal state (HIRED/REJECTED). Concurrent calls are guarded by checking
 * `status` again inside the update transaction.
 */
export async function withdrawApplication(
  input: WithdrawInput | FormData,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvApplications2.withdraw.mustLogin }
  }
  const userId = session.user.id

  const parsed = withdrawSchema.safeParse(readInput(input))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.withdraw.invalidInput,
      field: issue?.path[0]?.toString(),
    }
  }
  const { applicationId, reason } = parsed.data

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        jobId: true,
        status: true,
        withdrawnAt: true,
        job: { select: { slug: true, title: true } },
      },
    })
    if (!application) {
      return { ok: false, error: t.srvApplications2.withdraw.applicationNotFound }
    }
    if (application.userId !== userId) {
      return { ok: false, error: t.srvApplications2.withdraw.notOwner }
    }
    if (application.status === ApplicationStatus.WITHDRAWN || application.withdrawnAt) {
      return { ok: false, error: t.srvApplications2.withdraw.alreadyWithdrawn }
    }
    if (TERMINAL_STATUSES.includes(application.status)) {
      return {
        ok: false,
        error: t.srvApplications2.withdraw.terminalStatus,
      }
    }

    const meta = getRequestMeta()
    const now = new Date()

    // Idempotent update: re-check current status in WHERE so a racing second
    // call (e.g. double-click within 60 seconds) updates zero rows instead of
    // overwriting a fresh state. Prisma throws P2025 when no row matches.
    await prisma.$transaction(async (tx) => {
      const updated = await tx.application.updateMany({
        where: {
          id: application.id,
          status: { notIn: [ApplicationStatus.WITHDRAWN, ...TERMINAL_STATUSES] },
          withdrawnAt: null,
        },
        data: {
          status: ApplicationStatus.WITHDRAWN,
          withdrawnAt: now,
          withdrawReason: reason,
          withdrawnById: userId,
        },
      })
      if (updated.count !== 1) {
        throw new Error('IDEMPOTENT_NOOP')
      }
      await tx.auditLog.create({
        data: {
          tenantId: application.tenantId,
          userId,
          action: AuditAction.UPDATE,
          resource: 'application.withdrawn',
          resourceId: application.id,
          metadata: {
            applicationId: application.id,
            jobId: application.jobId,
            reason: reason ?? null,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    })

    // Best-effort recruiter notification fan-out. Mirrors the candidate→recruiter
    // pattern from `lib/messaging/actions.ts`. Failures are swallowed because
    // the withdraw itself already committed; the candidate's UI must succeed.
    try {
      const recruiters = await prisma.userTenant.findMany({
        where: {
          tenantId: application.tenantId,
          role: { in: ['OWNER', 'ADMIN', 'RECRUITER'] },
          status: 'active',
        },
        select: { userId: true },
      })
      if (recruiters.length > 0) {
        const candidate = await prisma.user
          .findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          })
          .catch(() => null)
        const candidateLabel =
          candidate?.name ?? candidate?.email ?? t.srvApplications2.withdraw.notifCandidateFallback
        const jobTitle = application.job?.title ?? t.srvApplications2.withdraw.notifJobFallback
        await prisma.notification.createMany({
          data: recruiters.map((r) => ({
            userId: r.userId,
            type: NotificationType.APPLICATION_UPDATE,
            title: t.srvApplications2.withdraw.notifTitle,
            body: `${candidateLabel} ${t.srvApplications2.withdraw.notifBodyVerb} ${jobTitle}.`,
            link: `/dashboard/tenants`,
          })),
          skipDuplicates: true,
        })
      }
    } catch (err) {
      console.error('[withdrawApplication] notify failed', err)
    }

    revalidatePath('/dashboard/lamaran')
    revalidatePath(`/dashboard/lamaran/${application.id}`)
    if (application.job?.slug) {
      revalidatePath(`/jobs/${application.job.slug}`)
    }
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'IDEMPOTENT_NOOP') {
      return { ok: false, error: t.srvApplications2.withdraw.alreadyWithdrawn }
    }
    console.error('[withdrawApplication] failed', err)
    return { ok: false, error: t.srvApplications2.withdraw.withdrawFailed }
  }
}

/**
 * Reopen a previously-withdrawn application within the 7-day grace window.
 *
 * Only the original candidate can reopen. After 7 days the reopen window
 * closes and we surface a Bahasa Indonesia error so the candidate knows
 * they need to re-apply rather than reopen.
 */
export async function reopenApplication(
  applicationId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvApplications2.withdraw.mustLogin }
  }
  const userId = session.user.id

  if (!applicationId || typeof applicationId !== 'string') {
    return { ok: false, error: t.srvApplications2.withdraw.invalidId }
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        jobId: true,
        status: true,
        withdrawnAt: true,
        job: { select: { slug: true } },
      },
    })
    if (!application) {
      return { ok: false, error: t.srvApplications2.withdraw.applicationNotFound }
    }
    if (application.userId !== userId) {
      return { ok: false, error: t.srvApplications2.withdraw.notOwnerReopen }
    }
    if (application.status !== ApplicationStatus.WITHDRAWN) {
      return { ok: false, error: t.srvApplications2.withdraw.notWithdrawn }
    }
    if (!application.withdrawnAt) {
      // Defensive: shouldn't happen given the status check, but guard anyway.
      return { ok: false, error: t.srvApplications2.withdraw.noWithdrawHistory }
    }
    const elapsed = Date.now() - application.withdrawnAt.getTime()
    if (elapsed > REOPEN_WINDOW_MS) {
      return {
        ok: false,
        error: t.srvApplications2.withdraw.reopenWindowExpired,
      }
    }

    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.APPLIED,
          withdrawnAt: null,
          withdrawReason: null,
          withdrawnById: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: application.tenantId,
          userId,
          action: AuditAction.UPDATE,
          resource: 'application.reopened',
          resourceId: application.id,
          metadata: {
            applicationId: application.id,
            jobId: application.jobId,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/lamaran')
    revalidatePath(`/dashboard/lamaran/${application.id}`)
    if (application.job?.slug) {
      revalidatePath(`/jobs/${application.job.slug}`)
    }
    return { ok: true }
  } catch (err) {
    console.error('[reopenApplication] failed', err)
    return { ok: false, error: t.srvApplications2.withdraw.reopenFailed }
  }
}
