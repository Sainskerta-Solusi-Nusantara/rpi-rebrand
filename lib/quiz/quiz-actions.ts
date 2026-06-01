'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { issueCertificate } from '@/lib/quiz/certificate-issuer'

// -----------------------------------------------------------------------------
// Constants & types
// -----------------------------------------------------------------------------

/**
 * Hard cap on quiz attempts per (user, quiz). Configurable later via a
 * per-quiz field or tenant setting — for now this lives as a single global
 * constant so the policy is easy to audit.
 */
export const MAX_ATTEMPTS_PER_QUIZ = 5

export type StartAttemptResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string }

export type SubmitAttemptResult =
  | {
      ok: true
      score: number
      passed: boolean
      certificateIssued: boolean
      certificateId?: string
      certificateNumber?: string
    }
  | { ok: false; error: string }

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

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

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

// -----------------------------------------------------------------------------
// startQuizAttempt
// -----------------------------------------------------------------------------

/**
 * Create a new QuizAttempt row for the signed-in user. Caller is responsible
 * for verifying enrollment before invoking (e.g. via the lesson surface).
 *
 * Enforces MAX_ATTEMPTS_PER_QUIZ: throws "Batas percobaan tercapai" if the
 * user already has MAX completed attempts. In-progress (incomplete) attempts
 * are NOT counted against the cap — they will be the natural reuse target.
 */
export async function startQuizAttempt(quizId: string): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Anda harus masuk.')
  const userId = session.user.id

  if (!quizId) throw new Error('ID kuis tidak valid.')

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      lessonId: true,
      questions: { select: { id: true } },
      lesson: {
        select: {
          module: { select: { course: { select: { id: true, tenantId: true } } } },
        },
      },
    },
  })
  if (!quiz) throw new Error('Kuis tidak ditemukan.')
  if (quiz.questions.length === 0) throw new Error('Kuis belum siap')

  const completedCount = await prisma.quizAttempt.count({
    where: { userId, quizId, completedAt: { not: null } },
  })
  if (completedCount >= MAX_ATTEMPTS_PER_QUIZ) {
    throw new Error('Batas percobaan tercapai')
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score: 0,
      passed: false,
      answers: {} as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  })

  const meta = getRequestMeta()
  await prisma.auditLog.create({
    data: {
      tenantId: quiz.lesson.module.course.tenantId,
      userId,
      action: AuditAction.CREATE,
      resource: 'quiz.attempt.started',
      resourceId: attempt.id,
      metadata: {
        quizId,
        lessonId: quiz.lessonId,
      } as Prisma.InputJsonValue,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  })

  return attempt.id
}

// -----------------------------------------------------------------------------
// submitQuizAttempt
// -----------------------------------------------------------------------------

const answersJsonSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.array(z.string())]),
)

/**
 * Score and finalise an attempt. The caller passes an `answersJson` keyed by
 * questionId. Values:
 *   - multiple_choice / true_false: single choice id string
 *   - multi_select: array of choice id strings (order irrelevant)
 *
 * Each question is worth `100 / totalQuestions` points (Math.round at end).
 * Passed iff score >= quiz.passingScore. On pass we mark the parent
 * LessonProgress completedAt=now. If that pass completes ALL required
 * lessons (and their quizzes) in the course, we auto-issue a certificate
 * via `issueCertificate(userId, courseId)`.
 *
 * Multi-select scoring: ALL-OR-NOTHING. The user's set must exactly match
 * the correct set — no partial credit. Empty answers always score zero.
 *
 * Already-completed attempts are rejected (idempotent failure).
 */
