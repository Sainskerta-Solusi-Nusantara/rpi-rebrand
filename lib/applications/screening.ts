/**
 * AI Auto-Screening — content-based rules engine (MOCK "AI").
 *
 * NOTE: There is NO real LLM call here. The "AI" label is product-facing
 * branding; the implementation is a deterministic, rules-based scorer modeled
 * after `lib/recommendations/queries.ts`. It is intentionally kept pure so it
 * can be unit-tested and re-run cheaply for bulk screening.
 *
 * Inputs come from the recruiter side (Application + Job) joined with the
 * applicant's profile (User + primary Resume.content). The score is in
 * [0, 100] and decomposes into six independent components:
 *
 *   1. Skill overlap (45 pts max)
 *      Lowercase skills from primary Resume.content.skills intersected with
 *      lowercased Job.tags. Score = min(45, overlap * 9).
 *
 *   2. Headline/title alignment (15 pts max)
 *      Significant tokens from User.headline (tokenize() — >3 chars, no
 *      stopwords) tested for inclusion in the lowercased Job.title.
 *      Score = min(15, matches * 5).
 *
 *   3. Experience level alignment (15 pts max)
 *      Count seniority keywords ("senior", "lead", "principal", "manager",
 *      "head") across User.headline + Resume.experiences[].title.
 *      - > 0 hits → 15 if job.experienceLevel is SENIOR/LEAD/EXECUTIVE
 *      - = 0 hits → 15 if job.experienceLevel is ENTRY/JUNIOR/MID
 *      - otherwise 0.
 *
 *   4. Resume completeness (10 pts max)
 *      Three flags: has fileUrl, has summary, has >= 3 experiences.
 *      3 of 3 → 10, 2 of 3 → 7, 1 of 3 → 3, 0 of 3 → 0.
 *
 *   5. Location fit (10 pts max)
 *      - 10 exact lowercase match (user.location === job.location)
 *      -  7 substring match either direction
 *      -  5 job.locationType === REMOTE
 *      -  0 otherwise.
 *
 *   6. Cover letter presence (5 pts max)
 *      5 if application.coverLetter is non-empty after trim and longer than
 *      50 characters; 0 otherwise.
 *
 * Auto-tags (Indonesian, surfaced in recruiter UI chips):
 *   - "match-tinggi"     when total >= 75
 *   - "match-sedang"     when 50 <= total < 75
 *   - "perlu-tinjauan"   when total < 50
 *   - "skill-cocok"      when skill overlap count >= 3
 *   - "tidak-ada-cv"     when applicant has no Resume row at all
 *   - "lokasi-cocok"     when exact lowercase location match
 *   - "remote-friendly"  when job.locationType === REMOTE
 *   - "lengkap"          when all 3 resume completeness fields are present
 *
 * On malformed inputs (missing application/job/user) the helper returns
 * `{ score: 0, breakdown: {...}, tags: ["perlu-tinjauan"] }` rather than
 * throwing, so bulk screening can swallow per-row failures.
 */

import type { ExperienceLevel, LocationType } from '@prisma/client'
import { tokenize } from '@/lib/recommendations/stopwords'

const SENIORITY_KEYWORDS = [
  'senior',
  'lead',
  'principal',
  'manager',
  'head',
] as const

const SENIOR_LEVELS: ExperienceLevel[] = ['SENIOR', 'LEAD', 'EXECUTIVE']
const JUNIOR_LEVELS: ExperienceLevel[] = ['ENTRY', 'JUNIOR', 'MID']

export type ScreeningBreakdown = {
  skill: number
  headline: number
  experience: number
  completeness: number
  location: number
  coverLetter: number
}

export type ScreeningResult = {
  score: number
  breakdown: ScreeningBreakdown
  tags: string[]
  matchedSkills: string[]
}

type ResumeExperience = { title?: unknown }
type ResumeContent = {
  skills?: unknown
  experiences?: unknown
  summary?: unknown
}

export type ScoringApplication = {
  coverLetter?: string | null
} | null | undefined

export type ScoringJob = {
  title: string
  tags: string[]
  location: string
  locationType: LocationType
  experienceLevel: ExperienceLevel
} | null | undefined

export type ScoringUser = {
  headline?: string | null
  location?: string | null
} | null | undefined

export type ScoringResume = {
  fileUrl?: string | null
  content?: unknown
} | null | undefined

