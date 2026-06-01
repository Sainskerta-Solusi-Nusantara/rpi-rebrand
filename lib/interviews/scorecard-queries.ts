import { cache } from 'react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  RECOMMENDATION_VALUES,
  isRecommendationValue,
  type RecommendationValue,
} from '@/lib/interviews/scorecard-defaults'

export type ScorecardRating = {
  criterion: string
  score: number
}

export type ScorecardAuthor = {
  id: string
  name: string | null
  email: string
  image: string | null
}

export type ScorecardForInterview = {
  id: string
  interviewId: string
  authorId: string
  author: ScorecardAuthor
  ratings: ScorecardRating[]
  notes: string | null
  recommendation: string
  averageScore: number | null
  createdAt: Date
  updatedAt: Date
}

export type ApplicationScorecardRow = ScorecardForInterview & {
  interview: {
    id: string
    scheduledAt: Date
    durationMin: number
    type: string
    status: string
    stageOrder: number
    stageName: string | null
  }
}

export type RecommendationCounts = Record<RecommendationValue, number>

export type ConsensusRecommendation =
  | RecommendationValue
  | 'split'
  | null

export type ApplicationScorecardAggregate = {
  interviews: ApplicationScorecardRow[]
  averageByCriterion: Record<string, number>
  recommendationCounts: RecommendationCounts
  consensusRecommendation: ConsensusRecommendation
  overallAverage: number | null
}

/**
 * Defensive Json -> typed ratings parser. The column is a Prisma `Json` so
 * anything could be sitting there. We silently drop malformed entries —
 * a busted row should never crash the recruiter dashboard.
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
    if (score < 1 || score > 5) continue
    out.push({ criterion, score: Math.round(score) })
  }
  return out
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return sum / values.length
}

function emptyRecommendationCounts(): RecommendationCounts {
  return {
    strong_hire: 0,
    hire: 0,
    no_hire: 0,
    strong_no_hire: 0,
  }
}

/**
 * Fetch a single scorecard scoped to its interview. Authorization rule:
 *  - Anonymous → null (no leak)
 *  - SUPERADMIN/ADMIN globally → allowed
 *  - Recruiter on the tenant that owns the application's job → allowed
 *    (fallback `job.update` since there's no dedicated `application.update`)
 *  - The author themselves → always allowed (even if they later lost role)
 *  - Otherwise null. Authorization failures are indistinguishable from
 *    "no scorecard exists" by design — we don't want to leak existence.
 */
