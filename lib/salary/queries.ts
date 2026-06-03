/**
 * Salary Insights — cached aggregate queries over the Job model.
 *
 * Pure read-only aggregates: no schema changes. Pulls PUBLISHED jobs that have
 * both salaryMin > 0 and salaryMax > 0, then derives a single data point per
 * job as the midpoint (salaryMin + salaryMax) / 2. Quartiles are computed in
 * JS via sort + index since Postgres percentile_cont is not portable across
 * the Prisma client.
 *
 * Sample size is capped to the 5000 most-recent matching jobs per call to
 * keep memory predictable. Errors are swallowed and a safe-default SalaryStats
 * is returned so the dashboard never crashes.
 */

import { cache } from 'react'
import type { ExperienceLevel } from '@prisma/client'
import { prisma } from '@/lib/db'
import { parseQueryTerms } from '@/lib/search/relevance'

/** Hard cap on data points pulled per call (most-recent first). */
const SAMPLE_CAP = 5000

export type SalaryStatsByLevel = {
  level: ExperienceLevel
  count: number
  median: number | null
  p25: number | null
  p75: number | null
}

export type SalaryStatsByLocation = {
  location: string
  count: number
  median: number | null
}

export type SalaryStatsByCategory = {
  category: string
  count: number
  median: number | null
}

export type SalaryStats = {
  count: number
  median: number | null
  p25: number | null
  p75: number | null
  min: number | null
  max: number | null
  byLevel: SalaryStatsByLevel[]
  byLocation: SalaryStatsByLocation[]
  byCategory: SalaryStatsByCategory[]
  /** Raw count of jobs that matched filter (before SAMPLE_CAP). */
  sampleSize: number
  lastUpdated: Date
}

