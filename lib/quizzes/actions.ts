'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, type Permission } from '@/lib/auth/rbac'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

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

export type QuizQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'multi_select'

const QUESTION_TYPES: ReadonlyArray<QuizQuestionType> = [
  'multiple_choice',
  'true_false',
  'multi_select',
] as const

const questionTypeSchema = z.enum([
  'multiple_choice',
  'true_false',
  'multi_select',
])

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

const passingScoreSchema = z
  .number({ invalid_type_error: 'Skor lulus harus berupa angka' })
  .int('Skor lulus harus bilangan bulat')
  .min(0, 'Skor lulus minimal 0')
  .max(100, 'Skor lulus maksimal 100')

// =============================================================================
// Context loaders
// =============================================================================

type LessonLoadCtx =
  | { error: string }
  | {
      lesson: { id: string; courseId: string; tenantId: string; tenantSlug: string }
      actorId: string
    }

async function loadLessonForAction(
  lessonId: string,
  permission: Permission,
): Promise<LessonLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Anda harus masuk.' }
  if (!lessonId) return { error: 'ID pelajaran tidak valid.' }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: {
          course: {
            select: {
              id: true,
              tenantId: true,
              tenant: { select: { slug: true } },
            },
          },
        },
      },
    },
  })
  if (!lesson) return { error: 'Pelajaran tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      lesson.module.course.tenantId,
      permission,
    )
  ) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return {
    lesson: {
      id: lesson.id,
      courseId: lesson.module.course.id,
      tenantId: lesson.module.course.tenantId,
      tenantSlug: lesson.module.course.tenant.slug,
    },
    actorId,
  }
}

type QuizLoadCtx =
  | { error: string }
  | {
      quiz: {
        id: string
        lessonId: string
        courseId: string
        tenantId: string
        tenantSlug: string
      }
      actorId: string
    }

