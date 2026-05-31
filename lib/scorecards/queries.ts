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

export type StageInterviewSummary = {
  id: string
  scheduledAt: Date
  status: string
  type: string
  scorecard: {
    recommendation: string
    averageScore: number | null
  } | null
}

export type PipelineStageSummary = {
  stageOrder: number
  stageName: string | null
  interviews: StageInterviewSummary[]
  scorecardCount: number
  averageScore: number | null
  recommendationTally: Record<string, number>
}

export type PipelineOverallRecommendation =
  | 'strong_hire'
  | 'hire'
  | 'no_hire'
  | 'strong_no_hire'
  | null

export type PipelineSummary = {
  stages: PipelineStageSummary[]
  overallRecommendation: PipelineOverallRecommendation
}

const POSITIVE_RECOMMENDATIONS = new Set(['strong_hire', 'hire'])
const NEGATIVE_RECOMMENDATIONS = new Set(['strong_no_hire', 'no_hire'])

/**
 * Reduce a stage's recommendation tally to a single signal. We weight
 * "strong_*" over plain hire/no_hire so a single decisive scorecard can
 * dominate a noisy stage.
 */
function dominantStageSignal(
  tally: Record<string, number>,
): 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | null {
  const total = Object.values(tally).reduce((acc, v) => acc + v, 0)
  if (total === 0) return null
  if ((tally.strong_no_hire ?? 0) > 0) return 'strong_no_hire'
  if ((tally.strong_hire ?? 0) > 0 && (tally.no_hire ?? 0) === 0)
    return 'strong_hire'
  const hires = tally.hire ?? 0
  const noHires = tally.no_hire ?? 0
  if (hires > noHires) return 'hire'
  if (noHires > hires) return 'no_hire'
  // Tie — lean to the more conservative signal so we don't overpromise.
  return 'no_hire'
}

/**
 * Aggregate scorecards per stage for the pipeline view. Always returns a
 * stage row for every distinct stageOrder that has interviews — empty
 * stages render as "Belum dijadwalkan" in the UI.
 *
 * Overall recommendation heuristic:
 *  - any "strong_no_hire" signal anywhere → strong_no_hire
 *  - otherwise, if any "strong_hire" stage and no negative stages → strong_hire
 *  - otherwise majority wins (positive vs negative stage signals)
 *  - null when there are fewer than 2 scorecards total (not enough signal)
 */
export const summarizePipelineByStage = cache(
  async (applicationId: string): Promise<PipelineSummary> => {
    const empty: PipelineSummary = {
      stages: [],
      overallRecommendation: null,
    }
    if (!applicationId) return empty

    try {
      const interviews = await prisma.interviewSchedule.findMany({
        where: { applicationId },
        orderBy: [{ stageOrder: 'asc' }, { scheduledAt: 'asc' }],
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          type: true,
          stageOrder: true,
          stageName: true,
          scorecard: {
            select: {
              ratings: true,
              recommendation: true,
            },
          },
        },
      })

      // Group by stageOrder. Stage name resolves to the first non-null name
      // we encounter for that order (stable thanks to the asc sort above).
      const buckets = new Map<
        number,
        {
          stageName: string | null
          interviews: StageInterviewSummary[]
          scores: number[]
          tally: Record<string, number>
        }
      >()

      for (const iv of interviews) {
        const bucket = buckets.get(iv.stageOrder) ?? {
          stageName: iv.stageName,
          interviews: [],
          scores: [],
          tally: {},
        }
        if (!bucket.stageName && iv.stageName) bucket.stageName = iv.stageName

        let cardSummary: StageInterviewSummary['scorecard'] = null
        if (iv.scorecard) {
          const ratings = parseRatings(iv.scorecard.ratings)
          const avg = averageOf(ratings.map((r) => r.score))
          cardSummary = {
            recommendation: iv.scorecard.recommendation,
            averageScore: avg,
          }
          for (const r of ratings) bucket.scores.push(r.score)
          const rec = iv.scorecard.recommendation
          bucket.tally[rec] = (bucket.tally[rec] ?? 0) + 1
        }

        bucket.interviews.push({
          id: iv.id,
          scheduledAt: iv.scheduledAt,
          status: iv.status,
          type: iv.type,
          scorecard: cardSummary,
        })
        buckets.set(iv.stageOrder, bucket)
      }

      const stages: PipelineStageSummary[] = Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([stageOrder, bucket]) => {
          const scorecardCount = Object.values(bucket.tally).reduce(
            (acc, v) => acc + v,
            0,
          )
          return {
            stageOrder,
            stageName: bucket.stageName,
            interviews: bucket.interviews,
            scorecardCount,
            averageScore: averageOf(bucket.scores),
            recommendationTally: bucket.tally,
          }
        })

      // Compute overall signal across stages.
      let positiveStages = 0
      let negativeStages = 0
      let hasStrongHire = false
      let hasStrongNoHire = false
      let totalScorecards = 0
      for (const stage of stages) {
        totalScorecards += stage.scorecardCount
        const signal = dominantStageSignal(stage.recommendationTally)
        if (signal === 'strong_no_hire') hasStrongNoHire = true
        if (signal === 'strong_hire') hasStrongHire = true
        if (signal && POSITIVE_RECOMMENDATIONS.has(signal)) positiveStages += 1
        if (signal && NEGATIVE_RECOMMENDATIONS.has(signal)) negativeStages += 1
      }

      let overall: PipelineOverallRecommendation = null
      if (totalScorecards >= 2) {
        if (hasStrongNoHire) {
          overall = 'strong_no_hire'
        } else if (hasStrongHire && negativeStages === 0) {
          overall = 'strong_hire'
        } else if (positiveStages > negativeStages) {
          overall = 'hire'
        } else if (negativeStages > positiveStages) {
          overall = 'no_hire'
        } else if (positiveStages > 0 || negativeStages > 0) {
          // Tie — be conservative.
          overall = 'no_hire'
        }
      }

      return { stages, overallRecommendation: overall }
    } catch {
      return empty
    }
  },
)
