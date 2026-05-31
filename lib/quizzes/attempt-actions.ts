'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
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

/**
 * Fisher–Yates shuffle. Pure copy — leaves the source array untouched, which
 * is important because we share question lists across many requests.
 */
function shuffle<T>(arr: ReadonlyArray<T>): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

// =============================================================================
// startAttempt
// =============================================================================

const startSchema = z.object({
  quizId: z.string().min(1, 'ID kuis wajib diisi.'),
})

export type StartAttemptPayload = {
  attemptId: string
  quiz: {
    id: string
    passingScore: number
    shuffle: boolean
    questions: Array<{
      id: string
      text: string
      type: string
      choices: Array<{ id: string; text: string }>
    }>
  }
}

/**
 * Candidate starts a quiz attempt. Verifies they have an active enrollment in
 * the parent course, then creates a fresh QuizAttempt with empty answers.
 * Returns a sanitised question list (no isCorrect flag) — also shuffles both
 * questions and choices on the server when quiz.shuffle is on, so the user
 * sees a fresh order on every attempt.
 */
export async function startAttempt(input: {
  quizId: string
}): Promise<ActionResult<StartAttemptPayload>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const userId = session.user.id

  const parsed = startSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? 'Input tidak valid.',
      field: first?.path?.[0]?.toString(),
    }
  }
  const { quizId } = parsed.data

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        passingScore: true,
        shuffle: true,
        lesson: {
          select: {
            id: true,
            module: {
              select: {
                course: {
                  select: { id: true, tenantId: true },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            type: true,
            choices: {
              orderBy: { order: 'asc' },
              select: { id: true, text: true },
            },
          },
        },
      },
    })
    if (!quiz) return { ok: false, error: 'Kuis tidak ditemukan.' }

    // Candidate-side guard: must be enrolled in the parent course.
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.lesson.module.course.id,
        },
      },
      select: { id: true },
    })
    if (!enrollment) {
      return {
        ok: false,
        error: 'Anda harus terdaftar di kursus ini untuk mengerjakan kuis.',
      }
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answers: [] as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: quiz.lesson.module.course.tenantId,
        userId,
        action: AuditAction.CREATE,
        resource: 'quiz.attempt',
        resourceId: attempt.id,
        metadata: {
          quizId,
          lessonId: quiz.lesson.id,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // Shuffle questions + choices if the quiz is configured for it. We always
    // shuffle choice order (so candidates can't memorise positions) when
    // shuffle is on.
    const baseQuestions = quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      choices: quiz.shuffle ? shuffle(q.choices) : q.choices,
    }))
    const orderedQuestions = quiz.shuffle ? shuffle(baseQuestions) : baseQuestions

    return {
      ok: true,
      data: {
        attemptId: attempt.id,
        quiz: {
          id: quiz.id,
          passingScore: quiz.passingScore,
          shuffle: quiz.shuffle,
          questions: orderedQuestions,
        },
      },
    }
  } catch (err) {
    console.error('[startAttempt] failed', err)
    return { ok: false, error: 'Gagal memulai kuis. Coba lagi sebentar.' }
  }
}

// =============================================================================
// submitAttempt
// =============================================================================

const answerSchema = z.object({
  questionId: z.string().min(1),
  choiceIds: z.array(z.string().min(1)),
})

const submitSchema = z.object({
  attemptId: z.string().min(1, 'ID percobaan wajib diisi.'),
  answers: z.array(answerSchema),
})

export type SubmitAttemptResult = {
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

/**
 * Score and finalise an attempt.
 *
 * Scoring: each question is worth 1 point. For multiple_choice / true_false
 * we award the point only if the user picked exactly one choice AND it is
 * the correct one. For multi_select the user's set must EXACTLY equal the
 * correct-choices set (no partial credit — cleanest UX for the MVP).
 *
 * Final score = round((points / totalQuestions) * 100). passed if >= the
 * quiz's passingScore. On pass we also try to mark the parent lesson
 * complete via the existing enrollments action (dynamic-imported to keep
 * the dependency direction clean and avoid a circular tracker import).
 */
export async function submitAttempt(input: {
  attemptId: string
  answers: Array<{ questionId: string; choiceIds: string[] }>
}): Promise<ActionResult<SubmitAttemptResult>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  const parsed = submitSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? 'Input tidak valid.',
      field: first?.path?.[0]?.toString(),
    }
  }
  const { attemptId, answers } = parsed.data

  try {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        quizId: true,
        completedAt: true,
        quiz: {
          select: {
            id: true,
            passingScore: true,
            lessonId: true,
            lesson: {
              select: {
                id: true,
                module: {
                  select: {
                    course: {
                      select: { id: true, slug: true, tenantId: true },
                    },
                  },
                },
              },
            },
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                type: true,
                choices: {
                  select: { id: true, isCorrect: true },
                },
              },
            },
          },
        },
      },
    })
    if (!attempt) return { ok: false, error: 'Percobaan tidak ditemukan.' }
    if (attempt.userId !== userId) {
      return { ok: false, error: 'Anda tidak berhak mengubah percobaan ini.' }
    }
    if (attempt.completedAt) {
      return { ok: false, error: 'Percobaan ini sudah selesai.' }
    }

    const questions = attempt.quiz.questions
    const totalCount = questions.length
    const answerMap = new Map<string, Set<string>>()
    for (const a of answers) {
      answerMap.set(a.questionId, new Set(a.choiceIds))
    }

    let correctCount = 0
    for (const q of questions) {
      const userPicked = answerMap.get(q.id) ?? new Set<string>()
      const correctIds = new Set(
        q.choices.filter((c) => c.isCorrect).map((c) => c.id),
      )

      if (q.type === 'multi_select') {
        if (userPicked.size > 0 && setsEqual(userPicked, correctIds)) {
          correctCount++
        }
      } else {
        // multiple_choice + true_false: exactly one pick, must be correct.
        if (userPicked.size === 1) {
          const onlyId = userPicked.values().next().value as string
          if (correctIds.has(onlyId)) correctCount++
        }
      }
    }

    const score =
      totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100)
    const passed = score >= attempt.quiz.passingScore

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        passed,
        answers: answers as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: attempt.quiz.lesson.module.course.tenantId,
        userId,
        action: AuditAction.UPDATE,
        resource: 'quiz.attempt',
        resourceId: attempt.id,
        metadata: {
          quizId: attempt.quizId,
          score,
          passed,
          correctCount,
          totalCount,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // On pass, propagate completion to the lesson via existing flow. Wrapped
    // in try/catch so a downstream failure (e.g. user lost enrollment after
    // start) doesn't void a legitimate quiz pass.
    if (passed) {
      try {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: attempt.quiz.lesson.module.course.id,
            },
          },
          select: { id: true },
        })
        if (enrollment) {
          const { markLessonComplete } = await import(
            '@/lib/enrollments/actions'
          )
          await markLessonComplete({
            enrollmentId: enrollment.id,
            lessonId: attempt.quiz.lesson.id,
          })
        }
      } catch (e) {
        console.error('[submitAttempt] markLessonComplete failed', e)
      }
    }

    revalidatePath(
      `/dashboard/kursus/${attempt.quiz.lesson.module.course.slug}`,
    )

    return {
      ok: true,
      data: { score, passed, correctCount, totalCount },
    }
  } catch (err) {
    console.error('[submitAttempt] failed', err)
    return { ok: false, error: 'Gagal menyimpan jawaban. Coba lagi sebentar.' }
  }
}
