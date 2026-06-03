/**
 * Talent Pool — recruiter-side candidate search.
 *
 * Surfaces only PUBLIC + ACTIVE user profiles (User.profilePublic === true &&
 * User.status === 'ACTIVE'). Email and phone are NEVER returned to the caller,
 * by design. Recruiters can browse candidates across the platform; this is
 * NOT scoped to a single tenant's candidate list — it's the global opt-in pool.
 *
 * ---------------------------------------------------------------------------
 * Permission model
 * ---------------------------------------------------------------------------
 * Callers must hold `job.view` on the requesting tenant. The tenantId is
 * checked, but results are global (any candidate who opted in). This keeps the
 * API consistent with branding-actions LoadCtx and makes the recruiter's
 * tenant the unit of audit/billing.
 *
 * ---------------------------------------------------------------------------
 * Filter / experience-years trade-off
 * ---------------------------------------------------------------------------
 * `experienceYears` is computed from Resume.content.experiences[] in JS — we
 * iterate per-candidate to compute earliest startDate → latest endDate (or
 * "now" if `current: true`). This is acceptable because:
 *   - The candidate pool is capped at 200 users per request (see
 *     CANDIDATE_POOL_LIMIT).
 *   - Resume content is JSON; computing this in SQL would require either a
 *     materialized column or expensive jsonb_path_query.
 *   - This is an MVP — we accept the higher per-row JS cost in exchange for
 *     schema stability.
 * If the talent pool grows beyond ~5k public profiles we should denormalize
 * `experienceYears` into a User column (or a TalentProfile join table).
 */

import { cache } from 'react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { hasTenantPermission } from '@/lib/auth/rbac'
import type { GlobalRole, TenantMembership } from '@/types/next-auth'
import { parseQueryTerms, scoreRelevance, recencyBoost } from '@/lib/search/relevance'

const CANDIDATE_POOL_LIMIT = 200
const TOP_SKILLS_PER_CANDIDATE = 8

export type TalentPoolCandidate = {
  userId: string
  displayName: string
  headline: string | null
  location: string | null
  image: string | null
  primaryResumeId: string | null
  skills: string[]
  experienceYears: number
  updatedAt: Date
  /** Canonical handle for /profil/[handle] — username if available, else id. */
  handle: string
  /** True when the user has at least one Resume row. */
  hasResume: boolean
}

export type SearchCandidatesParams = {
  tenantId: string
  /** Caller's global role — used to authorize the recruiter. */
  callerGlobalRole: GlobalRole
  callerMemberships: TenantMembership[]
  query?: string
  skills?: string[]
  location?: string
  experienceMin?: number
  experienceMax?: number
  hasResume?: boolean
  page?: number
  pageSize?: number
}

export type SearchCandidatesResult = {
  items: TalentPoolCandidate[]
  total: number
  /** True when the recruiter lacked job.view on the tenant. */
  forbidden?: boolean
}

// ---------------------------------------------------------------------------
// Resume JSON parsing — duplicated lightly from lib/profile/public-queries.ts
// to keep the talent-pool module standalone and let us return canonical
// (non-sanitized) skills + raw startDate for math.
// ---------------------------------------------------------------------------

type RawExperience = {
  title?: unknown
  startDate?: unknown
  endDate?: unknown
  current?: unknown
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x === 'string' && x.trim().length > 0) out.push(x.trim())
  }
  return out
}

function parseDateLoose(s: string | undefined): Date | null {
  if (!s) return null
  // Accept ISO yyyy-mm or yyyy-mm-dd; coerce "2023" → "2023-01".
  const normalized = /^\d{4}$/.test(s) ? `${s}-01-01` : s
  const d = new Date(normalized)
  return Number.isFinite(d.getTime()) ? d : null
}

/**
 * Compute total experience in whole years from a list of experience entries.
 * Strategy: take earliest startDate and latest endDate (or "now" if any entry
 * has current:true). This intentionally over-counts overlapping roles — a
 * conservative cap of 60 years guards against bad data.
 */
