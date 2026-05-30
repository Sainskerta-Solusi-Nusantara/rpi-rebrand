/**
 * Job Recommendations Engine — content-based scoring.
 *
 * For each PUBLISHED job (top 200 most-recent), the candidate is scored in
 * [0, 100] using five signals derived from the user profile + primary resume:
 *
 *   1. Skill overlap (40 pts max)
 *      Lowercase skills from primary Resume.content.skills are intersected
 *      with lowercase Job.tags. Score = min(40, overlap * 8).
 *
 *   2. Headline keyword match (20 pts max)
 *      Significant tokens from User.headline (>3 chars, no stopwords) are
 *      tested for inclusion in the lowercased Job.title.
 *      Score = min(20, matches * 4).
 *
 *   3. Location match (15 pts max)
 *      - 15: exact lowercase match (user.location === job.location)
 *      - 10: substring match either direction
 *      -  8: job.locationType === REMOTE
 *      -  0: otherwise
 *
 *   4. Recency boost (15 pts max)
 *      Based on Job.publishedAt:
 *      - 15: within last 7 days
 *      - 10: within last 30 days
 *      -  5: within last 90 days
 *      -  0: older or null
 *
 *   5. Experience-level alignment (10 pts max)
 *      Count seniority keywords ("senior", "lead", "principal", "manager",
 *      "head") in headline + resume experience titles.
 *      - > 0 hits → award 10 if job.experienceLevel is SENIOR/LEAD/EXECUTIVE
 *      - = 0 hits → award 10 if job.experienceLevel is JUNIOR/ENTRY/MID
 *
 * Sort desc by score, exclude jobs the user has already applied to (and any
 * additional excludeIds), and return the top N with score breakdown.
 *
 * Errors are swallowed — the helper returns an empty array on any failure.
 */

import { cache } from 'react'
import type {
  EmploymentType,
  ExperienceLevel,
  LocationType,
} from '@prisma/client'
import { prisma } from '@/lib/db'
import { tokenize } from './stopwords'

const CANDIDATE_POOL_LIMIT = 200
const SENIORITY_KEYWORDS = ['senior', 'lead', 'principal', 'manager', 'head']

export type RecommendedJobBreakdown = {
  skill: number
  headline: number
  location: number
  recency: number
  experience: number
}

export type RecommendedJob = {
  id: string
  title: string
  slug: string
  description: string
  location: string
  locationType: LocationType
  employmentType: EmploymentType
  experienceLevel: ExperienceLevel
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  tags: string[]
  publishedAt: Date | null
  createdAt: Date
  tenant: { name: string; slug: string }
  category: { name: string; slug: string } | null
  applicationsCount: number
  // Recommendation metadata
  score: number
  breakdown: RecommendedJobBreakdown
  matchedSkills: string[]
  totalUserSkills: number
}

type ResumeExperience = { title?: unknown }
type ResumeContent = {
  skills?: unknown
  languages?: unknown
  experiences?: unknown
  summary?: unknown
}

function extractResumeSkills(content: unknown): string[] {
  if (!content || typeof content !== 'object') return []
  const c = content as ResumeContent
  if (!Array.isArray(c.skills)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of c.skills) {
    if (typeof raw !== 'string') continue
    const norm = raw.trim().toLowerCase()
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    out.push(norm)
  }
  return out
}

function extractResumeExperienceTitles(content: unknown): string[] {
  if (!content || typeof content !== 'object') return []
  const c = content as ResumeContent
  if (!Array.isArray(c.experiences)) return []
  const out: string[] = []
  for (const exp of c.experiences) {
    if (!exp || typeof exp !== 'object') continue
    const t = (exp as ResumeExperience).title
    if (typeof t === 'string' && t.trim()) out.push(t.trim())
  }
  return out
}

function scoreSkills(
  userSkills: string[],
  jobTags: string[],
): { score: number; matched: string[] } {
  if (userSkills.length === 0 || jobTags.length === 0) {
    return { score: 0, matched: [] }
  }
  const userSet = new Set(userSkills)
  const matched: string[] = []
  for (const raw of jobTags) {
    const tag = raw.toLowerCase().trim()
    if (userSet.has(tag)) matched.push(tag)
  }
  return { score: Math.min(40, matched.length * 8), matched }
}

function scoreHeadline(headlineTokens: string[], jobTitle: string): number {
  if (headlineTokens.length === 0) return 0
  const title = jobTitle.toLowerCase()
  let hits = 0
  for (const tok of headlineTokens) {
    if (title.includes(tok)) hits++
  }
  return Math.min(20, hits * 4)
}

function scoreLocation(
  userLocation: string | null,
  jobLocation: string,
  jobLocationType: LocationType,
): number {
  const u = userLocation?.trim().toLowerCase() ?? ''
  const j = jobLocation.trim().toLowerCase()
  if (u && j) {
    if (u === j) return 15
    if (u.length >= 3 && (j.includes(u) || u.includes(j))) return 10
  }
  if (jobLocationType === 'REMOTE') return 8
  return 0
}

