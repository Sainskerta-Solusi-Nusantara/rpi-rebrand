import { cache } from 'react'
import { JobStatus, type EmploymentType, type SavedSearch } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Queries module for the saved-search / weekly digest feature
 * (lib/saved-search/* — singular). Wraps the underlying Prisma calls with
 * a stable, narrowly-typed API used by the dashboard UI, the unsubscribe
 * page, and the digest worker.
 */

export type SavedSearchSummary = SavedSearch

/**
 * Newest-first list of a user's saved searches. Memoized per render via
 * `react.cache` so multiple server components in the same request share
 * a single DB hit.
 */
export const getUserSavedSearches = cache(
  async (userId: string): Promise<SavedSearchSummary[]> => {
    if (!userId) return []
    try {
      return await prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    } catch (err) {
      console.error('[getUserSavedSearches] failed', err)
      return []
    }
  },
)

/**
 * Fetch a single SavedSearch row by id and verify ownership in the same
 * query. Returns null when the row does not exist or belongs to someone
 * else (so callers cannot infer existence of foreign rows).
 */
export async function getSavedSearchById(
  id: string,
  userId: string,
): Promise<SavedSearchSummary | null> {
  if (!id || !userId) return null
  try {
    const row = await prisma.savedSearch.findFirst({
      where: { id, userId },
    })
    return row ?? null
  } catch (err) {
    console.error('[getSavedSearchById] failed', err)
    return null
  }
}

export type MatchingJob = {
  id: string
  title: string
  slug: string
  location: string
  publishedAt: Date | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  tenant: { id: string; name: string; slug: string }
  category: { name: string; slug: string } | null
}

const VALID_EMPLOYMENT_TYPES = new Set<string>([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
])

/**
 * Find newly-published jobs matching the criteria of a SavedSearch.
 *
 * Filters (all AND-combined):
 *   - Job.status = PUBLISHED.
 *   - Job.publishedAt >= since.
 *   - search.query     → ilike on title OR description.
 *   - search.categorySlug → exact match on related JobCategory.slug.
 *   - search.location  → ilike on Job.location.
 *   - search.employmentType → exact (validated against EmploymentType enum).
 *
 * Returns at most 20 rows, newest first by publishedAt.
 */
export async function matchJobsForSearch(
  search: Pick<SavedSearch, 'query' | 'categorySlug' | 'location' | 'employmentType'>,
  since: Date,
): Promise<MatchingJob[]> {
  const where: Record<string, unknown> = {
    status: JobStatus.PUBLISHED,
    publishedAt: { gte: since },
  }

  if (search.query && search.query.trim()) {
    const q = search.query.trim()
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (search.categorySlug && search.categorySlug.trim()) {
    where.category = { is: { slug: search.categorySlug.trim() } }
  }

  if (search.location && search.location.trim()) {
    where.location = { contains: search.location.trim(), mode: 'insensitive' }
  }

  if (search.employmentType && VALID_EMPLOYMENT_TYPES.has(search.employmentType)) {
    where.employmentType = search.employmentType as EmploymentType
  }

  try {
    const jobs = await prisma.job.findMany({
      where: where as never,
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        publishedAt: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        tenant: { select: { id: true, name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    })
    return jobs
  } catch (err) {
    console.error('[matchJobsForSearch] failed', err)
    return []
  }
}
