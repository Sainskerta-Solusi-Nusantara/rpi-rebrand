/**
 * Candidate-side quiz queries (singular `quiz` namespace).
 *
 * These helpers are used by the lesson player and the QuizRunner client
 * component. They are deliberately separate from `lib/quizzes/` (plural) —
 * the latter is the recruiter-side editor namespace.
 *
 * Choices NEVER expose `isCorrect` to candidates. All reads are cached for
 * the React render lifecycle via `react.cache`.
 */

import { cache } from 'react'
import { prisma } from '@/lib/db'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type QuizChoiceLite = {
  id: string
  text: string
}

export type QuizQuestionLite = {
  id: string
  text: string
  type: string // multiple_choice | true_false | multi_select
  order: number
  choices: QuizChoiceLite[]
}

export type QuizWithQuestions = {
  id: string
  lessonId: string
  passingScore: number
  shuffle: boolean
  questions: QuizQuestionLite[]
}

export type QuizAttemptSummary = {
  id: string
  score: number
  passed: boolean
  startedAt: Date
  completedAt: Date | null
}

export type CourseProgress = {
  totalLessons: number
  completedLessons: number
  percent: number
  passedQuizzes: number
  totalQuizzes: number
  certificate: {
    id: string
    certificateNumber: string | null
    fileUrl: string
    issuedAt: Date
  } | null
}

// -----------------------------------------------------------------------------
// Fisher-Yates shuffle (pure copy)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

/**
 * Returns the quiz attached to a lesson, with questions + choices ordered.
 * When `quiz.shuffle` is true we randomise question order AND choice order
 * on every call so candidates can't memorise positions across retries.
 *
 * Choices are returned WITHOUT `isCorrect` — that flag is recruiter-only
 * and is fetched inside `submitQuizAttempt` from the trusted DB row, never
 * trusting the client payload.
 */
export const getQuizForLesson = cache(async function getQuizForLesson(
  lessonId: string,
): Promise<QuizWithQuestions | null> {
  if (!lessonId) return null
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      lessonId: true,
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
            select: { id: true, text: true },
          },
        },
      },
    },
  })
  if (!quiz) return null

  const questions: QuizQuestionLite[] = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    order: q.order,
    choices: quiz.shuffle ? shuffle(q.choices) : q.choices.slice(),
  }))

  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    passingScore: quiz.passingScore,
    shuffle: quiz.shuffle,
    questions: quiz.shuffle ? shuffle(questions) : questions,
  }
})

/**
 * All attempts by a user against a quiz, newest first.
 */
export const getQuizAttemptsForUser = cache(async function getQuizAttemptsForUser(
  userId: string,
  quizId: string,
): Promise<QuizAttemptSummary[]> {
  if (!userId || !quizId) return []
  const rows = await prisma.quizAttempt.findMany({
    where: { userId, quizId },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      score: true,
      passed: true,
      startedAt: true,
      completedAt: true,
    },
  })
  return rows
})

/**
 * Latest single attempt (by startedAt desc), or null if none.
 */
export const getLatestAttempt = cache(async function getLatestAttempt(
  userId: string,
  quizId: string,
): Promise<QuizAttemptSummary | null> {
  if (!userId || !quizId) return null
  const row = await prisma.quizAttempt.findFirst({
    where: { userId, quizId },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      score: true,
      passed: true,
      startedAt: true,
      completedAt: true,
    },
  })
  return row
})

/**
 * Aggregate course progress for a user: lesson counts, quiz pass counts,
 * and the issued certificate row if any.
 *
 * Lesson totals are sourced from the course's modules (Module -> Lesson).
 * Quiz totals are the count of Quiz rows attached to those lessons; a quiz
 * is "passed" if there exists at least one QuizAttempt for the user with
 * passed=true.
 */
export const getCourseProgress = cache(async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<CourseProgress> {
  if (!userId || !courseId) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
      passedQuizzes: 0,
      totalQuizzes: 0,
      certificate: null,
    }
  }

  const [enrollment, lessons, certificate] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
    prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true, quiz: { select: { id: true } } },
    }),
    prisma.certificate.findFirst({
      where: { userId, courseId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        certificateNumber: true,
        fileUrl: true,
        issuedAt: true,
      },
    }),
  ])

  const totalLessons = lessons.length
  const lessonIds = lessons.map((l) => l.id)
  const quizIds = lessons
    .map((l) => l.quiz?.id)
    .filter((id): id is string => Boolean(id))
  const totalQuizzes = quizIds.length

  let completedLessons = 0
  let passedQuizzes = 0

  if (enrollment && lessonIds.length > 0) {
    completedLessons = await prisma.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        lessonId: { in: lessonIds },
        completedAt: { not: null },
      },
    })
  }

  if (quizIds.length > 0) {
    const passedRows = await prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds }, passed: true },
      select: { quizId: true },
      distinct: ['quizId'],
    })
    passedQuizzes = passedRows.length
  }

  const percent =
    totalLessons === 0
      ? 0
      : Math.min(100, Math.round((completedLessons / totalLessons) * 100))

  return {
    totalLessons,
    completedLessons,
    percent,
    passedQuizzes,
    totalQuizzes,
    certificate,
  }
})