const EMPTY_STATS: SalaryStats = {
  count: 0,
  median: null,
  p25: null,
  p75: null,
  min: null,
  max: null,
  byLevel: [],
  byLocation: [],
  byCategory: [],
  sampleSize: 0,
  lastUpdated: new Date(0),
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function quantileSorted(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null
  if (sorted.length === 1) return sorted[0] ?? null
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const a = sorted[base]
  const b = sorted[base + 1]
  if (a === undefined) return null
  if (b === undefined) return a
  return Math.round(a + rest * (b - a))
}

type JobRow = {
  salaryMin: number | null
  salaryMax: number | null
  experienceLevel: ExperienceLevel
  location: string
  category: { name: string } | null
}

function computeStats(rows: JobRow[], totalSample: number): SalaryStats {
  const midpoints: number[] = []
  const byLevelBuckets = new Map<ExperienceLevel, number[]>()
  const byLocationBuckets = new Map<string, number[]>()
  const byCategoryBuckets = new Map<string, number[]>()

  for (const r of rows) {
    if (r.salaryMin == null || r.salaryMax == null) continue
    if (r.salaryMin <= 0 || r.salaryMax <= 0) continue
    const mid = Math.round((r.salaryMin + r.salaryMax) / 2)
    midpoints.push(mid)

    const lvl = byLevelBuckets.get(r.experienceLevel) ?? []
    lvl.push(mid)
    byLevelBuckets.set(r.experienceLevel, lvl)

    const locKey = r.location.trim()
    if (locKey) {
      const arr = byLocationBuckets.get(locKey) ?? []
      arr.push(mid)
      byLocationBuckets.set(locKey, arr)
    }

    const catKey = r.category?.name?.trim()
    if (catKey) {
      const arr = byCategoryBuckets.get(catKey) ?? []
      arr.push(mid)
      byCategoryBuckets.set(catKey, arr)
    }
  }

  const sorted = [...midpoints].sort((a, b) => a - b)

  const byLevel: SalaryStatsByLevel[] = [...byLevelBuckets.entries()]
    .map(([level, arr]) => {
      const s = [...arr].sort((a, b) => a - b)
      return {
        level,
        count: s.length,
        median: quantileSorted(s, 0.5),
        p25: quantileSorted(s, 0.25),
        p75: quantileSorted(s, 0.75),
      }
    })
    .sort((a, b) => b.count - a.count)

  const byLocation: SalaryStatsByLocation[] = [...byLocationBuckets.entries()]
    .map(([location, arr]) => {
      const s = [...arr].sort((a, b) => a - b)
      return {
        location,
        count: s.length,
        median: quantileSorted(s, 0.5),
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const byCategory: SalaryStatsByCategory[] = [...byCategoryBuckets.entries()]
    .map(([category, arr]) => {
      const s = [...arr].sort((a, b) => a - b)
      return {
        category,
        count: s.length,
        median: quantileSorted(s, 0.5),
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    count: sorted.length,
    median: quantileSorted(sorted, 0.5),
    p25: quantileSorted(sorted, 0.25),
    p75: quantileSorted(sorted, 0.75),
    min: sorted.length > 0 ? sorted[0] ?? null : null,
    max: sorted.length > 0 ? sorted[sorted.length - 1] ?? null : null,
    byLevel,
    byLocation,
    byCategory,
    sampleSize: totalSample,
    lastUpdated: new Date(),
  }
}

// ---------------------------------------------------------------------------
// getSalaryStatsByCategory
// ---------------------------------------------------------------------------

export type SalaryStatsFilter = {
  categorySlug?: string
  experienceLevel?: ExperienceLevel
  location?: string
}

export const getSalaryStatsByCategory = cache(
  async (filter: SalaryStatsFilter = {}): Promise<SalaryStats> => {
    try {
      const where = {
        status: 'PUBLISHED' as const,
        salaryMin: { gt: 0 },
        salaryMax: { gt: 0 },
        ...(filter.categorySlug
          ? { category: { is: { slug: filter.categorySlug } } }
          : {}),
        ...(filter.experienceLevel
          ? { experienceLevel: filter.experienceLevel }
          : {}),
        ...(filter.location
          ? {
              location: { contains: filter.location, mode: 'insensitive' as const },
            }
          : {}),
      }

      const [rows, total] = await Promise.all([
        prisma.job.findMany({
          where,
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          take: SAMPLE_CAP,
          select: {
            salaryMin: true,
            salaryMax: true,
            experienceLevel: true,
            location: true,
            category: { select: { name: true } },
          },
        }),
        prisma.job.count({ where }),
      ])

      const stats = computeStats(rows as JobRow[], total)

      // When user filtered by a category, suppress byCategory breakdown
      // (it would just be a single row).
      if (filter.categorySlug) {
        stats.byCategory = []
      }

      return stats
    } catch {
      return { ...EMPTY_STATS, lastUpdated: new Date() }
    }
  },
)

// ---------------------------------------------------------------------------
// getSalaryForRole — per-role lookup used by the kandidat-facing widget
// ---------------------------------------------------------------------------

export type SalaryForRoleParams = {
  title: string
  experienceLevel?: ExperienceLevel
  location?: string
}

/**
 * Match jobs whose title contains ALL significant tokens of the input title.
 * Significance is defined by {@link tokenize}: lowercased, length > 3,
 * non-stopword. For "backend engineer" we require both "backend" and
 * "engineer" to appear in the job title.
 *
 * Falls back to empty stats if no significant tokens (e.g. title is just
 * stopwords) — better than returning misleading aggregates.
 */
export const getSalaryForRole = cache(
  async ({
    title,
    experienceLevel,
    location,
  }: SalaryForRoleParams): Promise<SalaryStats> => {
    try {
      const terms = parseQueryTerms(title)
      if (terms.length === 0) {
        return { ...EMPTY_STATS, lastUpdated: new Date() }
      }

      const and = terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' as const } },
        ],
      }))

      const where = {
        status: 'PUBLISHED' as const,
        salaryMin: { gt: 0 },
        salaryMax: { gt: 0 },
        AND: and,
        ...(experienceLevel ? { experienceLevel } : {}),
        ...(location
          ? { location: { contains: location, mode: 'insensitive' as const } }
          : {}),
      }

      const [rows, total] = await Promise.all([
        prisma.job.findMany({
          where,
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          take: SAMPLE_CAP,
          select: {
            salaryMin: true,
            salaryMax: true,
            experienceLevel: true,
            location: true,
            category: { select: { name: true } },
          },
        }),
        prisma.job.count({ where }),
      ])

      return computeStats(rows as JobRow[], total)
    } catch {
      return { ...EMPTY_STATS, lastUpdated: new Date() }
    }
  },
)
