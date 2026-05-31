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

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

// =============================================================================
// startAssessmentAttempt
// =============================================================================

const startSchema = z.object({
  assessmentId: z.string().min(1, 'ID asesmen wajib diisi.'),
})

export type StartAssessmentAttemptPayload = {
  attemptId: string
  assessment: {
    id: string
    slug: string
    title: string
    passingScore: number
    durationMin: number
    questions: Array<{
      id: string
      text: string
      type: string
      choices: Array<{ id: string; text: string }>
    }>
  }
}

/**
 * Candidate-side: signed-in user starts an attempt against a PUBLISHED
 * assessment. We strip `isCorrect` from the returned questions so the client
 * can't peek at the answer key.
 */
export async function startAssessmentAttempt(input: {
  assessmentId: string
}): Promise<ActionResult<StartAssessmentAttemptPayload>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
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
  const { assessmentId } = parsed.data

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        slug: true,
        title: true,
        passingScore: true,
        durationMin: true,
        status: true,
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
    if (!assessment) return { ok: false, error: 'Asesmen tidak ditemukan.' }
    if (assessment.status !== 'PUBLISHED') {
      return {
        ok: false,
        error: 'Asesmen ini belum dipublikasikan.',
      }
    }
    if (assessment.questions.length === 0) {
      return { ok: false, error: 'Asesmen ini belum memiliki pertanyaan.' }
    }

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId,
        assessmentId,
        answers: [] as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId,
        action: AuditAction.CREATE,
        resource: 'assessment.attempt',
        resourceId: attempt.id,
        metadata: {
          assessmentId,
          slug: assessment.slug,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    return {
      ok: true,
      data: {
        attemptId: attempt.id,
        assessment: {
          id: assessment.id,
          slug: assessment.slug,
          title: assessment.title,
          passingScore: assessment.passingScore,
          durationMin: assessment.durationMin,
          questions: assessment.questions,
        },
      },
    }
  } catch (err) {
    console.error('[startAssessmentAttempt] failed', err)
    return { ok: false, error: 'Gagal memulai asesmen. Coba lagi sebentar.' }
  }
}

// =============================================================================
// submitAssessmentAttempt
// =============================================================================

const answerSchema = z.object({
  questionId: z.string().min(1),
  choiceIds: z.array(z.string().min(1)),
})

const submitSchema = z.object({
  attemptId: z.string().min(1, 'ID percobaan wajib diisi.'),
  answers: z.array(answerSchema),
})

export type SubmitAssessmentAttemptResult = {
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
}

/**
 * Score + finalise the attempt. Algorithm matches Quiz:
 *   - 1 point per question; final score = round(points/total * 100)
 *   - multiple_choice/true_false: exactly 1 pick, must match the correct id
 *   - multi_select: user's choice set must EQUAL the correct set (no partial)
 *   - passed iff score >= assessment.passingScore
 */
export async function submitAssessmentAttempt(input: {
  attemptId: string
  answers: Array<{ questionId: string; choiceIds: string[] }>
}): Promise<ActionResult<SubmitAssessmentAttemptResult>> {
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
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        assessmentId: true,
        completedAt: true,
        assessment: {
          select: {
            id: true,
            slug: true,
            passingScore: true,
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

    const questions = attempt.assessment.questions
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
        if (userPicked.size === 1) {
          const onlyId = userPicked.values().next().value as string
          if (correctIds.has(onlyId)) correctCount++
        }
      }
    }

    const score =
      totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100)
    const passed = score >= attempt.assessment.passingScore

    await prisma.assessmentAttempt.update({
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
        tenantId: null,
        userId,
        action: AuditAction.UPDATE,
        resource: 'assessment.attempt',
        resourceId: attempt.id,
        metadata: {
          assessmentId: attempt.assessmentId,
          score,
          passed,
          correctCount,
          totalCount,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard/assesmen')
    revalidatePath(`/dashboard/assesmen/${attempt.assessment.slug}`)

    return {
      ok: true,
      data: { score, passed, correctCount, totalCount },
    }
  } catch (err) {
    console.error('[submitAssessmentAttempt] failed', err)
    return { ok: false, error: 'Gagal menyimpan jawaban. Coba lagi sebentar.' }
  }
}

// =============================================================================
// getMyPassedAssessmentBadges — public-profile badge list
// =============================================================================

export type PassedAssessmentBadge = {
  assessmentSlug: string
  title: string
  category: string
  score: number
  passedAt: Date
}

/**
 * Return one badge per assessment the user has PASSED, using their
 * highest-scoring passing attempt. Cheap enough to call from the public
 * profile page; no auth (server-only) — caller decides if the user is public.
 */
export async function getMyPassedAssessmentBadges(
  userId: string,
): Promise<PassedAssessmentBadge[]> {
  if (!userId) return []
  try {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        userId,
        passed: true,
        completedAt: { not: null },
      },
      orderBy: [{ score: 'desc' }, { completedAt: 'desc' }],
      select: {
        score: true,
        completedAt: true,
        assessment: {
          select: { slug: true, title: true, category: true, status: true },
        },
      },
    })

    const seen = new Set<string>()
    const out: PassedAssessmentBadge[] = []
    for (const a of attempts) {
      // Hide badges for archived/draft assessments (e.g. recalled exams).
      if (a.assessment.status !== 'PUBLISHED') continue
      if (seen.has(a.assessment.slug)) continue
      seen.add(a.assessment.slug)
      out.push({
        assessmentSlug: a.assessment.slug,
        title: a.assessment.title,
        category: a.assessment.category,
        score: a.score,
        passedAt: a.completedAt ?? new Date(),
      })
    }
    return out
  } catch (err) {
    console.error('[getMyPassedAssessmentBadges] failed', err)
    return []
  }
}
