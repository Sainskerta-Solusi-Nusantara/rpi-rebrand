import { prisma } from '@/lib/db'

/**
 * Recruiter-side full quiz fetch (includes isCorrect on every choice — used in
 * the curriculum editor's QuizEditor panel).
 */
export async function getQuizForLesson(lessonId: string) {
  if (!lessonId) return null
  return prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      lessonId: true,
      passingScore: true,
      shuffle: true,
      createdAt: true,
      updatedAt: true,
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
}

export type QuizForAttempt = {
  id: string
  passingScore: number
  shuffle: boolean
  questions: Array<{
    id: string
    text: string
    type: string
    choices: Array<{ id: string; text: string }>
  }>
  lastAttempt: {
    id: string
    score: number
    passed: boolean
    completedAt: Date | null
    startedAt: Date
  } | null
}

/**
 * Candidate-side quiz fetch — choices STRIPPED of isCorrect to avoid leaking
 * answers to the client. Also returns the latest attempt summary so the
 * caller can decide whether to autostart a new attempt.
 */
export async function getQuizForAttempt(
  quizId: string,
  userId: string,
): Promise<QuizForAttempt | null> {
  if (!quizId) return null
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
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
          choices: {
            orderBy: { order: 'asc' },
            select: { id: true, text: true },
          },
        },
      },
    },
  })
  if (!quiz) return null

  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: { quizId, userId },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      score: true,
      passed: true,
      startedAt: true,
      completedAt: true,
    },
  })

  return {
    id: quiz.id,
    passingScore: quiz.passingScore,
    shuffle: quiz.shuffle,
    questions: quiz.questions,
    lastAttempt,
  }
}

export async function getQuizAttemptHistory(
  userId: string,
  quizId: string,
  limit = 10,
) {
  if (!userId || !quizId) return []
  return prisma.quizAttempt.findMany({
    where: { userId, quizId },
    orderBy: { startedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      score: true,
      passed: true,
      startedAt: true,
      completedAt: true,
    },
  })
}
