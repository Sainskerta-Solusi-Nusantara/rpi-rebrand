import { cache } from 'react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type QuestionSummary = {
  id: string
  tenantId: string
  text: string
  category: string
  difficulty: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string | null
    email: string
  } | null
}

export type ListQuestionsResult = {
  items: QuestionSummary[]
  total: number
  page: number
  pageSize: number
}

/**
 * Paginated list of interview questions for a tenant. All filter args are
 * optional; falsy values are dropped before hitting Prisma so an empty query
 * still returns the full set ordered by recency.
 */
export const listQuestions = cache(
  async ({
    tenantId,
    category,
    difficulty,
    query,
    tags,
    page = 1,
    pageSize = 25,
  }: {
    tenantId: string
    category?: string
    difficulty?: number
    query?: string
    tags?: string[]
    page?: number
    pageSize?: number
  }): Promise<ListQuestionsResult> => {
    const safePage = Math.max(1, Math.floor(page) || 1)
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 25))
    const empty: ListQuestionsResult = {
      items: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
    }
    if (!tenantId) return empty

    try {
      const where: Prisma.InterviewQuestionWhereInput = { tenantId }
      if (category) where.category = category
      if (typeof difficulty === 'number' && Number.isFinite(difficulty)) {
        where.difficulty = difficulty
      }
      if (query && query.trim()) {
        where.text = { contains: query.trim(), mode: 'insensitive' }
      }
      if (tags && tags.length > 0) {
        // Match any of the requested tags (OR semantics is friendlier for
        // recruiters skimming an evolving taxonomy).
        where.tags = { hasSome: tags }
      }

      const [rows, total] = await Promise.all([
        prisma.interviewQuestion.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (safePage - 1) * safePageSize,
          take: safePageSize,
          select: {
            id: true,
            tenantId: true,
            text: true,
            category: true,
            difficulty: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.interviewQuestion.count({ where }),
      ])

      return {
        items: rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          text: r.text,
          category: r.category,
          difficulty: r.difficulty,
          tags: r.tags,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          createdBy: r.createdBy,
        })),
        total,
        page: safePage,
        pageSize: safePageSize,
      }
    } catch (err) {
      console.error('[listQuestions] failed', err)
      return empty
    }
  },
)

/**
 * Picks a random subset of questions scoped to the tenant that owns the given
 * interview. Returns an empty list (rather than throwing) if anything is off —
 * the suggested-questions block in the schedule form is a nice-to-have.
 */
export const getQuestionSetForInterview = cache(
  async ({
    interviewId,
    categories,
    difficultyRange,
    count = 5,
  }: {
    interviewId: string
    categories?: string[]
    difficultyRange?: [number, number]
    count?: number
  }): Promise<QuestionSummary[]> => {
    const safeCount = Math.min(20, Math.max(1, Math.floor(count) || 5))
    if (!interviewId) return []

    try {
      const interview = await prisma.interviewSchedule
        .findUnique({
          where: { id: interviewId },
          select: { application: { select: { tenantId: true } } },
        })
        .catch(() => null)
      const tenantId = interview?.application?.tenantId
      if (!tenantId) return []

      const where: Prisma.InterviewQuestionWhereInput = { tenantId }
      if (categories && categories.length > 0) {
        where.category = { in: categories }
      }
      if (difficultyRange) {
        const [min, max] = difficultyRange
        const lo = Number.isFinite(min) ? Math.max(1, Math.floor(min)) : 1
        const hi = Number.isFinite(max) ? Math.min(5, Math.floor(max)) : 5
        where.difficulty = { gte: lo, lte: hi }
      }

      // Random sampling: pull a wider window then shuffle in JS so we stay
      // portable across Postgres versions (no ORDER BY RANDOM() reliance for
      // huge tables — at this scale we cap at 200 candidates).
      const candidates = await prisma.interviewQuestion.findMany({
        where,
        take: 200,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          tenantId: true,
          text: true,
          category: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      })

      if (candidates.length <= safeCount) {
        return candidates.map((c) => ({ ...c }))
      }

      // Fisher–Yates partial shuffle for unbiased random pick.
      const arr = candidates.slice()
      for (let i = arr.length - 1; i > arr.length - 1 - safeCount; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = arr[i]
        const swap = arr[j]
        if (tmp !== undefined && swap !== undefined) {
          arr[i] = swap
          arr[j] = tmp
        }
      }
      return arr.slice(arr.length - safeCount).map((c) => ({ ...c }))
    } catch (err) {
      console.error('[getQuestionSetForInterview] failed', err)
      return []
    }
  },
)

/**
 * Random pick for a *new* interview (no row yet) scoped by tenantId, used by
 * the schedule form server component which only knows the applicationId at
 * render time. Mirrors getQuestionSetForInterview semantics.
 */
export const getQuestionSetForTenant = cache(
  async ({
    tenantId,
    categories,
    difficultyRange,
    count = 5,
  }: {
    tenantId: string
    categories?: string[]
    difficultyRange?: [number, number]
    count?: number
  }): Promise<QuestionSummary[]> => {
    const safeCount = Math.min(20, Math.max(1, Math.floor(count) || 5))
    if (!tenantId) return []

    try {
      const where: Prisma.InterviewQuestionWhereInput = { tenantId }
      if (categories && categories.length > 0) {
        where.category = { in: categories }
      }
      if (difficultyRange) {
        const [min, max] = difficultyRange
        const lo = Number.isFinite(min) ? Math.max(1, Math.floor(min)) : 1
        const hi = Number.isFinite(max) ? Math.min(5, Math.floor(max)) : 5
        where.difficulty = { gte: lo, lte: hi }
      }

      const candidates = await prisma.interviewQuestion.findMany({
        where,
        take: 200,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          tenantId: true,
          text: true,
          category: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      })

      if (candidates.length <= safeCount) {
        return candidates.map((c) => ({ ...c }))
      }

      const arr = candidates.slice()
      for (let i = arr.length - 1; i > arr.length - 1 - safeCount; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = arr[i]
        const swap = arr[j]
        if (tmp !== undefined && swap !== undefined) {
          arr[i] = swap
          arr[j] = tmp
        }
      }
      return arr.slice(arr.length - safeCount).map((c) => ({ ...c }))
    } catch (err) {
      console.error('[getQuestionSetForTenant] failed', err)
      return []
    }
  },
)
