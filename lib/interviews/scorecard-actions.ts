'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  RECOMMENDATION_VALUES,
  isRecommendationValue,
} from '@/lib/interviews/scorecard-defaults'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ScorecardActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const ratingSchema = z.object({
  criterion: z
    .string()
    .trim()
    .min(1)
    .max(100),
  score: z
    .number()
    .int()
    .min(1)
    .max(5),
})

const payloadSchema = z.object({
  interviewId: z.string().min(1),
  ratings: z
    .array(ratingSchema)
    .min(1)
    .max(15),
  notes: z
    .string()
    .max(5000)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  recommendation: z.enum(RECOMMENDATION_VALUES),
})

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

function avgScore(ratings: ReadonlyArray<{ score: number }>): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r.score, 0)
  return sum / ratings.length
}

type InterviewContext =
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

/**
 * Load the interview, derive the tenant from its application, and check
 * recruiter permission. We use `job.update` because the rbac module does
 * not (yet) declare a dedicated `application.update` permission.
 */
async function loadInterviewContext(
  interviewId: string,
): Promise<InterviewContext> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvScoring.interviewScorecard.mustLogin }

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
  if (!interview) return { error: t.srvScoring.interviewScorecard.interviewNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      interview.application.tenantId,
      'job.update',
    )
  ) {
    return { error: t.srvScoring.interviewScorecard.noPermission }
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

function revalidateForApplication(tenantSlug: string, applicationId: string, interviewId: string) {
  // List + detail pages render the aggregate, the scorecard edit page
  // renders the form, the standalone wawancara page (if used) needs
  // the latest state too.
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}`)
  revalidatePath(
    `/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}/wawancara/${interviewId}/scorecard`,
  )
  revalidatePath(`/dashboard/tenants/${tenantSlug}/wawancara/${interviewId}`)
}

/**
 * Accept either a structured payload (server actions invoked directly from
 * React Server Components) or a FormData blob (progressive-enhancement form
 * submit). Returns a normalised, validated shape — caller still has to
 * authorize.
 */
async function readPayload(input: unknown): Promise<
  | { ok: true; data: z.infer<typeof payloadSchema> }
  | { ok: false; error: string; field?: string }
> {
  const t = await getServerT()
  let raw: unknown = input
  if (typeof FormData !== 'undefined' && input instanceof FormData) {
    const ratingsJson = input.get('ratingsJson')
    let ratings: unknown = []
    if (typeof ratingsJson === 'string') {
      try {
        ratings = JSON.parse(ratingsJson)
      } catch {
        return {
          ok: false,
          error: t.srvScoring.interviewScorecard.ratingsInvalid,
          field: 'ratings',
        }
      }
    }
    raw = {
      interviewId: input.get('interviewId'),
      ratings,
      notes: input.get('notes') ?? undefined,
      recommendation: input.get('recommendation'),
    }
  }

  const parsed = await localizedParse(payloadSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvScoring.interviewScorecard.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  return { ok: true, data: parsed.data }
}

/**
 * Upsert the caller's scorecard for a given interview.
 *
 * Because `InterviewScorecard.interviewId` is `@unique`, there is at most
 * one scorecard per interview. We upsert on that constraint so the same
 * recruiter can iterate on the form without colliding. Multi-panelist
 * coverage is modelled via multiple interviews on the same application,
 * not multiple scorecards on one interview.
 */
export async function submitScorecard(
  input: FormData | {
    interviewId: string
    ratings: Array<{ criterion: string; score: number }>
    notes?: string
    recommendation: string
  },
): Promise<ScorecardActionResult<{ scorecardId: string; created: boolean }>> {
  const t = await getServerT()
  const parsed = await readPayload(input)
  if (!parsed.ok) return parsed

  const { interviewId, ratings, notes, recommendation } = parsed.data
  if (!isRecommendationValue(recommendation)) {
    return { ok: false, error: t.srvScoring.interviewScorecard.recommendationInvalid, field: 'recommendation' }
  }

  const ctx = await loadInterviewContext(interviewId)
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
        resource: 'interview.scorecard.submitted',
        resourceId: scorecard.id,
        metadata: {
          interviewId,
          applicationId: ctx.interview.applicationId,
          recommendation,
          ratingsCount: ratings.length,
          avgScore: Number(avgScore(ratings).toFixed(2)),
          notesLength: notes ? notes.length : 0,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(
      ctx.interview.application.tenant.slug,
      ctx.interview.applicationId,
      ctx.interview.id,
    )

    return {
      ok: true,
      data: { scorecardId: scorecard.id, created: isCreate },
    }
  } catch (err) {
    console.error('[submitScorecard] failed', err)
    return { ok: false, error: t.srvScoring.interviewScorecard.submitFailed }
  }
}

/**
 * Idempotent delete. We don't error when there is nothing to delete —
 * the recruiter likely just hit the button twice and we should not punish
 * them for it.
 */
export async function deleteScorecard(
  interviewId: string,
): Promise<ScorecardActionResult> {
  const t = await getServerT()
  if (!interviewId) return { ok: false, error: t.srvScoring.interviewScorecard.interviewIdInvalid }

  const ctx = await loadInterviewContext(interviewId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.existingScorecardId === null) {
    return { ok: true }
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
        resource: 'interview.scorecard.deleted',
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
      ctx.interview.id,
    )
    return { ok: true }
  } catch (err) {
    console.error('[deleteScorecard] failed', err)
    return { ok: false, error: t.srvScoring.interviewScorecard.deleteFailed }
  }
}
