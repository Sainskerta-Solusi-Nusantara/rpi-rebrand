import { cache } from 'react'
import { JobStatus, type EmploymentType, type SavedSearch } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * List a user's saved searches, newest first. Returns plain rows — callers
 * can shape them for UI as needed. Cached per render via React `cache`.
 */
export const listSavedSearches = cache(async (userId: string): Promise<SavedSearch[]> => {
  try {
    return await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  } catch (err) {
    console.error('[listSavedSearches] failed', err)
    return []
  }
})

export type MatchingJob = {
  id: string
  title: string
  slug: string
  location: string
  publishedAt: Date | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  tenant: { name: string; slug: string }
  category: { name: string; slug: string } | null
}

const VALID_EMPLOYMENT_TYPES = new Set([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
])

/**
 * Find PUBLISHED jobs published since `since` that match the criteria of a
 * SavedSearch row. Filters are AND-combined. Returns up to `limit` rows,
 * newest first by publishedAt.
 */
export async function findMatchingJobs(
  search: Pick<SavedSearch, 'query' | 'categorySlug' | 'location' | 'employmentType'>,
  since: Date,
  limit = 5,
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
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        publishedAt: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        tenant: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    })
    return jobs
  } catch (err) {
    console.error('[findMatchingJobs] failed', err)
    return []
  }
}
