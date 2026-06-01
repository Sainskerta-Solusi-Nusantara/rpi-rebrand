import { cache } from 'react'
import { prisma } from '@/lib/db'
import type { JobQuestionType } from '@/lib/jobs/question-actions'

export type JobQuestionRow = {
  id: string
  jobId: string
  label: string
  type: JobQuestionType
  required: boolean
  options: string[] | null
  helpText: string | null
  order: number
}

export type ApplicationAnswerRow = {
  id: string
  questionId: string
  value: string
  question: {
    id: string
    label: string
    type: JobQuestionType
    options: string[] | null
    helpText: string | null
    order: number
  }
}

function parseOptions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string') out.push(item)
  }
  return out
}

/**
 * Fetch custom questions for a single job, ordered by `order` ascending so the
 * candidate renderer can iterate without re-sorting.
 */
export const getJobQuestions = cache(
  async (jobId: string): Promise<JobQuestionRow[]> => {
    if (!jobId) return []
    try {
      const rows = await prisma.jobQuestion.findMany({
        where: { jobId },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          jobId: true,
          label: true,
          type: true,
          required: true,
          options: true,
          helpText: true,
          order: true,
        },
      })
      return rows.map((r) => ({
        id: r.id,
        jobId: r.jobId,
        label: r.label,
        type: r.type as JobQuestionType,
        required: r.required,
        options: parseOptions(r.options),
        helpText: r.helpText,
        order: r.order,
      }))
    } catch (err) {
      console.error('[getJobQuestions] failed', err)
      return []
    }
  },
)

/**
 * Fetch a candidate's answers for an application together with their question
 * metadata so the recruiter detail view can render labels + formatted values
 * in one pass.
 */
export const getApplicationAnswers = cache(
  async (applicationId: string): Promise<ApplicationAnswerRow[]> => {
    if (!applicationId) return []
    try {
      const rows = await prisma.applicationAnswer.findMany({
        where: { applicationId },
        orderBy: { question: { order: 'asc' } },
        select: {
          id: true,
          questionId: true,
          value: true,
          question: {
            select: {
              id: true,
              label: true,
              type: true,
              options: true,
              helpText: true,
              order: true,
            },
          },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        value: r.value,
        question: {
          id: r.question.id,
          label: r.question.label,
          type: r.question.type as JobQuestionType,
          options: parseOptions(r.question.options),
          helpText: r.question.helpText,
          order: r.question.order,
        },
      }))
    } catch (err) {
      console.error('[getApplicationAnswers] failed', err)
      return []
    }
  },
)
