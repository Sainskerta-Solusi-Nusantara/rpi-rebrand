'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  JOB_QUESTION_TYPES,
  CHOICE_TYPES,
  type ActionResult,
  type JobQuestionType,
} from '@/lib/jobs/question-constants'

// =============================================================================
// Helpers
// =============================================================================

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

async function audit(opts: {
  tenantId: string
  userId: string
  action: AuditAction
  resourceId: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        action: opts.action,
        resource: 'tenant.job.question',
        resourceId: opts.resourceId,
        metadata: (opts.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
  } catch (err) {
    console.error('[question audit] failed', err)
  }
}

/**
 * Normalise an `options` array — trim each entry, drop empties, dedupe. Keeps
 * UI input forgiving while guaranteeing canonical storage.
 */
function sanitizeOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    if (trimmed.length > 200) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
    if (out.length >= 20) break
  }
  return out
}

// =============================================================================
// Validation schemas
// =============================================================================

const labelSchema = z
  .string()
  .trim()
  .min(5, 'Label pertanyaan minimal 5 karakter')
  .max(300, 'Label pertanyaan maksimal 300 karakter')

const typeSchema = z.enum(JOB_QUESTION_TYPES, {
  errorMap: () => ({ message: 'Tipe pertanyaan tidak valid' }),
})

const helpTextSchema = z
  .string()
  .trim()
  .max(500, 'Teks bantuan maksimal 500 karakter')
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optionsSchema = z
  .array(z.string())
  .max(20, 'Maksimal 20 pilihan')
  .optional()

const addSchema = z
  .object({
    jobId: z.string().min(1, 'ID lowongan tidak valid'),
    label: labelSchema,
    type: typeSchema,
    required: z.boolean().optional().default(false),
    options: optionsSchema,
    helpText: helpTextSchema,
  })
  .superRefine((v, ctx) => {
    if (CHOICE_TYPES.includes(v.type)) {
      const cleaned = sanitizeOptions(v.options)
      if (cleaned.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Tipe pilihan membutuhkan minimal 2 opsi (1-200 karakter masing-masing)',
          path: ['options'],
        })
      }
    }
  })

const updateSchema = z
  .object({
    questionId: z.string().min(1, 'ID pertanyaan tidak valid'),
    label: labelSchema.optional(),
    type: typeSchema.optional(),
    required: z.boolean().optional(),
    options: optionsSchema,
    helpText: helpTextSchema,
  })
  .superRefine((v, ctx) => {
    // Only validate option count when caller asks to change to a choice type
    // and supplies new options at the same time. Mid-edit cases (type changed
    // without options) are caught at the action level after we load the row.
    if (v.type && CHOICE_TYPES.includes(v.type) && v.options !== undefined) {
      const cleaned = sanitizeOptions(v.options)
      if (cleaned.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Tipe pilihan membutuhkan minimal 2 opsi (1-200 karakter masing-masing)',
          path: ['options'],
        })
      }
    }
  })

// =============================================================================
// Context loaders
// =============================================================================

type JobCtx =
  | { error: string }
  | {
      job: { id: string; tenantId: string; slug: string; title: string }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadJobForQuestionMgmt(jobId: string): Promise<JobCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Anda harus masuk.' }
  }
  if (!jobId) return { error: 'ID lowongan tidak valid.' }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      tenantId: true,
      slug: true,
      title: true,
      tenant: { select: { id: true, slug: true } },
    },
  })
  if (!job) return { error: 'Lowongan tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, job.tenantId, 'job.update')) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return {
    job: {
      id: job.id,
      tenantId: job.tenantId,
      slug: job.slug,
      title: job.title,
    },
    tenant: job.tenant,
    actorId,
  }
}

