'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/rbac'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

// =============================================================================
// Permission model — MVP decision (documented)
// =============================================================================
//
// Assessments are a PLATFORM-WIDE library (not tenant-scoped). To keep the
// MVP simple and consistent with `app/(dashboard)/admin/layout.tsx` (which
// already gates admin routes to SUPERADMIN/ADMIN), we restrict authoring to
// global SUPERADMIN/ADMIN. Tenant OWNER/ADMIN can still suggest assessments
// by contacting platform admins; once the library matures we can broaden
// authoring to tenant-scoped owners.
//
// Permission used: `course.update` (closest semantic match; SUPERADMIN +
// ADMIN both already carry it via ROLE_PERMISSIONS).
// =============================================================================

const ASSESSMENT_CATEGORIES = ['technical', 'soft', 'language', 'cognitive'] as const
export type AssessmentCategory = (typeof ASSESSMENT_CATEGORIES)[number]

export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'multi_select'

const QUESTION_TYPES: ReadonlyArray<AssessmentQuestionType> = [
  'multiple_choice',
  'true_false',
  'multi_select',
] as const

const questionTypeSchema = z.enum([
  'multiple_choice',
  'true_false',
  'multi_select',
])

const categorySchema = z.enum(ASSESSMENT_CATEGORIES)

const choiceSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Teks pilihan tidak boleh kosong')
    .max(2_000, 'Teks pilihan terlalu panjang'),
  isCorrect: z.boolean(),
})

const questionTextSchema = z
  .string()
  .trim()
  .min(3, 'Teks pertanyaan minimal 3 karakter')
  .max(4_000, 'Teks pertanyaan terlalu panjang')

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

/**
 * Build a kebab-case slug from `title` + a short nanoid suffix to satisfy
 * Assessment's @@unique([slug]).
 */
function buildAssessmentSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, '')
  return base ? `${base}-${suffix}` : `assessment-${suffix}`
}

/**
 * Require the current session to be a global SUPERADMIN or ADMIN.
 * Assessments are platform-wide; we use the closest existing permission
 * (`course.update`) which both roles carry.
 */
async function requireAssessmentAuthor(): Promise<
  { error: string } | { actorId: string }
> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { error: t.srvAssessments.assessments.auth.mustLogin }
  const { globalRole, id: actorId } = session.user
  if (globalRole !== 'SUPERADMIN' && globalRole !== 'ADMIN') {
    return {
      error: t.srvAssessments.assessments.auth.adminOnly,
    }
  }
  // Belt-and-suspenders: also verify the permission is wired up correctly.
  if (!hasPermission(globalRole, 'course.update')) {
    return { error: t.srvAssessments.assessments.auth.noPermission }
  }
  return { actorId }
}

/**
 * Validate `choices` for a given question type (same rules as quiz):
 *   - true_false: exactly 2 choices, exactly 1 correct
 *   - multiple_choice: ≥2 choices, exactly 1 correct
 *   - multi_select: ≥2 choices, ≥1 correct
 */
async function validateChoicesForType(
  type: AssessmentQuestionType,
  choices: Array<{ text: string; isCorrect: boolean }>,
): Promise<string | null> {
  const t = await getServerT()
  const v = t.srvAssessments.assessments.validation
  if (!Array.isArray(choices) || choices.length === 0) {
    return v.choicesRequired
  }
  const correctCount = choices.filter((c) => c.isCorrect).length

  if (type === 'true_false') {
    if (choices.length !== 2) {
      return v.trueFalseExact2
    }
    if (correctCount !== 1) {
      return v.trueFalseExact1Correct
    }
    return null
  }
  if (type === 'multiple_choice') {
    if (choices.length < 2) {
      return v.multipleChoiceMin2
    }
    if (correctCount !== 1) {
      return v.multipleChoiceExact1Correct
    }
    return null
  }
  if (choices.length < 2) {
    return v.multiSelectMin2
  }
  if (correctCount < 1) {
    return v.multiSelectMin1Correct
  }
  return null
}

// =============================================================================
// createAssessment
// =============================================================================

const createSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Judul minimal 5 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  description: z
    .string()
    .trim()
    .min(20, 'Deskripsi minimal 20 karakter')
    .max(5_000, 'Deskripsi terlalu panjang'),
  category: categorySchema,
  durationMin: z
    .number({ invalid_type_error: 'Durasi harus berupa angka' })
    .int('Durasi harus bilangan bulat')
    .min(1, 'Durasi minimal 1 menit')
    .max(600, 'Durasi maksimal 600 menit')
    .optional(),
  passingScore: z
    .number({ invalid_type_error: 'Skor lulus harus berupa angka' })
    .int('Skor lulus harus bilangan bulat')
    .min(0, 'Skor lulus minimal 0')
    .max(100, 'Skor lulus maksimal 100')
    .optional(),
})

export async function createAssessment(input: {
  title: string
  description: string
  category: AssessmentCategory
  durationMin?: number
  passingScore?: number
}): Promise<ActionResult<{ id: string; slug: string }>> {
  const t = await getServerT()
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAssessments.assessments.validation.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }

  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    // Loop on slug collision (rare with nanoid suffix).
    let slug = buildAssessmentSlug(parsed.data.title)
    for (let i = 0; i < 3; i++) {
      const exists = await prisma.assessment.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (!exists) break
      slug = buildAssessmentSlug(parsed.data.title)
    }

    const assessment = await prisma.assessment.create({
      data: {
        slug,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        durationMin: parsed.data.durationMin ?? 30,
        passingScore: parsed.data.passingScore ?? 70,
        status: 'DRAFT',
        createdById: auth.actorId,
      },
      select: { id: true, slug: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: auth.actorId,
        action: AuditAction.CREATE,
        resource: 'assessment',
        resourceId: assessment.id,
        metadata: {
          slug: assessment.slug,
          title: parsed.data.title,
          category: parsed.data.category,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/admin/assessments')
    revalidatePath('/dashboard/assesmen')
    return { ok: true, data: { id: assessment.id, slug: assessment.slug } }
  } catch (err) {
    console.error('[createAssessment] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

// =============================================================================
// updateAssessment
// =============================================================================

const updateSchema = z.object({
  assessmentId: z.string().min(1, 'ID asesmen wajib diisi.'),
  title: createSchema.shape.title.optional(),
  description: createSchema.shape.description.optional(),
  category: categorySchema.optional(),
  durationMin: createSchema.shape.durationMin,
  passingScore: createSchema.shape.passingScore,
})

export async function updateAssessment(input: {
  assessmentId: string
  title?: string
  description?: string
  category?: AssessmentCategory
  durationMin?: number
  passingScore?: number
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAssessments.assessments.validation.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }

  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const existing = await prisma.assessment.findUnique({
      where: { id: parsed.data.assessmentId },
      select: { id: true, slug: true },
    })
    if (!existing) return { ok: false, error: t.srvAssessments.assessments.validation.assessmentNotFound }

    await prisma.assessment.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
        ...(parsed.data.category !== undefined
          ? { category: parsed.data.category }
          : {}),
        ...(parsed.data.durationMin !== undefined
          ? { durationMin: parsed.data.durationMin }
          : {}),
        ...(parsed.data.passingScore !== undefined
          ? { passingScore: parsed.data.passingScore }
          : {}),
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: auth.actorId,
        action: AuditAction.UPDATE,
        resource: 'assessment',
        resourceId: existing.id,
        metadata: {
          changed: {
            title: parsed.data.title !== undefined,
            description: parsed.data.description !== undefined,
            category: parsed.data.category !== undefined,
            durationMin: parsed.data.durationMin !== undefined,
            passingScore: parsed.data.passingScore !== undefined,
          },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/admin/assessments')
    revalidatePath(`/admin/assessments/${existing.id}/edit`)
    revalidatePath(`/dashboard/assesmen/${existing.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[updateAssessment] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

// =============================================================================
// publishAssessment / archiveAssessment
// =============================================================================

async function setAssessmentStatus(
  assessmentId: string,
  status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
): Promise<ActionResult> {
  const t = await getServerT()
  if (!assessmentId) return { ok: false, error: t.srvAssessments.assessments.validation.assessmentIdRequired }
  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const existing = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, slug: true, status: true },
    })
    if (!existing) return { ok: false, error: t.srvAssessments.assessments.validation.assessmentNotFound }

    if (status === 'PUBLISHED') {
      // Sanity check: don't publish empty assessments.
      const qCount = await prisma.assessmentQuestion.count({
        where: { assessmentId: existing.id },
      })
      if (qCount === 0) {
        return {
          ok: false,
          error: t.srvAssessments.assessments.validation.addQuestionFirst,
        }
      }
    }

    await prisma.assessment.update({
      where: { id: existing.id },
      data: { status },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: auth.actorId,
        action: AuditAction.UPDATE,
        resource: 'assessment',
        resourceId: existing.id,
        metadata: {
          status,
          previousStatus: existing.status,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/admin/assessments')
    revalidatePath(`/admin/assessments/${existing.id}/edit`)
    revalidatePath('/dashboard/assesmen')
    revalidatePath(`/dashboard/assesmen/${existing.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[setAssessmentStatus] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

export async function publishAssessment(
  assessmentId: string,
): Promise<ActionResult> {
  return setAssessmentStatus(assessmentId, 'PUBLISHED')
}

export async function archiveAssessment(
  assessmentId: string,
): Promise<ActionResult> {
  return setAssessmentStatus(assessmentId, 'ARCHIVED')
}

export async function unpublishAssessment(
  assessmentId: string,
): Promise<ActionResult> {
  return setAssessmentStatus(assessmentId, 'DRAFT')
}

// =============================================================================
// addQuestion
// =============================================================================

const addQuestionSchema = z.object({
  assessmentId: z.string().min(1, 'ID asesmen wajib diisi.'),
  text: questionTextSchema,
  type: questionTypeSchema,
  choices: z.array(choiceSchema).min(2, 'Minimal 2 pilihan jawaban.'),
})

export async function addQuestion(input: {
  assessmentId: string
  text: string
  type: AssessmentQuestionType
  choices: Array<{ text: string; isCorrect: boolean }>
}): Promise<ActionResult<{ id: string }>> {
  const t = await getServerT()
  const parsed = addQuestionSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAssessments.assessments.validation.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }

  const typeErr = await validateChoicesForType(parsed.data.type, parsed.data.choices)
  if (typeErr) return { ok: false, error: typeErr, field: 'choices' }

  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: parsed.data.assessmentId },
      select: { id: true, slug: true },
    })
    if (!assessment) return { ok: false, error: t.srvAssessments.assessments.validation.assessmentNotFound }

    const last = await prisma.assessmentQuestion.findFirst({
      where: { assessmentId: assessment.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (last?.order ?? -1) + 1

    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.assessmentQuestion.create({
        data: {
          assessmentId: assessment.id,
          text: parsed.data.text,
          type: parsed.data.type,
          order: nextOrder,
        },
        select: { id: true },
      })
      await tx.assessmentChoice.createMany({
        data: parsed.data.choices.map((c, idx) => ({
          questionId: q.id,
          text: c.text,
          isCorrect: c.isCorrect,
          order: idx,
        })),
      })
      return q
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: auth.actorId,
        action: AuditAction.CREATE,
        resource: 'assessment.question',
        resourceId: question.id,
        metadata: {
          assessmentId: assessment.id,
          type: parsed.data.type,
          choiceCount: parsed.data.choices.length,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/admin/assessments/${assessment.id}/edit`)
    return { ok: true, data: { id: question.id } }
  } catch (err) {
    console.error('[addQuestion] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

// =============================================================================
// updateQuestion
// =============================================================================

const updateQuestionSchema = z.object({
  questionId: z.string().min(1, 'ID pertanyaan wajib diisi.'),
  text: questionTextSchema.optional(),
  choices: z.array(choiceSchema).optional(),
})

export async function updateQuestion(input: {
  questionId: string
  text?: string
  choices?: Array<{ text: string; isCorrect: boolean }>
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = updateQuestionSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAssessments.assessments.validation.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }

  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const current = await prisma.assessmentQuestion.findUnique({
      where: { id: parsed.data.questionId },
      select: { id: true, type: true, assessmentId: true },
    })
    if (!current) return { ok: false, error: t.srvAssessments.assessments.validation.questionNotFound }

    if (parsed.data.choices !== undefined) {
      const typeErr = await validateChoicesForType(
        current.type as AssessmentQuestionType,
        parsed.data.choices,
      )
      if (typeErr) return { ok: false, error: typeErr, field: 'choices' }
    }

    await prisma.$transaction(async (tx) => {
      if (parsed.data.text !== undefined) {
        await tx.assessmentQuestion.update({
          where: { id: current.id },
          data: { text: parsed.data.text },
        })
      }
      if (parsed.data.choices !== undefined) {
        await tx.assessmentChoice.deleteMany({
          where: { questionId: current.id },
        })
        await tx.assessmentChoice.createMany({
          data: parsed.data.choices.map((c, idx) => ({
            questionId: current.id,
            text: c.text,
            isCorrect: c.isCorrect,
            order: idx,
          })),
        })
      }
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: auth.actorId,
        action: AuditAction.UPDATE,
        resource: 'assessment.question',
        resourceId: current.id,
        metadata: {
          assessmentId: current.assessmentId,
          changed: {
            text: parsed.data.text !== undefined,
            choices: parsed.data.choices !== undefined,
          },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/admin/assessments/${current.assessmentId}/edit`)
    return { ok: true }
  } catch (err) {
    console.error('[updateQuestion] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

// =============================================================================
// reorderQuestion
// =============================================================================

export async function reorderQuestion(input: {
  questionId: string
  direction: 'up' | 'down'
}): Promise<ActionResult> {
  const t = await getServerT()
  if (!input.questionId) {
    return { ok: false, error: t.srvAssessments.assessments.validation.questionIdRequired }
  }
  if (input.direction !== 'up' && input.direction !== 'down') {
    return { ok: false, error: t.srvAssessments.assessments.validation.invalidDirection }
  }

  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const current = await prisma.assessmentQuestion.findUnique({
      where: { id: input.questionId },
      select: { id: true, assessmentId: true, order: true },
    })
    if (!current) return { ok: false, error: t.srvAssessments.assessments.validation.questionNotFound }

    const all = await prisma.assessmentQuestion.findMany({
      where: { assessmentId: current.assessmentId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    })
    const idx = all.findIndex((q) => q.id === current.id)
    if (idx === -1) return { ok: false, error: t.srvAssessments.assessments.validation.questionNotFound }
    const swapIdx = input.direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= all.length) {
      return { ok: true }
    }
    const cur = all[idx]!
    const other = all[swapIdx]!

    await prisma.$transaction([
      prisma.assessmentQuestion.update({
        where: { id: cur.id },
        data: { order: other.order },
      }),
      prisma.assessmentQuestion.update({
        where: { id: other.id },
        data: { order: cur.order },
      }),
    ])

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: auth.actorId,
        action: AuditAction.UPDATE,
        resource: 'assessment.question',
        resourceId: current.id,
        metadata: {
          assessmentId: current.assessmentId,
          reorder: { from: cur.order, to: other.order },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/admin/assessments/${current.assessmentId}/edit`)
    return { ok: true }
  } catch (err) {
    console.error('[reorderQuestion] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

// =============================================================================
// deleteQuestion
// =============================================================================

export async function deleteQuestion(
  questionId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  if (!questionId) return { ok: false, error: t.srvAssessments.assessments.validation.questionIdRequired }
  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const current = await prisma.assessmentQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, assessmentId: true },
    })
    if (!current) return { ok: false, error: t.srvAssessments.assessments.validation.questionNotFound }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.assessmentQuestion.delete({ where: { id: current.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: null,
          userId: auth.actorId,
          action: AuditAction.DELETE,
          resource: 'assessment.question',
          resourceId: current.id,
          metadata: {
            assessmentId: current.assessmentId,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/admin/assessments/${current.assessmentId}/edit`)
    return { ok: true }
  } catch (err) {
    console.error('[deleteQuestion] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.genericRetry }
  }
}

// =============================================================================
// fetchAssessmentForEditor — refresh data for the AssessmentEditor client
// =============================================================================

export type FetchedAssessmentEditor = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  durationMin: number
  passingScore: number
  status: string
  questions: Array<{
    id: string
    text: string
    type: string
    order: number
    choices: Array<{
      id: string
      text: string
      isCorrect: boolean
      order: number
    }>
  }>
} | null

export async function fetchAssessmentForEditor(input: {
  assessmentId: string
}): Promise<ActionResult<{ assessment: FetchedAssessmentEditor }>> {
  const t = await getServerT()
  const auth = await requireAssessmentAuthor()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: input.assessmentId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        durationMin: true,
        passingScore: true,
        status: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            type: true,
            order: true,
            choices: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                text: true,
                isCorrect: true,
                order: true,
              },
            },
          },
        },
      },
    })
    return { ok: true, data: { assessment } }
  } catch (err) {
    console.error('[fetchAssessmentForEditor] failed', err)
    return { ok: false, error: t.srvAssessments.assessments.errors.failedLoadAssessment }
  }
}

export { ASSESSMENT_CATEGORIES, QUESTION_TYPES }