async function loadQuizForAction(
  quizId: string,
  permission: Permission,
): Promise<QuizLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Anda harus masuk.' }
  if (!quizId) return { error: 'ID kuis tidak valid.' }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      lessonId: true,
      lesson: {
        select: {
          module: {
            select: {
              course: {
                select: {
                  id: true,
                  tenantId: true,
                  tenant: { select: { slug: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!quiz) return { error: 'Kuis tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      quiz.lesson.module.course.tenantId,
      permission,
    )
  ) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return {
    quiz: {
      id: quiz.id,
      lessonId: quiz.lessonId,
      courseId: quiz.lesson.module.course.id,
      tenantId: quiz.lesson.module.course.tenantId,
      tenantSlug: quiz.lesson.module.course.tenant.slug,
    },
    actorId,
  }
}

type QuestionLoadCtx =
  | { error: string }
  | {
      question: {
        id: string
        quizId: string
        order: number
      }
      quiz: {
        id: string
        lessonId: string
        courseId: string
        tenantId: string
        tenantSlug: string
      }
      actorId: string
    }

async function loadQuestionForAction(
  questionId: string,
  permission: Permission,
): Promise<QuestionLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Anda harus masuk.' }
  if (!questionId) return { error: 'ID pertanyaan tidak valid.' }

  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      quizId: true,
      order: true,
      quiz: {
        select: {
          id: true,
          lessonId: true,
          lesson: {
            select: {
              module: {
                select: {
                  course: {
                    select: {
                      id: true,
                      tenantId: true,
                      tenant: { select: { slug: true } },
                    },
                  },
                },
              },
            },
          },
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
      question.quiz.lesson.module.course.tenantId,
      permission,
    )
  ) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return {
    question: {
      id: question.id,
      quizId: question.quizId,
      order: question.order,
    },
    quiz: {
      id: question.quiz.id,
      lessonId: question.quiz.lessonId,
      courseId: question.quiz.lesson.module.course.id,
      tenantId: question.quiz.lesson.module.course.tenantId,
      tenantSlug: question.quiz.lesson.module.course.tenant.slug,
    },
    actorId,
  }
}

// =============================================================================
// Choice / question validation by type
// =============================================================================

/**
 * Validate `choices` for a given question type. true_false must have exactly
 * 2 choices ("Benar"/"Salah") with exactly one correct. multiple_choice must
 * have 2+ choices with exactly one correct. multi_select must have 2+ choices
 * with 1+ correct.
 */
function validateChoicesForType(
  type: QuizQuestionType,
  choices: Array<{ text: string; isCorrect: boolean }>,
): string | null {
  if (!Array.isArray(choices) || choices.length === 0) {
    return 'Pilihan jawaban wajib diisi.'
  }
  const correctCount = choices.filter((c) => c.isCorrect).length

  if (type === 'true_false') {
    if (choices.length !== 2) {
      return 'Tipe Benar/Salah harus memiliki tepat 2 pilihan.'
    }
    if (correctCount !== 1) {
      return 'Tipe Benar/Salah harus memiliki tepat 1 jawaban benar.'
    }
    return null
  }
  if (type === 'multiple_choice') {
    if (choices.length < 2) {
      return 'Pilihan ganda minimal 2 pilihan.'
    }
    if (correctCount !== 1) {
      return 'Pilihan ganda harus memiliki tepat 1 jawaban benar.'
    }
    return null
  }
  // multi_select
  if (choices.length < 2) {
    return 'Pilihan jamak minimal 2 pilihan.'
  }
  if (correctCount < 1) {
    return 'Pilihan jamak harus memiliki minimal 1 jawaban benar.'
  }
  return null
}

// =============================================================================
// upsertQuiz
// =============================================================================

const upsertQuizSchema = z.object({
  lessonId: z.string().min(1, 'ID pelajaran wajib diisi.'),
  passingScore: passingScoreSchema.optional(),
  shuffle: z.boolean().optional(),
})

export async function upsertQuiz(input: {
  lessonId: string
  passingScore?: number
  shuffle?: boolean
}): Promise<ActionResult<{ id: string }>> {
  const parsed = upsertQuizSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid.',
      field: issue?.path[0] as string | undefined,
    }
  }

  const ctx = await loadLessonForAction(parsed.data.lessonId, 'course.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const quiz = await prisma.quiz.upsert({
      where: { lessonId: ctx.lesson.id },
      create: {
        lessonId: ctx.lesson.id,
        passingScore: parsed.data.passingScore ?? 70,
        shuffle: parsed.data.shuffle ?? false,
      },
      update: {
        ...(parsed.data.passingScore !== undefined
          ? { passingScore: parsed.data.passingScore }
          : {}),
        ...(parsed.data.shuffle !== undefined
          ? { shuffle: parsed.data.shuffle }
          : {}),
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.lesson.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course.quiz',
        resourceId: quiz.id,
        metadata: {
          lessonId: ctx.lesson.id,
          passingScore: parsed.data.passingScore,
          shuffle: parsed.data.shuffle,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.lesson.tenantSlug}/kursus/${ctx.lesson.courseId}/edit`,
    )
    return { ok: true, data: { id: quiz.id } }
  } catch (err) {
    console.error('[upsertQuiz] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// =============================================================================
// addQuestion
// =============================================================================

const addQuestionSchema = z.object({
  quizId: z.string().min(1, 'ID kuis wajib diisi.'),
  text: questionTextSchema,
  type: questionTypeSchema,
  choices: z.array(choiceSchema).min(2, 'Minimal 2 pilihan jawaban.'),
})

export async function addQuestion(input: {
  quizId: string
  text: string
  type: QuizQuestionType
  choices: Array<{ text: string; isCorrect: boolean }>
}): Promise<ActionResult<{ id: string }>> {
  const parsed = addQuestionSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid.',
      field: issue?.path[0] as string | undefined,
    }
  }

  const typeErr = validateChoicesForType(parsed.data.type, parsed.data.choices)
  if (typeErr) return { ok: false, error: typeErr, field: 'choices' }

  const ctx = await loadQuizForAction(parsed.data.quizId, 'course.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const last = await prisma.quizQuestion.findFirst({
      where: { quizId: ctx.quiz.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (last?.order ?? -1) + 1

    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.quizQuestion.create({
        data: {
          quizId: ctx.quiz.id,
          text: parsed.data.text,
          type: parsed.data.type,
          order: nextOrder,
        },
        select: { id: true },
      })
      await tx.quizChoice.createMany({
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
        tenantId: ctx.quiz.tenantId,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.course.quiz.question',
        resourceId: question.id,
        metadata: {
          quizId: ctx.quiz.id,
          lessonId: ctx.quiz.lessonId,
          type: parsed.data.type,
          choiceCount: parsed.data.choices.length,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.quiz.tenantSlug}/kursus/${ctx.quiz.courseId}/edit`,
    )
    return { ok: true, data: { id: question.id } }
  } catch (err) {
    console.error('[addQuestion] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
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
  const parsed = updateQuestionSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid.',
      field: issue?.path[0] as string | undefined,
    }
  }

  const ctx = await loadQuestionForAction(
    parsed.data.questionId,
    'course.update',
  )
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    // Need the current type to validate replacement choices against.
    const current = await prisma.quizQuestion.findUnique({
      where: { id: ctx.question.id },
      select: { type: true },
    })
    if (!current) return { ok: false, error: 'Pertanyaan tidak ditemukan.' }

    if (parsed.data.choices !== undefined) {
      const typeErr = validateChoicesForType(
        current.type as QuizQuestionType,
        parsed.data.choices,
      )
      if (typeErr) return { ok: false, error: typeErr, field: 'choices' }
    }

    await prisma.$transaction(async (tx) => {
      if (parsed.data.text !== undefined) {
        await tx.quizQuestion.update({
          where: { id: ctx.question.id },
          data: { text: parsed.data.text },
        })
      }
      if (parsed.data.choices !== undefined) {
        await tx.quizChoice.deleteMany({
          where: { questionId: ctx.question.id },
        })
        await tx.quizChoice.createMany({
          data: parsed.data.choices.map((c, idx) => ({
            questionId: ctx.question.id,
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
        tenantId: ctx.quiz.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course.quiz.question',
        resourceId: ctx.question.id,
        metadata: {
          quizId: ctx.quiz.id,
          changed: {
            text: parsed.data.text !== undefined,
            choices: parsed.data.choices !== undefined,
          },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.quiz.tenantSlug}/kursus/${ctx.quiz.courseId}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateQuestion] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// =============================================================================
// reorderQuestion
// =============================================================================

export async function reorderQuestion(input: {
  questionId: string
  direction: 'up' | 'down'
}): Promise<ActionResult> {
  if (!input.questionId) {
    return { ok: false, error: 'ID pertanyaan wajib diisi.' }
  }
  if (input.direction !== 'up' && input.direction !== 'down') {
    return { ok: false, error: 'Arah perpindahan tidak valid.' }
  }

  const ctx = await loadQuestionForAction(input.questionId, 'course.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const all = await prisma.quizQuestion.findMany({
      where: { quizId: ctx.quiz.id },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    })
    const idx = all.findIndex((q) => q.id === ctx.question.id)
    if (idx === -1) return { ok: false, error: 'Pertanyaan tidak ditemukan.' }
    const swapIdx = input.direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= all.length) {
      return { ok: true }
    }
    const cur = all[idx]!
    const other = all[swapIdx]!

    await prisma.$transaction([
      prisma.quizQuestion.update({
        where: { id: cur.id },
        data: { order: other.order },
      }),
      prisma.quizQuestion.update({
        where: { id: other.id },
        data: { order: cur.order },
      }),
    ])

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.quiz.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course.quiz.question',
        resourceId: ctx.question.id,
        metadata: {
          quizId: ctx.quiz.id,
          reorder: { from: cur.order, to: other.order },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.quiz.tenantSlug}/kursus/${ctx.quiz.courseId}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[reorderQuestion] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// =============================================================================
// deleteQuestion
// =============================================================================

export async function deleteQuestion(
  questionId: string,
): Promise<ActionResult> {
  const ctx = await loadQuestionForAction(questionId, 'course.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.quizQuestion.delete({ where: { id: ctx.question.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.quiz.tenantId,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.course.quiz.question',
          resourceId: ctx.question.id,
          metadata: {
            quizId: ctx.quiz.id,
            lessonId: ctx.quiz.lessonId,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(
      `/dashboard/tenants/${ctx.quiz.tenantSlug}/kursus/${ctx.quiz.courseId}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[deleteQuestion] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// =============================================================================
// deleteQuiz
// =============================================================================

export async function deleteQuiz(lessonId: string): Promise<ActionResult> {
  const ctx = await loadLessonForAction(lessonId, 'course.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const existing = await prisma.quiz.findUnique({
      where: { lessonId: ctx.lesson.id },
      select: { id: true },
    })
    if (!existing) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.quiz.delete({ where: { id: existing.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.lesson.tenantId,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.course.quiz',
          resourceId: existing.id,
          metadata: {
            lessonId: ctx.lesson.id,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(
      `/dashboard/tenants/${ctx.lesson.tenantSlug}/kursus/${ctx.lesson.courseId}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[deleteQuiz] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export { QUESTION_TYPES }

// =============================================================================
// fetchQuizForEditor — server action to refresh the QuizEditor data
// =============================================================================

export type FetchedQuiz = {
  id: string
  passingScore: number
  shuffle: boolean
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

/**
 * Used by the client QuizEditor to refresh after edits. Auth-gated to
 * recruiters who can edit the parent course — never exposes isCorrect to
 * users without `course.update`.
 */
export async function fetchQuizForEditor(input: {
  lessonId: string
}): Promise<ActionResult<{ quiz: FetchedQuiz }>> {
  const ctx = await loadLessonForAction(input.lessonId, 'course.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: ctx.lesson.id },
      select: {
        id: true,
        passingScore: true,
        shuffle: true,
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
    return { ok: true, data: { quiz } }
  } catch (err) {
    console.error('[fetchQuizForEditor] failed', err)
    return { ok: false, error: 'Gagal memuat kuis.' }
  }
}
