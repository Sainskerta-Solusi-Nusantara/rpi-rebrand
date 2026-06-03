import { cache } from 'react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { parseQueryTerms } from '@/lib/search/relevance'

const DEFAULT_PAGE_SIZE = 12

export type ListedAssessment = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  durationMin: number
  passingScore: number
  status: string
  createdAt: Date
  questionCount: number
}

export type ListPublishedAssessmentsResult = {
  items: ListedAssessment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Public catalog listing — only PUBLISHED assessments are returned.
 * Filterable by category + free-text on title/description.
 */
export const listPublishedAssessments = cache(
  async (params: {
    category?: string
    query?: string
    page?: number
    pageSize?: number
  }): Promise<ListPublishedAssessmentsResult> => {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.max(1, Math.min(50, params.pageSize ?? DEFAULT_PAGE_SIZE))

    const terms = parseQueryTerms(params.query)
    const where: Prisma.AssessmentWhereInput = {
      status: 'PUBLISHED',
      ...(params.category ? { category: params.category } : {}),
      ...(terms.length
        ? {
            AND: terms.map((term) => ({
              OR: [
                { title: { contains: term, mode: 'insensitive' as const } },
                { description: { contains: term, mode: 'insensitive' as const } },
              ],
            })),
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          durationMin: true,
          passingScore: true,
          status: true,
          createdAt: true,
          _count: { select: { questions: true } },
        },
      }),
      prisma.assessment.count({ where }),
    ])

    const items: ListedAssessment[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      durationMin: r.durationMin,
      passingScore: r.passingScore,
      status: r.status,
      createdAt: r.createdAt,
      questionCount: r._count.questions,
    }))

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    return { items, total, page, pageSize, totalPages }
  },
)

export type AssessmentDetail = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  durationMin: number
  passingScore: number
  status: string
  questionCount: number
  createdAt: Date
}

/**
 * Look up a single PUBLISHED assessment by slug for the candidate intro page.
 * (We still return DRAFT/ARCHIVED ones — the page decides whether to render,
 * so admins previewing draft URLs can verify before publishing.)
 */
export const getAssessmentBySlug = cache(
  async (slug: string): Promise<AssessmentDetail | null> => {
    if (!slug) return null
    const a = await prisma.assessment.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        durationMin: true,
        passingScore: true,
        status: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    })
    if (!a) return null
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      category: a.category,
      durationMin: a.durationMin,
      passingScore: a.passingScore,
      status: a.status,
      questionCount: a._count.questions,
      createdAt: a.createdAt,
    }
  },
)

export type AssessmentForAttempt = {
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

/**
 * Candidate-side fetch of the assessment + questions, with `isCorrect`
 * stripped. Used to hydrate the AssessmentTaker for an in-flight attempt.
 */
export const getAssessmentForAttempt = cache(
  async (
    assessmentId: string,
    _userId: string,
  ): Promise<AssessmentForAttempt | null> => {
    if (!assessmentId) return null
    const a = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        slug: true,
        title: true,
        passingScore: true,
        durationMin: true,
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
    if (!a) return null
    return a
  },
)

export type AttemptHistoryRow = {
  id: string
  score: number
  passed: boolean
  startedAt: Date
  completedAt: Date | null
}

export const getAttemptHistory = cache(
  async (
    userId: string,
    assessmentId: string,
    limit = 10,
  ): Promise<AttemptHistoryRow[]> => {
    if (!userId || !assessmentId) return []
    return prisma.assessmentAttempt.findMany({
      where: { userId, assessmentId },
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
  },
)

/**
 * Find an in-flight attempt (no completedAt) for the given user + assessment
 * so the intro page can offer "Lanjutkan" instead of starting a new one.
 */
export const getActiveAttempt = cache(
  async (
    userId: string,
    assessmentId: string,
  ): Promise<{ id: string; startedAt: Date } | null> => {
    if (!userId || !assessmentId) return null
    const row = await prisma.assessmentAttempt.findFirst({
      where: { userId, assessmentId, completedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true, startedAt: true },
    })
    return row
  },
)

/**
 * Best (highest-score) PASSED attempt for the user on this assessment, used
 * to render the "Sertifikat" card on the intro page.
 */
export const getBestPassedAttempt = cache(
  async (
    userId: string,
    assessmentId: string,
  ): Promise<{ id: string; score: number; completedAt: Date | null } | null> => {
    if (!userId || !assessmentId) return null
    const row = await prisma.assessmentAttempt.findFirst({
      where: { userId, assessmentId, passed: true },
      orderBy: [{ score: 'desc' }, { completedAt: 'desc' }],
      select: { id: true, score: true, completedAt: true },
    })
    return row
  },
)

// =============================================================================
// Admin queries
// =============================================================================

export type AdminAssessmentRow = ListedAssessment & {
  attemptCount: number
}

export type ListAdminAssessmentsResult = {
  items: AdminAssessmentRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listAdminAssessments(params: {
  status?: string
  category?: string
  query?: string
  page?: number
  pageSize?: number
}): Promise<ListAdminAssessmentsResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.max(1, Math.min(50, params.pageSize ?? 20))

  const terms = parseQueryTerms(params.query)
  const and: Prisma.AssessmentWhereInput[] = []
  for (const term of terms) {
    and.push({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
      ],
    })
  }

  const where: Prisma.AssessmentWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(and.length ? { AND: and } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        durationMin: true,
        passingScore: true,
        status: true,
        createdAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.assessment.count({ where }),
  ])

  return {
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      durationMin: r.durationMin,
      passingScore: r.passingScore,
      status: r.status,
      createdAt: r.createdAt,
      questionCount: r._count.questions,
      attemptCount: r._count.attempts,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