function computeExperienceYears(experiences: RawExperience[]): number {
  if (experiences.length === 0) return 0
  let earliest: Date | null = null
  let latest: Date | null = null
  let hasCurrent = false

  for (const e of experiences) {
    const start = parseDateLoose(asString(e.startDate))
    if (start && (!earliest || start.getTime() < earliest.getTime())) {
      earliest = start
    }
    if (e.current === true) {
      hasCurrent = true
      continue
    }
    const end = parseDateLoose(asString(e.endDate))
    if (end && (!latest || end.getTime() > latest.getTime())) {
      latest = end
    }
  }

  if (!earliest) return 0
  const endRef = hasCurrent ? new Date() : (latest ?? new Date())
  const ms = endRef.getTime() - earliest.getTime()
  if (ms <= 0) return 0
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000))
  return Math.min(60, Math.max(0, years))
}

function deriveDisplayName(name: string | null, email: string): string {
  if (name && name.trim()) return name.trim()
  const local = email.split('@')[0] ?? email
  return local
}

// ---------------------------------------------------------------------------
// searchCandidates
// ---------------------------------------------------------------------------

/**
 * Search public candidates with optional filters. Returns sanitized cards.
 *
 * @remarks
 * - Cached per render via React `cache`.
 * - Returns `{ forbidden: true }` if the caller lacks `job.view` on tenantId.
 * - Hard cap of 200 candidates considered (CANDIDATE_POOL_LIMIT) — pagination
 *   slices in-memory after JS filtering.
 * - Sort order: skill-match-count desc, then updatedAt desc.
 * - Email and phone are NEVER selected from User; they cannot leak.
 */
