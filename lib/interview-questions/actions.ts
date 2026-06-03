'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { normalizeSkill } from '@/lib/skills/search'
import {
  QUESTION_CATEGORIES,
  type ActionResult,
  type QuestionCategory,
} from '@/lib/interview-questions/constants'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

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
 * Normalise tag inputs through the existing skill taxonomy so question tags
 * line up with job/skill tags (autocomplete, filtering, etc.). Empty tokens
 * and duplicates are dropped silently.
 */
function sanitizeTags(input: string[] | undefined): string[] {
  if (!input || input.length === 0) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    if (typeof raw !== 'string') continue
    const slug = normalizeSkill(raw)
    if (!slug) continue
    if (seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
    if (out.length >= 10) break
  }
  return out
}

const createSchema = z.object({
  tenantSlug: z.string().min(1),
  text: z
    .string()
    .trim()
    .min(10)
    .max(1000),
  category: z.enum(QUESTION_CATEGORIES),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5),
  tags: z
    .array(z.string())
    .max(10)
    .optional()
    .default([]),
})

const updateSchema = z.object({
  questionId: z.string().min(1),
  text: z
    .string()
    .trim()
    .min(10)
    .max(1000)
    .optional(),
  category: z
    .enum(QUESTION_CATEGORIES)
    .optional(),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  tags: z
    .array(z.string())
    .max(10)
    .optional(),
})

type TenantLoadCtx =
  | { error: string }
  | { tenant: { id: string; slug: string }; actorId: string }

async function loadTenantForSlug(tenantSlug: string): Promise<TenantLoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvInterview.interviewQuestions.mustLogin }
  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true },
    })
    .catch(() => null)
  if (!tenant) return { error: t.srvInterview.interviewQuestions.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    return { error: t.srvInterview.interviewQuestions.noPermission }
  }
  return { tenant, actorId }
}

type QuestionLoadCtx =
  | { error: string }
  | {
      actorId: string
      question: {
        id: string
        tenantId: string
        tenant: { slug: string }
        text: string
        category: string
        difficulty: number
        tags: string[]
      }
    }

async function loadQuestion(questionId: string): Promise<QuestionLoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvInterview.interviewQuestions.mustLogin }
  const question = await prisma.interviewQuestion
    .findUnique({
      where: { id: questionId },
      select: {
        id: true,
        tenantId: true,
        text: true,
        category: true,
        difficulty: true,
        tags: true,
        tenant: { select: { slug: true } },
      },
    })
    .catch(() => null)
  if (!question) return { error: t.srvInterview.interviewQuestions.questionNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, question.tenantId, 'job.update')) {
    return { error: t.srvInterview.interviewQuestions.noPermission }
  }
  return { actorId, question }
}

function revalidateForTenant(tenantSlug: string, questionId?: string) {
  revalidatePath(`/dashboard/tenants/${tenantSlug}/interview-questions`)
  if (questionId) {
    revalidatePath(
      `/dashboard/tenants/${tenantSlug}/interview-questions/${questionId}/edit`,
    )
  }
}

export async function createQuestion(input: {
  tenantSlug: string
  text: string
  category: string
  difficulty: number
  tags?: string[]
}): Promise<ActionResult<{ questionId: string }>> {
  const t = await getServerT()
  const parsed = await localizedParse(createSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvInterview.interviewQuestions.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, text, category, difficulty, tags } = parsed.data

  const ctx = await loadTenantForSlug(tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const cleanTags = sanitizeTags(tags)
    const created = await prisma.interviewQuestion.create({
      data: {
        tenantId: ctx.tenant.id,
        text,
        category,
        difficulty,
        tags: cleanTags,
        createdById: ctx.actorId,
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.interview_question',
        resourceId: created.id,
        metadata: {
          category,
          difficulty,
          tags: cleanTags,
          textPreview: text.slice(0, 80),
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForTenant(ctx.tenant.slug)
    return { ok: true, data: { questionId: created.id } }
  } catch (err) {
    console.error('[createQuestion] failed', err)
    return { ok: false, error: t.srvInterview.interviewQuestions.genericError }
  }
}

export async function updateQuestion(input: {
  questionId: string
  text?: string
  category?: string
  difficulty?: number
  tags?: string[]
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = await localizedParse(updateSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvInterview.interviewQuestions.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { questionId, text, category, difficulty, tags } = parsed.data

  const ctx = await loadQuestion(questionId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const changed: string[] = []
    const data: Record<string, unknown> = {}

    if (text !== undefined && text !== ctx.question.text) {
      data.text = text
      changed.push('text')
    }
    if (category !== undefined && category !== ctx.question.category) {
      data.category = category
      changed.push('category')
    }
    if (difficulty !== undefined && difficulty !== ctx.question.difficulty) {
      data.difficulty = difficulty
      changed.push('difficulty')
    }
    if (tags !== undefined) {
      const cleanTags = sanitizeTags(tags)
      const current = ctx.question.tags ?? []
      const sameSet =
        cleanTags.length === current.length &&
        cleanTags.every((t) => current.includes(t))
      if (!sameSet) {
        data.tags = cleanTags
        changed.push('tags')
      }
    }

    if (changed.length === 0) {
      return { ok: true }
    }

    await prisma.interviewQuestion.update({
      where: { id: questionId },
      data,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.question.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.interview_question',
        resourceId: questionId,
        metadata: { changed } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForTenant(ctx.question.tenant.slug, questionId)
    return { ok: true }
  } catch (err) {
    console.error('[updateQuestion] failed', err)
    return { ok: false, error: t.srvInterview.interviewQuestions.genericError }
  }
}

export async function deleteQuestion(
  questionId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  if (!questionId) return { ok: false, error: t.srvInterview.interviewQuestions.questionIdInvalid }

  const ctx = await loadQuestion(questionId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    await prisma.interviewQuestion.delete({ where: { id: questionId } })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.question.tenantId,
        userId: ctx.actorId,
        action: AuditAction.DELETE,
        resource: 'tenant.interview_question',
        resourceId: questionId,
        metadata: {
          category: ctx.question.category,
          difficulty: ctx.question.difficulty,
          tags: ctx.question.tags,
          textPreview: ctx.question.text.slice(0, 80),
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForTenant(ctx.question.tenant.slug)
    return { ok: true }
  } catch (err) {
    console.error('[deleteQuestion] failed', err)
    return { ok: false, error: t.srvInterview.interviewQuestions.genericError }
  }
}
