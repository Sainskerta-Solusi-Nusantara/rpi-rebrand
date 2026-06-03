import { cache } from 'react'
import { JobStatus, type EmploymentType, type SavedSearch } from '@prisma/client'
import { prisma } from '@/lib/db'
import { parseQueryTerms } from '@/lib/search/relevance'

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
  const and: object[] = [
    { status: JobStatus.PUBLISHED },
    { publishedAt: { gte: since } },
  ]

  const terms = parseQueryTerms(search.query ?? '')
  for (const term of terms) {
    and.push({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
        { tenant: { name: { contains: term, mode: 'insensitive' } } },
      ],
    })
  }

  if (search.categorySlug && search.categorySlug.trim()) {
    and.push({ category: { is: { slug: search.categorySlug.trim() } } })
  }

  if (search.location && search.location.trim()) {
    and.push({ location: { contains: search.location.trim(), mode: 'insensitive' } })
  }

  if (search.employmentType && VALID_EMPLOYMENT_TYPES.has(search.employmentType)) {
    and.push({ employmentType: search.employmentType as EmploymentType })
  }

  const where = { AND: and }

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