type QuestionCtx =
  | { error: string }
  | {
      question: {
        id: string
        jobId: string
        type: string
        order: number
        label: string
        options: unknown
      }
      job: { id: string; tenantId: string; slug: string; title: string }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadQuestionForMgmt(questionId: string): Promise<QuestionCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Anda harus masuk.' }
  }
  if (!questionId) return { error: 'ID pertanyaan tidak valid.' }

  const question = await prisma.jobQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      jobId: true,
      type: true,
      order: true,
      label: true,
      options: true,
      job: {
        select: {
          id: true,
          tenantId: true,
          slug: true,
          title: true,
          tenant: { select: { id: true, slug: true } },
        },
      },
    },
  })
  if (!question) return { error: 'Pertanyaan tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      question.job.tenantId,
      'job.update',
    )
  ) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return {
    question: {
      id: question.id,
      jobId: question.jobId,
      type: question.type,
      order: question.order,
      label: question.label,
      options: question.options,
    },
    job: {
      id: question.job.id,
      tenantId: question.job.tenantId,
      slug: question.job.slug,
      title: question.job.title,
    },
    tenant: question.job.tenant,
    actorId,
  }
}

function revalidateForJob(tenantSlug: string, jobId: string): void {
  revalidatePath(`/dashboard/tenants/${tenantSlug}/jobs/${jobId}/edit`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/jobs`)
}

// =============================================================================
// addJobQuestion
// =============================================================================

export async function addJobQuestion(input: {
  jobId: string
  label: string
  type: JobQuestionType
  required?: boolean
  options?: string[]
  helpText?: string
}): Promise<ActionResult<{ id: string }>> {
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  const ctx = await loadJobForQuestionMgmt(d.jobId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const cleanedOptions = CHOICE_TYPES.includes(d.type)
      ? sanitizeOptions(d.options)
      : null

    const maxOrder = await prisma.jobQuestion.aggregate({
      where: { jobId: ctx.job.id },
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? 0) + 1

    const created = await prisma.jobQuestion.create({
      data: {
        jobId: ctx.job.id,
        label: d.label,
        type: d.type,
        required: d.required ?? false,
        options:
          cleanedOptions !== null
            ? (cleanedOptions as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        helpText: d.helpText ?? null,
        order: nextOrder,
      },
      select: { id: true },
    })

    await audit({
      tenantId: ctx.job.tenantId,
      userId: ctx.actorId,
      action: AuditAction.CREATE,
      resourceId: created.id,
      metadata: {
        jobId: ctx.job.id,
        label: d.label,
        type: d.type,
        required: d.required ?? false,
        optionCount: cleanedOptions?.length ?? 0,
      },
    })

    revalidateForJob(ctx.tenant.slug, ctx.job.id)
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    console.error('[addJobQuestion] failed', err)
    return { ok: false, error: 'Gagal menambah pertanyaan. Coba lagi.' }
  }
}

// =============================================================================
// updateJobQuestion
// =============================================================================

export async function updateJobQuestion(input: {
  questionId: string
  label?: string
  type?: JobQuestionType
  required?: boolean
  options?: string[]
  helpText?: string
}): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  const ctx = await loadQuestionForMgmt(d.questionId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  // Resolve effective type after update for choice-option validation.
  const effectiveType = (d.type ?? (ctx.question.type as JobQuestionType))

  try {
    const data: Prisma.JobQuestionUpdateInput = {}
    if (d.label !== undefined) data.label = d.label
    if (d.type !== undefined) data.type = d.type
    if (d.required !== undefined) data.required = d.required
    if (d.helpText !== undefined) data.helpText = d.helpText ?? null

    if (CHOICE_TYPES.includes(effectiveType)) {
      // Choice types must end up with >= 2 options. Decide source: incoming
      // options (preferred), otherwise fall back to existing — and reject if
      // both are empty.
      let cleaned: string[]
      if (d.options !== undefined) {
        cleaned = sanitizeOptions(d.options)
      } else {
        cleaned = sanitizeOptions(ctx.question.options)
      }
      if (cleaned.length < 2) {
        return {
          ok: false,
          error:
            'Tipe pilihan membutuhkan minimal 2 opsi (1-200 karakter masing-masing).',
          field: 'options',
        }
      }
      data.options = cleaned as unknown as Prisma.InputJsonValue
    } else if (d.type !== undefined) {
      // Type changed to a non-choice type → clear stored options.
      data.options = Prisma.JsonNull
    } else if (d.options !== undefined) {
      // Caller passed options for a non-choice type — ignore silently to
      // keep the API forgiving.
    }

    if (Object.keys(data).length === 0) {
      return { ok: true }
    }

    await prisma.jobQuestion.update({
      where: { id: ctx.question.id },
      data,
    })

    await audit({
      tenantId: ctx.job.tenantId,
      userId: ctx.actorId,
      action: AuditAction.UPDATE,
      resourceId: ctx.question.id,
      metadata: {
        jobId: ctx.job.id,
        changes: {
          label: d.label !== undefined,
          type: d.type !== undefined,
          required: d.required !== undefined,
          options: d.options !== undefined,
          helpText: d.helpText !== undefined,
        },
      },
    })

    revalidateForJob(ctx.tenant.slug, ctx.job.id)
    return { ok: true }
  } catch (err) {
    console.error('[updateJobQuestion] failed', err)
    return { ok: false, error: 'Gagal menyimpan perubahan. Coba lagi.' }
  }
}

// =============================================================================
// reorderJobQuestion — swap with adjacent sibling
// =============================================================================

export async function reorderJobQuestion(input: {
  questionId: string
  direction: 'up' | 'down'
}): Promise<ActionResult> {
  if (!input.questionId) {
    return { ok: false, error: 'ID pertanyaan tidak valid.' }
  }
  if (input.direction !== 'up' && input.direction !== 'down') {
    return { ok: false, error: 'Arah pemindahan tidak valid.' }
  }

  const ctx = await loadQuestionForMgmt(input.questionId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const neighbour = await prisma.jobQuestion.findFirst({
      where: {
        jobId: ctx.question.jobId,
        order:
          input.direction === 'up'
            ? { lt: ctx.question.order }
            : { gt: ctx.question.order },
      },
      orderBy: { order: input.direction === 'up' ? 'desc' : 'asc' },
      select: { id: true, order: true },
    })
    if (!neighbour) {
      // Already at the edge — treat as no-op success so the UI doesn't flap.
      return { ok: true }
    }

    // Two-phase swap so we never violate any future uniqueness constraint on
    // (jobId, order). Phase 1 parks the current row on a sentinel value.
    const parkOrder = -Math.abs(ctx.question.order) - 1
    await prisma.$transaction([
      prisma.jobQuestion.update({
        where: { id: ctx.question.id },
        data: { order: parkOrder },
      }),
      prisma.jobQuestion.update({
        where: { id: neighbour.id },
        data: { order: ctx.question.order },
      }),
      prisma.jobQuestion.update({
        where: { id: ctx.question.id },
        data: { order: neighbour.order },
      }),
    ])

    await audit({
      tenantId: ctx.job.tenantId,
      userId: ctx.actorId,
      action: AuditAction.UPDATE,
      resourceId: ctx.question.id,
      metadata: {
        jobId: ctx.job.id,
        action: 'reorder',
        direction: input.direction,
        swappedWith: neighbour.id,
      },
    })

    revalidateForJob(ctx.tenant.slug, ctx.job.id)
    return { ok: true }
  } catch (err) {
    console.error('[reorderJobQuestion] failed', err)
    return { ok: false, error: 'Gagal memindah urutan. Coba lagi.' }
  }
}

// =============================================================================
// deleteJobQuestion
// =============================================================================

export async function deleteJobQuestion(
  questionId: string,
): Promise<ActionResult> {
  const ctx = await loadQuestionForMgmt(questionId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    await prisma.$transaction([
      prisma.jobQuestion.delete({ where: { id: ctx.question.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.job.tenantId,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.job.question',
          resourceId: ctx.question.id,
          metadata: {
            jobId: ctx.job.id,
            label: ctx.question.label,
            type: ctx.question.type,
          } as Prisma.InputJsonValue,
          ip: getRequestMeta().ip,
          userAgent: getRequestMeta().userAgent,
        },
      }),
    ])

    revalidateForJob(ctx.tenant.slug, ctx.job.id)
    return { ok: true }
  } catch (err) {
    console.error('[deleteJobQuestion] failed', err)
    return { ok: false, error: 'Gagal menghapus pertanyaan. Coba lagi.' }
  }
}