function scoreRecency(publishedAt: Date | null): number {
  if (!publishedAt) return 0
  const ageDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
  if (ageDays <= 7) return 15
  if (ageDays <= 30) return 10
  if (ageDays <= 90) return 5
  return 0
}

function scoreExperienceAlignment(
  seniorityHits: number,
  level: ExperienceLevel,
): number {
  const seniorLevels: ExperienceLevel[] = ['SENIOR', 'LEAD', 'EXECUTIVE']
  const juniorLevels: ExperienceLevel[] = ['ENTRY', 'JUNIOR', 'MID']
  if (seniorityHits > 0 && seniorLevels.includes(level)) return 10
  if (seniorityHits === 0 && juniorLevels.includes(level)) return 10
  return 0
}

export type RecommendJobsParams = {
  userId: string
  limit?: number
  excludeIds?: string[]
}

export const recommendJobsForUser = cache(
  async ({
    userId,
    limit = 10,
    excludeIds = [],
  }: RecommendJobsParams): Promise<RecommendedJob[]> => {
    try {
      const safeLimit = Math.max(1, Math.min(50, limit))

      // Batch-fetch everything we need in a single round-trip.
      const [user, primaryResume, applications, jobs] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { headline: true, location: true },
        }),
        prisma.resume.findFirst({
          where: { userId },
          orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
          select: { content: true },
        }),
        prisma.application.findMany({
          where: { userId },
          select: { jobId: true },
        }),
        prisma.job.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
          take: CANDIDATE_POOL_LIMIT,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            location: true,
            locationType: true,
            employmentType: true,
            experienceLevel: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            tags: true,
            publishedAt: true,
            createdAt: true,
            tenant: { select: { name: true, slug: true } },
            category: { select: { name: true, slug: true } },
            _count: { select: { applications: true } },
          },
        }),
      ])

      const appliedSet = new Set(applications.map((a) => a.jobId))
      const excludeSet = new Set(excludeIds)

      const userSkills = extractResumeSkills(primaryResume?.content)
      const headlineTokens = tokenize(user?.headline ?? null)
      const userLocation = user?.location ?? null

      // Count seniority signals across headline + resume experience titles.
      const seniorityHaystack = [
        (user?.headline ?? '').toLowerCase(),
        ...extractResumeExperienceTitles(primaryResume?.content).map((t) =>
          t.toLowerCase(),
        ),
      ].join(' ')
      const seniorityHits = SENIORITY_KEYWORDS.reduce(
        (acc, kw) => (seniorityHaystack.includes(kw) ? acc + 1 : acc),
        0,
      )

      const scored: RecommendedJob[] = []
      for (const job of jobs) {
        if (appliedSet.has(job.id) || excludeSet.has(job.id)) continue

        const skill = scoreSkills(userSkills, job.tags)
        const headline = scoreHeadline(headlineTokens, job.title)
        const location = scoreLocation(
          userLocation,
          job.location,
          job.locationType,
        )
        const recency = scoreRecency(job.publishedAt)
        const experience = scoreExperienceAlignment(
          seniorityHits,
          job.experienceLevel,
        )

        const total = skill.score + headline + location + recency + experience

        scored.push({
          id: job.id,
          title: job.title,
          slug: job.slug,
          description: job.description,
          location: job.location,
          locationType: job.locationType,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          tags: job.tags,
          publishedAt: job.publishedAt,
          createdAt: job.createdAt,
          tenant: job.tenant,
          category: job.category,
          applicationsCount: job._count.applications,
          score: total,
          breakdown: {
            skill: skill.score,
            headline,
            location,
            recency,
            experience,
          },
          matchedSkills: skill.matched,
          totalUserSkills: userSkills.length,
        })
      }

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        // Tie-break: prefer newer postings.
        const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime()
        const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime()
        return bTime - aTime
      })

      return scored.slice(0, safeLimit)
    } catch {
      return []
    }
  },
)

/**
 * Compact a breakdown into the top 2-3 contributing signals (for UI
 * "Why?" tooltips). Returns labels in Indonesian.
 */
export function topContributors(
  breakdown: RecommendedJobBreakdown,
): Array<{ label: string; value: number }> {
  const entries: Array<{ label: string; value: number }> = [
    { label: 'Kecocokan skill', value: breakdown.skill },
    { label: 'Kecocokan headline', value: breakdown.headline },
    { label: 'Kecocokan lokasi', value: breakdown.location },
    { label: 'Lowongan terbaru', value: breakdown.recency },
    { label: 'Tingkat pengalaman', value: breakdown.experience },
  ]
  return entries
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
}