function extractSkills(content: unknown): string[] {
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

function extractExperienceTitles(content: unknown): string[] {
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

function countExperiences(content: unknown): number {
  if (!content || typeof content !== 'object') return 0
  const c = content as ResumeContent
  if (!Array.isArray(c.experiences)) return 0
  return c.experiences.filter((e) => e && typeof e === 'object').length
}

function hasSummary(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  const c = content as ResumeContent
  return typeof c.summary === 'string' && c.summary.trim().length > 0
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
  return { score: Math.min(45, matched.length * 9), matched }
}

function scoreHeadline(headlineTokens: string[], jobTitle: string): number {
  if (headlineTokens.length === 0) return 0
  const title = jobTitle.toLowerCase()
  let hits = 0
  for (const tok of headlineTokens) {
    if (title.includes(tok)) hits++
  }
  return Math.min(15, hits * 5)
}

function scoreExperienceAlignment(
  seniorityHits: number,
  level: ExperienceLevel,
): number {
  if (seniorityHits > 0 && SENIOR_LEVELS.includes(level)) return 15
  if (seniorityHits === 0 && JUNIOR_LEVELS.includes(level)) return 15
  return 0
}

function scoreCompleteness(resume: ScoringResume): {
  score: number
  flags: { fileUrl: boolean; summary: boolean; experiences: boolean }
} {
  const flags = {
    fileUrl: Boolean(resume?.fileUrl && resume.fileUrl.trim().length > 0),
    summary: hasSummary(resume?.content),
    experiences: countExperiences(resume?.content) >= 3,
  }
  const hits = (flags.fileUrl ? 1 : 0) + (flags.summary ? 1 : 0) + (flags.experiences ? 1 : 0)
  const lookup: Record<number, number> = { 0: 0, 1: 3, 2: 7, 3: 10 }
  return { score: lookup[hits] ?? 0, flags }
}

function scoreLocation(
  userLocation: string | null | undefined,
  jobLocation: string,
  jobLocationType: LocationType,
): { score: number; exact: boolean } {
  const u = userLocation?.trim().toLowerCase() ?? ''
  const j = jobLocation.trim().toLowerCase()
  if (u && j) {
    if (u === j) return { score: 10, exact: true }
    if (u.length >= 3 && (j.includes(u) || u.includes(j))) {
      return { score: 7, exact: false }
    }
  }
  if (jobLocationType === 'REMOTE') return { score: 5, exact: false }
  return { score: 0, exact: false }
}

function scoreCoverLetter(coverLetter: string | null | undefined): number {
  if (!coverLetter) return 0
  return coverLetter.trim().length > 50 ? 5 : 0
}

const EMPTY_BREAKDOWN: ScreeningBreakdown = {
  skill: 0,
  headline: 0,
  experience: 0,
  completeness: 0,
  location: 0,
  coverLetter: 0,
}

/**
 * Pure scorer. Takes a recruiter-side view of the application + job and an
 * applicant-side view of the user + primary resume; returns a deterministic
 * score, per-component breakdown, and auto-tags.
 *
 * `primaryResume` may be `null` — that means the applicant has no Resume row
 * (different from a Resume row with empty content) and produces the
 * "tidak-ada-cv" tag.
 */
export function scoreApplication({
  application,
  job,
  user,
  primaryResume,
}: {
  application: ScoringApplication
  job: ScoringJob
  user: ScoringUser
  primaryResume: ScoringResume
}): ScreeningResult {
  // Malformed-input fallback — keep the contract sane for bulk callers.
  if (!application || !job || !user) {
    return {
      score: 0,
      breakdown: { ...EMPTY_BREAKDOWN },
      tags: ['perlu-tinjauan'],
      matchedSkills: [],
    }
  }

  const userSkills = extractSkills(primaryResume?.content)
  const headlineTokens = tokenize(user.headline ?? null)

  // Seniority signals from headline + resume experience titles.
  const seniorityHaystack = [
    (user.headline ?? '').toLowerCase(),
    ...extractExperienceTitles(primaryResume?.content).map((t) => t.toLowerCase()),
  ].join(' ')
  const seniorityHits = SENIORITY_KEYWORDS.reduce(
    (acc, kw) => (seniorityHaystack.includes(kw) ? acc + 1 : acc),
    0,
  )

  const skill = scoreSkills(userSkills, job.tags)
  const headline = scoreHeadline(headlineTokens, job.title)
  const experience = scoreExperienceAlignment(seniorityHits, job.experienceLevel)
  const completeness = scoreCompleteness(primaryResume)
  const location = scoreLocation(user.location, job.location, job.locationType)
  const coverLetter = scoreCoverLetter(application.coverLetter)

  const breakdown: ScreeningBreakdown = {
    skill: skill.score,
    headline,
    experience,
    completeness: completeness.score,
    location: location.score,
    coverLetter,
  }

  const total =
    breakdown.skill +
    breakdown.headline +
    breakdown.experience +
    breakdown.completeness +
    breakdown.location +
    breakdown.coverLetter

  const tags: string[] = []
  if (total >= 75) tags.push('match-tinggi')
  else if (total >= 50) tags.push('match-sedang')
  else tags.push('perlu-tinjauan')

  if (skill.matched.length >= 3) tags.push('skill-cocok')
  if (!primaryResume) tags.push('tidak-ada-cv')
  if (location.exact) tags.push('lokasi-cocok')
  if (job.locationType === 'REMOTE') tags.push('remote-friendly')
  if (
    completeness.flags.fileUrl &&
    completeness.flags.summary &&
    completeness.flags.experiences
  ) {
    tags.push('lengkap')
  }

  return {
    score: Math.max(0, Math.min(100, total)),
    breakdown,
    tags,
    matchedSkills: skill.matched,
  }
}

/** Human-readable label for a breakdown component (Indonesian). */
export const BREAKDOWN_LABELS: Record<keyof ScreeningBreakdown, string> = {
  skill: 'Kecocokan skill',
  headline: 'Kecocokan headline',
  experience: 'Tingkat pengalaman',
  completeness: 'Kelengkapan CV',
  location: 'Kecocokan lokasi',
  coverLetter: 'Cover letter',
}

/** Maximum points each component can contribute. Useful for progress bars. */
export const BREAKDOWN_MAX: Record<keyof ScreeningBreakdown, number> = {
  skill: 45,
  headline: 15,
  experience: 15,
  completeness: 10,
  location: 10,
  coverLetter: 5,
}

/** Human-readable label for an auto-tag (Indonesian). */
export const TAG_LABELS: Record<string, string> = {
  'match-tinggi': 'Match tinggi',
  'match-sedang': 'Match sedang',
  'perlu-tinjauan': 'Perlu tinjauan',
  'skill-cocok': 'Skill cocok',
  'tidak-ada-cv': 'Tidak ada CV',
  'lokasi-cocok': 'Lokasi cocok',
  'remote-friendly': 'Remote friendly',
  lengkap: 'Profil lengkap',
}