export async function submitQuizAttempt(
  attemptId: string,
  answersJson: unknown,
): Promise<SubmitAttemptResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  if (!attemptId) return { ok: false, error: 'ID percobaan tidak valid.' }

  const parsedAnswers = answersJsonSchema.safeParse(answersJson)
  if (!parsedAnswers.success) {
    return { ok: false, error: 'Format jawaban tidak valid.' }
  }
  const answers = parsedAnswers.data

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
                      select: {
                        id: true,
                        slug: true,
                        tenantId: true,
                      },
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
                choices: { select: { id: true, isCorrect: true } },
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
    if (totalCount === 0) {
      return { ok: false, error: 'Kuis belum siap' }
    }

    // Score: each question = 100 / totalCount points. Sum, then round at end.
    const pointPerQuestion = 100 / totalCount
    let rawScore = 0

    for (const q of questions) {
      const correctIds = new Set(
        q.choices.filter((c) => c.isCorrect).map((c) => c.id),
      )
      const raw = answers[q.id]
      let userSet: Set<string>
      if (raw === undefined) {
        userSet = new Set()
      } else if (Array.isArray(raw)) {
        userSet = new Set(raw)
      } else {
        userSet = new Set([raw])
      }
      if (userSet.size === 0) continue

      if (q.type === 'multi_select') {
        if (setsEqual(userSet, correctIds)) rawScore += pointPerQuestion
      } else {
        // multiple_choice / true_false: exactly one pick, must be the correct one.
        if (userSet.size === 1) {
          const only = userSet.values().next().value as string
          if (correctIds.has(only)) rawScore += pointPerQuestion
        }
      }
    }

    const score = Math.round(rawScore)
    const passed = score >= attempt.quiz.passingScore
    const now = new Date()
    const courseId = attempt.quiz.lesson.module.course.id
    const tenantId = attempt.quiz.lesson.module.course.tenantId
    const courseSlug = attempt.quiz.lesson.module.course.slug
    const lessonId = attempt.quiz.lesson.id

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        passed,
        answers: answers as unknown as Prisma.InputJsonValue,
        completedAt: now,
      },
    })

    // Audit per spec.
    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: AuditAction.UPDATE,
        resource: 'quiz.attempt.submitted',
        resourceId: attempt.id,
        metadata: {
          quizId: attempt.quizId,
          score,
          passed,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    let certificateIssued = false
    let certificateId: string | undefined
    let certificateNumber: string | undefined

    if (passed) {
      // Mark the parent LessonProgress completedAt = now (idempotent — does
      // not overwrite an earlier completedAt).
      try {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { id: true },
        })
        if (enrollment) {
          await prisma.lessonProgress.upsert({
            where: {
              enrollmentId_lessonId: {
                enrollmentId: enrollment.id,
                lessonId,
              },
            },
            create: {
              enrollmentId: enrollment.id,
              lessonId,
              completedAt: now,
            },
            update: {},
          })

          // Recompute and persist enrollment progress %.
          const [totalLessons, completedLessons] = await Promise.all([
            prisma.lesson.count({ where: { module: { courseId } } }),
            prisma.lessonProgress.count({
              where: {
                enrollmentId: enrollment.id,
                completedAt: { not: null },
              },
            }),
          ])
          const progress =
            totalLessons === 0
              ? 0
              : Math.min(
                  100,
                  Math.round((completedLessons / totalLessons) * 100),
                )
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              progress,
              ...(progress >= 100
                ? { status: 'COMPLETED', completedAt: now }
                : {}),
            },
          })

          // Determine course completion: all lessons completed AND every
          // quiz attached to a lesson has at least one passing attempt for
          // this user. Course with no lessons => no certificate.
          const allLessons = await prisma.lesson.findMany({
            where: { module: { courseId } },
            select: { id: true, quiz: { select: { id: true } } },
          })
          const requiredLessonIds = allLessons.map((l) => l.id)
          const requiredQuizIds = allLessons
            .map((l) => l.quiz?.id)
            .filter((id): id is string => Boolean(id))

          const lessonsDone = await prisma.lessonProgress.count({
            where: {
              enrollmentId: enrollment.id,
              lessonId: { in: requiredLessonIds },
              completedAt: { not: null },
            },
          })

          let quizzesDone = 0
          if (requiredQuizIds.length > 0) {
            const passedRows = await prisma.quizAttempt.findMany({
              where: {
                userId,
                quizId: { in: requiredQuizIds },
                passed: true,
              },
              select: { quizId: true },
              distinct: ['quizId'],
            })
            quizzesDone = passedRows.length
          }

          const courseComplete =
            requiredLessonIds.length > 0 &&
            lessonsDone >= requiredLessonIds.length &&
            quizzesDone >= requiredQuizIds.length

          if (courseComplete) {
            const cert = await issueCertificate(userId, courseId)
            if (cert) {
              certificateIssued = true
              certificateId = cert.id
              certificateNumber = cert.certificateNumber
            }
          }
        }
      } catch (e) {
        // A downstream failure shouldn't void a legitimate pass — log only.
        console.error(
          '[submitQuizAttempt] post-pass propagation failed',
          e,
        )
      }
    }

    revalidatePath(`/dashboard/kursus/${courseSlug}`)
    revalidatePath('/dashboard/kursus')
    if (certificateIssued) revalidatePath('/dashboard/sertifikat')

    return {
      ok: true,
      score,
      passed,
      certificateIssued,
      certificateId,
      certificateNumber,
    }
  } catch (err) {
    console.error('[submitQuizAttempt] failed', err)
    return { ok: false, error: 'Gagal menyimpan jawaban. Coba lagi sebentar.' }
  }
}