export const getScorecardForInterview = cache(
  async (interviewId: string): Promise<ScorecardForInterview | null> => {
    if (!interviewId) return null
    const session = await auth()
    if (!session?.user?.id) return null

    const row = await prisma.interviewScorecard
      .findUnique({
        where: { interviewId },
        select: {
          id: true,
          interviewId: true,
          authorId: true,
          ratings: true,
          notes: true,
          recommendation: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          interview: {
            select: {
              application: { select: { tenantId: true } },
            },
          },
        },
      })
      .catch(() => null)
    if (!row) return null

    const tenantId = row.interview.application.tenantId
    const { globalRole, tenants, id: viewerId } = session.user
    const isAuthor = row.authorId === viewerId
    const isRecruiter = hasTenantPermission(
      globalRole,
      tenants,
      tenantId,
      'job.update',
    )
    if (!isAuthor && !isRecruiter) return null

    const ratings = parseRatings(row.ratings)
    return {
      id: row.id,
      interviewId: row.interviewId,
      authorId: row.authorId,
      author: row.author,
      ratings,
      notes: row.notes,
      recommendation: row.recommendation,
      averageScore: averageOf(ratings.map((r) => r.score)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  },
)

/**
 * List scorecards across every interview attached to an application,
 * sorted by `stageOrder` then `scheduledAt`. Interview metadata travels
 * with each row so summary views don't need a second query.
 *
 * Returns [] when the caller is not authorized rather than throwing —
 * the summary card just renders the empty state.
 */
export const getScorecardsForApplication = cache(
  async (applicationId: string): Promise<ApplicationScorecardRow[]> => {
    if (!applicationId) return []
    const session = await auth()
    if (!session?.user?.id) return []

    const application = await prisma.application
      .findUnique({
        where: { id: applicationId },
        select: { tenantId: true },
      })
      .catch(() => null)
    if (!application) return []

    const { globalRole, tenants } = session.user
    if (
      !hasTenantPermission(
        globalRole,
        tenants,
        application.tenantId,
        'job.update',
      )
    ) {
      return []
    }

    const interviews = await prisma.interviewSchedule
      .findMany({
        where: { applicationId },
        orderBy: [{ stageOrder: 'asc' }, { scheduledAt: 'asc' }],
        select: {
          id: true,
          scheduledAt: true,
          durationMin: true,
          type: true,
          status: true,
          stageOrder: true,
          stageName: true,
          scorecard: {
            select: {
              id: true,
              authorId: true,
              ratings: true,
              notes: true,
              recommendation: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      })
      .catch(() => [])

    const rows: ApplicationScorecardRow[] = []
    for (const iv of interviews) {
      if (!iv.scorecard) continue
      const ratings = parseRatings(iv.scorecard.ratings)
      rows.push({
        id: iv.scorecard.id,
        interviewId: iv.id,
        authorId: iv.scorecard.authorId,
        author: iv.scorecard.author,
        ratings,
        notes: iv.scorecard.notes,
        recommendation: iv.scorecard.recommendation,
        averageScore: averageOf(ratings.map((r) => r.score)),
        createdAt: iv.scorecard.createdAt,
        updatedAt: iv.scorecard.updatedAt,
        interview: {
          id: iv.id,
          scheduledAt: iv.scheduledAt,
          durationMin: iv.durationMin,
          type: iv.type,
          status: iv.status,
          stageOrder: iv.stageOrder,
          stageName: iv.stageName,
        },
      })
    }
    return rows
  },
)

/**
 * Reduce a tally of recommendations into a single consensus signal.
 * Rules (see CLAUDE comments on the task):
 *   - 0 scorecards → null
 *   - all same recommendation → that recommendation
 *   - only strong_hire + hire → 'hire'  (any positive blend collapses to hire)
 *   - only strong_no_hire + no_hire → 'no_hire'
 *   - any mix that crosses the positive/negative line → 'split'
 *
 * The "strong_*" collapsing is deliberate: a single dissenting hire vote
 * should not let "strong_hire" win for a panel where most voters disagree.
 */
export function deriveConsensus(
  counts: RecommendationCounts,
): ConsensusRecommendation {
  const total = RECOMMENDATION_VALUES.reduce((acc, k) => acc + counts[k], 0)
  if (total === 0) return null

  const positive = counts.strong_hire + counts.hire
  const negative = counts.no_hire + counts.strong_no_hire

  if (positive > 0 && negative > 0) return 'split'

  // All entries fall on the same side of the hire/no-hire line.
  const nonZero = RECOMMENDATION_VALUES.filter((k) => counts[k] > 0)
  if (nonZero.length === 1) return nonZero[0]!

  if (positive > 0) {
    // Mix limited to strong_hire + hire — soften to plain 'hire'.
    return 'hire'
  }
  // Mix limited to strong_no_hire + no_hire — soften to plain 'no_hire'.
  return 'no_hire'
}

/**
 * Aggregate every scorecard on an application into the numbers the summary
 * card renders: averages per criterion, recommendation tally, consensus
 * signal, and the overall flat average across all ratings.
 *
 * Cached for the lifetime of the request so the detail page can render the
 * summary + the per-interview list without re-querying.
 */
export const aggregateApplicationScorecards = cache(
  async (applicationId: string): Promise<ApplicationScorecardAggregate> => {
    const empty: ApplicationScorecardAggregate = {
      interviews: [],
      averageByCriterion: {},
      recommendationCounts: emptyRecommendationCounts(),
      consensusRecommendation: null,
      overallAverage: null,
    }
    if (!applicationId) return empty

    const interviews = await getScorecardsForApplication(applicationId)
    if (interviews.length === 0) return empty

    const allScores: number[] = []
    const perCriterion: Record<string, number[]> = {}
    const counts = emptyRecommendationCounts()

    for (const row of interviews) {
      for (const r of row.ratings) {
        allScores.push(r.score)
        const bucket = perCriterion[r.criterion] ?? []
        bucket.push(r.score)
        perCriterion[r.criterion] = bucket
      }
      if (isRecommendationValue(row.recommendation)) {
        counts[row.recommendation] += 1
      }
    }

    const averageByCriterion: Record<string, number> = {}
    for (const [criterion, scores] of Object.entries(perCriterion)) {
      const avg = averageOf(scores)
      if (avg !== null) averageByCriterion[criterion] = avg
    }

    return {
      interviews,
      averageByCriterion,
      recommendationCounts: counts,
      consensusRecommendation: deriveConsensus(counts),
      overallAverage: averageOf(allScores),
    }
  },
)
