'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { scheduleInterview } from '@/lib/tenants/interview-actions'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

import { DEFAULT_STAGE_NAMES } from '@/lib/tenants/interview-stage-constants'

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

const stageEntrySchema = z.object({
  interviewId: z.string().min(1),
  stageOrder: z
    .number()
    .int()
    .min(1)
    .max(50),
  stageName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})

const reorderSchema = z.object({
  applicationId: z.string().min(1),
  stages: z.array(stageEntrySchema).min(1),
})

const setStageSchema = z.object({
  interviewId: z.string().min(1),
  stageOrder: z
    .number()
    .int()
    .min(1)
    .max(50),
  stageName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})

const quickAddSchema = z.object({
  applicationId: z.string().min(1),
  stageName: z
    .string()
    .trim()
    .min(1)
    .max(80),
  scheduledAt: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      params: { i18n: 'dateInvalid' },
    }),
  durationMin: z
    .number()
    .int()
    .min(15)
    .max(480),
  type: z.enum(['video', 'onsite', 'phone']),
  meetingUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  location: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  notes: z
    .string()
    .max(5000)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
})

type LoadAppCtx =
  | { error: string }
  | {
      actorId: string
      application: {
        id: string
        tenantId: string
        tenant: { slug: string }
      }
    }

async function loadTenantForApplication(
  applicationId: string,
): Promise<LoadAppCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvInterview.interviewStage.mustLogin }
  const application = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true,
        tenant: { select: { slug: true } },
      },
    })
    .catch(() => null)
  if (!application) return { error: t.srvInterview.interviewStage.applicationNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(globalRole, tenants, application.tenantId, 'job.update')
  ) {
    return { error: t.srvInterview.interviewStage.noPermission }
  }
  return { actorId, application }
}

