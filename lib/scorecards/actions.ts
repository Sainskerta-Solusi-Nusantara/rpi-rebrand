'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const RECOMMENDATIONS = [
  'strong_hire',
  'hire',
  'no_hire',
  'strong_no_hire',
] as const

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

const ratingSchema = z.object({
  criterion: z
    .string()
    .trim()
    .min(1, 'Nama kriteria wajib diisi')
    .max(100, 'Nama kriteria maksimal 100 karakter'),
  score: z
    .number({
      invalid_type_error: 'Skor harus berupa angka',
      required_error: 'Skor wajib diisi',
    })
    .int('Skor harus bilangan bulat')
    .min(1, 'Skor minimal 1')
    .max(5, 'Skor maksimal 5'),
})

const upsertSchema = z.object({
  interviewId: z.string().min(1, 'ID wawancara wajib diisi'),
  ratings: z
    .array(ratingSchema)
    .min(1, 'Minimal satu kriteria penilaian')
    .max(10, 'Maksimal 10 kriteria penilaian'),
  notes: z
    .string()
    .max(5000, 'Catatan maksimal 5000 karakter')
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  recommendation: z.enum(RECOMMENDATIONS, {
    errorMap: () => ({ message: 'Rekomendasi tidak valid' }),
  }),
})

type LoadInterviewCtx =
  | { error: string }
  | {
      actorId: string
      interview: {
        id: string
        applicationId: string
        application: {
          id: string
          tenantId: string
          tenant: { slug: string }
        }
      }
      existingScorecardId: string | null
    }

async function loadTenantForInterview(
  interviewId: string,
): Promise<LoadInterviewCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvScoring.scorecards.mustLogin }

  const interview = await prisma.interviewSchedule
    .findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        applicationId: true,
        application: {
          select: {
            id: true,
            tenantId: true,
            tenant: { select: { slug: true } },
          },
        },
        scorecard: { select: { id: true } },
      },
    })
    .catch(() => null)
  if (!interview) return { error: t.srvScoring.scorecards.interviewNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      interview.application.tenantId,
      'job.update',
    )
  ) {
    return { error: t.srvScoring.scorecards.noPermission }
  }
  return {
    actorId,
    interview: {
      id: interview.id,
      applicationId: interview.applicationId,
      application: interview.application,
    },
    existingScorecardId: interview.scorecard?.id ?? null,
  }
}

function revalidateForApplication(tenantSlug: string, applicationId: string) {
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}`)
}

export async function upsertScorecard(input: {
  interviewId: string
  ratings: Array<{ criterion: string; score: number }>
  notes?: string
  recommendation: string
}): Promise<ActionResult<{ scorecardId: string; created: boolean }>> {
  const t = await getServerT()
  const parsed = upsertSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvScoring.scorecards.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { interviewId, ratings, notes, recommendation } = parsed.data

  const ctx = await loadTenantForInterview(interviewId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const isCreate = ctx.existingScorecardId === null

    const scorecard = isCreate
      ? await prisma.interviewScorecard.create({
          data: {
            interviewId,
            authorId: ctx.actorId,
            ratings: ratings as unknown as Prisma.InputJsonValue,
            notes: notes ?? null,
            recommendation,
          },
          select: { id: true },
        })
      : await prisma.interviewScorecard.update({
          where: { interviewId },
          data: {
            ratings: ratings as unknown as Prisma.InputJsonValue,
            notes: notes ?? null,
            recommendation,
          },
          select: { id: true },
        })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.interview.application.tenantId,
        userId: ctx.actorId,
        action: isCreate ? AuditAction.CREATE : AuditAction.UPDATE,
        resource: 'application.interview.scorecard',
        resourceId: scorecard.id,
        metadata: {
          interviewId,
          applicationId: ctx.interview.applicationId,
          recommendation,
          ratingsCount: ratings.length,
          notesLength: notes ? notes.length : 0,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(
      ctx.interview.application.tenant.slug,
      ctx.interview.applicationId,
    )

    return {
      ok: true,
      data: { scorecardId: scorecard.id, created: isCreate },
    }
  } catch (err) {
    console.error('[upsertScorecard] failed', err)
    return { ok: false, error: t.srvScoring.scorecards.upsertFailed }
  }
}

export async function deleteScorecard(
  interviewId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  if (!interviewId) return { ok: false, error: t.srvScoring.scorecards.interviewIdInvalid }

  const ctx = await loadTenantForInterview(interviewId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.existingScorecardId === null) {
    return { ok: true } // idempotent — nothing to delete
  }

  try {
    await prisma.interviewScorecard.delete({
      where: { interviewId },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.interview.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.DELETE,
        resource: 'application.interview.scorecard',
        resourceId: ctx.existingScorecardId,
        metadata: {
          interviewId,
          applicationId: ctx.interview.applicationId,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(
      ctx.interview.application.tenant.slug,
      ctx.interview.applicationId,
    )
    return { ok: true }
  } catch (err) {
    console.error('[deleteScorecard] failed', err)
    return { ok: false, error: t.srvScoring.scorecards.deleteFailed }
  }
}