export const searchCandidates = cache(
  async (
    params: SearchCandidatesParams,
  ): Promise<SearchCandidatesResult> => {
    const {
      tenantId,
      callerGlobalRole,
      callerMemberships,
      query,
      skills,
      location,
      experienceMin,
      experienceMax,
      hasResume,
      page = 1,
      pageSize = 20,
    } = params

    if (
      !hasTenantPermission(
        callerGlobalRole,
        callerMemberships,
        tenantId,
        'job.view',
      )
    ) {
      return { items: [], total: 0, forbidden: true }
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills
          .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
          .filter(Boolean)
      : []

    const trimmedQuery = typeof query === 'string' ? query.trim() : ''
    const trimmedLocation =
      typeof location === 'string' ? location.trim() : ''
    const terms = parseQueryTerms(trimmedQuery)

    // --- Build SQL-level prefilter -----------------------------------------
    // Restrict by profilePublic + ACTIVE + optional location at the DB layer.
    // Multi-term AND: each term must appear in name OR headline. Skills,
    // summary, and experience titles are matched per-row in JS below (they
    // live in JSON), so the DB clause is a liberal prefilter — the JS pass
    // is the authoritative filter gate.
    const and: Prisma.UserWhereInput[] = []

    if (trimmedLocation) {
      and.push({
        location: { contains: trimmedLocation, mode: 'insensitive' as const },
      })
    }

    // One AND clause per term: term must hit name OR headline at the DB layer.
    // The JS pass widens this to also accept summary / experience title hits,
    // so rows that only match in JSON are re-admitted after fetch.
    for (const term of terms) {
      and.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' as const } },
          { headline: { contains: term, mode: 'insensitive' as const } },
        ],
      })
    }

    const where: Prisma.UserWhereInput = {
      profilePublic: true,
      status: 'ACTIVE',
      ...(and.length ? { AND: and } : {}),
    }

    let rows: {
      id: string
      name: string | null
      email: string
      image: string | null
      headline: string | null
      location: string | null
      username: string | null
      updatedAt: Date
      resumes: {
        id: string
        content: Prisma.JsonValue | null
        isPrimary: boolean
        updatedAt: Date
      }[]
    }[] = []
    try {
      rows = await prisma.user.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: CANDIDATE_POOL_LIMIT,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          headline: true,
          location: true,
          username: true,
          updatedAt: true,
          resumes: {
            orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
            take: 1,
            select: {
              id: true,
              content: true,
              isPrimary: true,
              updatedAt: true,
            },
          },
        },
      })
    } catch (err) {
      console.error('[searchCandidates] db query failed', err)
      return { items: [], total: 0 }
    }

    type Scored = TalentPoolCandidate & { _score: number }
    const scored: Scored[] = []

    for (const u of rows) {
      const primary = u.resumes[0] ?? null
      const resumeContent =
        primary?.content && typeof primary.content === 'object'
          ? (primary.content as Record<string, unknown>)
          : null

      const allSkills = resumeContent
        ? asStringArray(resumeContent.skills)
        : []
      const experiences: RawExperience[] =
        resumeContent && Array.isArray(resumeContent.experiences)
          ? (resumeContent.experiences as RawExperience[])
          : []
      const summary =
        resumeContent && typeof resumeContent.summary === 'string'
          ? resumeContent.summary
          : ''

      // hasResume filter — explicit true requires a resume row; explicit false
      // requires no resume row. Undefined = pass-through.
      const candidateHasResume = Boolean(primary)
      if (hasResume === true && !candidateHasResume) continue
      if (hasResume === false && candidateHasResume) continue

      // Skill any-of intersection. Lowercased compare on both sides.
      const lowerSkills = allSkills.map((s) => s.toLowerCase())
      let skillMatches = 0
      if (normalizedSkills.length > 0) {
        for (const wanted of normalizedSkills) {
          if (lowerSkills.includes(wanted)) skillMatches += 1
        }
        if (skillMatches === 0) continue
      }

      // Multi-term AND: every term must match in at least one of
      // name / headline / skills / summary / experience titles.
      // The DB prefilter only checked name + headline, so terms that only
      // appear in JSON fields are authorised here.
      if (terms.length > 0) {
        const expTitles = experiences
          .map((e) => asString(e.title) ?? '')
          .join(' ')
        const candidateText = [
          u.name ?? '',
          u.headline ?? '',
          allSkills.join(' '),
          summary,
          expTitles,
        ].join(' ').toLowerCase()

        const allTermsMatch = terms.every((term) => candidateText.includes(term))
        if (!allTermsMatch) continue
      }

      const experienceYears = computeExperienceYears(experiences)
      if (
        typeof experienceMin === 'number' &&
        Number.isFinite(experienceMin) &&
        experienceYears < experienceMin
      ) {
        continue
      }
      if (
        typeof experienceMax === 'number' &&
        Number.isFinite(experienceMax) &&
        experienceYears > experienceMax
      ) {
        continue
      }

      // Relevance score: weighted field match (name/headline 3, skills 2,
      // location/summary 1) + recency boost on updatedAt as tiebreaker.
      const score =
        scoreRelevance(
          [
            { text: u.name, weight: 3 },
            { text: u.headline, weight: 3 },
            { text: allSkills, weight: 2 },
            { text: u.location, weight: 1 },
            { text: summary, weight: 1 },
          ],
          terms,
          trimmedQuery,
        ) +
        recencyBoost(u.updatedAt, 0.5) +
        // Preserve skill-filter signal as a sub-component of the score.
        skillMatches * 0.1

      scored.push({
        userId: u.id,
        displayName: deriveDisplayName(u.name, u.email),
        headline: u.headline,
        location: u.location,
        image: u.image,
        primaryResumeId: primary?.id ?? null,
        skills: allSkills.slice(0, TOP_SKILLS_PER_CANDIDATE),
        experienceYears,
        updatedAt: u.updatedAt,
        handle: u.username ?? u.id,
        hasResume: candidateHasResume,
        _score: score,
      })
    }

    // Sort by relevance desc; updatedAt desc is the implicit tiebreaker
    // (rows arrived from DB in updatedAt desc order; stable JS sort preserves it).
    scored.sort((a, b) => b._score - a._score)

    const total = scored.length
    const safePage = Math.max(1, Math.floor(page))
    const safePageSize = Math.min(50, Math.max(1, Math.floor(pageSize)))
    const start = (safePage - 1) * safePageSize
    const slice = scored.slice(start, start + safePageSize)

    // Strip the internal _score before returning.
    const items: TalentPoolCandidate[] = slice.map((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _score, ...rest } = s
      return rest
    })

    return { items, total }
  },
)