function revalidateForApplication(tenantSlug: string, applicationId: string) {
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}`)
  revalidatePath(`/dashboard/lamaran`)
  revalidatePath(`/dashboard/lamaran/${applicationId}/wawancara`)
}

/**
 * Bulk reorder/rename stages for an application's interviews. Validates that
 * every supplied interviewId belongs to the target application before any
 * write happens, then performs the updates atomically and emits a single
 * audit event summarising all changes.
 */
export async function reorderStages(input: {
  applicationId: string
  stages: Array<{ interviewId: string; stageOrder: number; stageName?: string }>
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = await localizedParse(reorderSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvInterview.interviewStage.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId, stages } = parsed.data

  const ctx = await loadTenantForApplication(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  // Verify every interviewId belongs to this application.
  const existing = await prisma.interviewSchedule
    .findMany({
      where: { applicationId },
      select: {
        id: true,
        stageOrder: true,
        stageName: true,
      },
    })
    .catch(() => null)
  if (!existing) {
    return { ok: false, error: t.srvInterview.interviewStage.loadFailed }
  }
  const existingById = new Map(existing.map((iv) => [iv.id, iv]))
  for (const stage of stages) {
    if (!existingById.has(stage.interviewId)) {
      return {
        ok: false,
        error: t.srvInterview.interviewStage.interviewNotInApplication,
      }
    }
  }

  const changes: Array<{
    interviewId: string
    from: { stageOrder: number; stageName: string | null }
    to: { stageOrder: number; stageName: string | null }
  }> = []

  for (const stage of stages) {
    const before = existingById.get(stage.interviewId)!
    const nextName = stage.stageName ?? null
    if (
      before.stageOrder !== stage.stageOrder ||
      (before.stageName ?? null) !== nextName
    ) {
      changes.push({
        interviewId: stage.interviewId,
        from: {
          stageOrder: before.stageOrder,
          stageName: before.stageName ?? null,
        },
        to: { stageOrder: stage.stageOrder, stageName: nextName },
      })
    }
  }

  if (changes.length === 0) {
    return { ok: true }
  }

  try {
    await prisma.$transaction(
      stages.map((stage) =>
        prisma.interviewSchedule.update({
          where: { id: stage.interviewId },
          data: {
            stageOrder: stage.stageOrder,
            stageName: stage.stageName ?? null,
          },
        }),
      ),
    )

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application.interview.stage',
        resourceId: applicationId,
        metadata: { changes } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(ctx.application.tenant.slug, applicationId)
    return { ok: true }
  } catch (err) {
    console.error('[reorderStages] failed', err)
    return { ok: false, error: t.srvInterview.interviewStage.genericError }
  }
}

/**
 * Single-interview stage update. Useful for inline arrow up/down buttons in
 * the pipeline editor where we don't want to round-trip the full list.
 */
export async function setInterviewStage(input: {
  interviewId: string
  stageOrder: number
  stageName?: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = await localizedParse(setStageSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvInterview.interviewStage.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { interviewId, stageOrder, stageName } = parsed.data

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvInterview.interviewStage.mustLogin }

  const interview = await prisma.interviewSchedule
    .findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        applicationId: true,
        stageOrder: true,
        stageName: true,
        application: {
          select: {
            id: true,
            tenantId: true,
            tenant: { select: { slug: true } },
          },
        },
      },
    })
    .catch(() => null)
  if (!interview) {
    return { ok: false, error: t.srvInterview.interviewStage.interviewNotFound }
  }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      interview.application.tenantId,
      'job.update',
    )
  ) {
    return { ok: false, error: t.srvInterview.interviewStage.noPermission }
  }

  const nextName = stageName ?? null
  if (
    interview.stageOrder === stageOrder &&
    (interview.stageName ?? null) === nextName
  ) {
    return { ok: true }
  }

  try {
    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: { stageOrder, stageName: nextName },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: interview.application.tenantId,
        userId: actorId,
        action: AuditAction.UPDATE,
        resource: 'application.interview.stage',
        resourceId: interviewId,
        metadata: {
          from: {
            stageOrder: interview.stageOrder,
            stageName: interview.stageName ?? null,
          },
          to: { stageOrder, stageName: nextName },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(
      interview.application.tenant.slug,
      interview.application.id,
    )
    return { ok: true }
  } catch (err) {
    console.error('[setInterviewStage] failed', err)
    return { ok: false, error: t.srvInterview.interviewStage.genericError }
  }
}

/**
 * Convenience wrapper: schedule a new interview at the end of the pipeline.
 * Computes `stageOrder = max(existing) + 1` then delegates to
 * `scheduleInterview` which handles the heavy lifting (audit, candidate
 * notification, status auto-bump).
 */
export async function quickAddStage(input: {
  applicationId: string
  stageName: string
  scheduledAt: string
  durationMin: number
  type: 'video' | 'onsite' | 'phone'
  meetingUrl?: string
  location?: string
  notes?: string
}): Promise<ActionResult<{ interviewId: string }>> {
  const t = await getServerT()
  const parsed = await localizedParse(quickAddSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvInterview.interviewStage.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const {
    applicationId,
    stageName,
    scheduledAt,
    durationMin,
    type,
    meetingUrl,
    location,
    notes,
  } = parsed.data

  // Tenant permission is enforced inside scheduleInterview, but pre-check here
  // so we can report the error without leaving the user wondering.
  const ctx = await loadTenantForApplication(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  // Compute next stage order ourselves to keep semantics explicit even though
  // scheduleInterview also fills in a default.
  const maxRow = await prisma.interviewSchedule
    .findFirst({
      where: { applicationId },
      orderBy: { stageOrder: 'desc' },
      select: { stageOrder: true },
    })
    .catch(() => null)
  const nextStageOrder = (maxRow?.stageOrder ?? 0) + 1

  return scheduleInterview({
    applicationId,
    scheduledAt,
    durationMin,
    type,
    meetingUrl,
    location,
    notes,
    stageOrder: nextStageOrder,
    stageName,
  })
}
