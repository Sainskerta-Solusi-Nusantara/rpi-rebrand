import { cache } from 'react'
import { prisma } from '@/lib/db'

export type ScorecardRating = {
  criterion: string
  score: number
}

export type ScorecardAuthorSummary = {
  id: string
  name: string | null
  email: string
  image: string | null
}

export type ScorecardDetail = {
  id: string
  interviewId: string
  ratings: ScorecardRating[]
  notes: string | null
  recommendation: string
  createdAt: Date
  updatedAt: Date
  author: ScorecardAuthorSummary
}

export type ScorecardSummaryItem = {
  interviewId: string
  scheduledAt: Date
  author: ScorecardAuthorSummary
  recommendation: string
  averageScore: number | null
  ratingsCount: number
}

export type ApplicationScorecardSummary = {
  count: number
  averageScore: number | null
  breakdownByCriterion: Record<string, number>
  recommendations: Record<string, number>
  individualScorecards: ScorecardSummaryItem[]
}

/**
 * Safely coerce the Json `ratings` column into a typed array. Anything that
 * can't be normalised is dropped — we never want a malformed entry to crash
 * the recruiter view.
 */
function parseRatings(value: unknown): ScorecardRating[] {
  if (!Array.isArray(value)) return []
  const out: ScorecardRating[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const criterion =
      typeof rec.criterion === 'string' ? rec.criterion.trim() : ''
    const scoreRaw = rec.score
    const score =
      typeof scoreRaw === 'number'
        ? scoreRaw
        : typeof scoreRaw === 'string'
          ? Number(scoreRaw)
          : NaN
    if (!criterion) continue
    if (!Number.isFinite(score)) continue
    out.push({ criterion, score })
  }
  return out
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return sum / values.length
}

/**
 * Fetches the scorecard for a single interview (if any) including author
 * profile shorthand. Cached for the lifetime of the request so multiple
 * components on the same page can call it safely.
 */
export const getScorecardForInterview = cache(
  async (interviewId: string): Promise<ScorecardDetail | null> => {
    if (!interviewId) return null
    try {
      const row = await prisma.interviewScorecard.findUnique({
        where: { interviewId },
        select: {
          id: true,
          interviewId: true,
          ratings: true,
          notes: true,
          recommendation: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      })
      if (!row) return null
      return {
        id: row.id,
        interviewId: row.interviewId,
        ratings: parseRatings(row.ratings),
        notes: row.notes,
        recommendation: row.recommendation,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: row.author,
      }
    } catch {
      return null
    }
  },
)

/**
 * Aggregates scorecards across every interview attached to an application.
 * Used by the recruiter detail view to surface an at-a-glance hire signal.
 */
export const summarizeApplicationScorecards = cache(
  async (applicationId: string): Promise<ApplicationScorecardSummary> => {
    const empty: ApplicationScorecardSummary = {
      count: 0,
      averageScore: null,
      breakdownByCriterion: {},
      recommendations: {},
      individualScorecards: [],
    }
    if (!applicationId) return empty

    try {
      const interviews = await prisma.interviewSchedule.findMany({
        where: { applicationId },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          scheduledAt: true,
          scorecard: {
            select: {
              id: true,
              ratings: true,
              recommendation: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      const allScores: number[] = []
      const breakdownAcc: Record<string, number[]> = {}
      const recommendations: Record<string, number> = {}
      const individualScorecards: ScorecardSummaryItem[] = []

      for (const iv of interviews) {
        if (!iv.scorecard) continue
        const ratings = parseRatings(iv.scorecard.ratings)
        const cardScores = ratings.map((r) => r.score)
        for (const r of ratings) {
          allScores.push(r.score)
          const bucket = breakdownAcc[r.criterion] ?? []
          bucket.push(r.score)
          breakdownAcc[r.criterion] = bucket
        }
        const rec = iv.scorecard.recommendation
        recommendations[rec] = (recommendations[rec] ?? 0) + 1
        individualScorecards.push({
          interviewId: iv.id,
          scheduledAt: iv.scheduledAt,
          author: iv.scorecard.author,
          recommendation: rec,
          averageScore: averageOf(cardScores),
          ratingsCount: ratings.length,
        })
      }

      const breakdownByCriterion: Record<string, number> = {}
      for (const [criterion, scores] of Object.entries(breakdownAcc)) {
        const avg = averageOf(scores)
        if (avg !== null) breakdownByCriterion[criterion] = avg
      }

      return {
        count: individualScorecards.length,
        averageScore: averageOf(allScores),
        breakdownByCriterion,
        recommendations,
        individualScorecards,
      }
    } catch {
      return empty
    }
  },
)
