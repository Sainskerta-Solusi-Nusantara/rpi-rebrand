/**
 * Read-only Job queries powering the public XML feeds (LinkedIn / Indeed /
 * generic Atom).
 *
 * - Filters to `status='PUBLISHED' AND publishedAt != null` so drafts and
 *   future-dated entries never leak.
 * - Caps at 500 most-recent jobs per feed to bound work + payload size.
 * - Wrapped in `react.cache` so multiple components in the same RSC request
 *   (e.g. feed-info page rendering all 3 example URLs) share one DB hit.
 */

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const FEED_DEFAULT_LIMIT = 500

export type FeedJob = {
  id: string
  slug: string
  title: string
  description: string
  responsibilities: string | null
  requirements: string | null
  benefits: string | null
  location: string
  locationType: 'ONSITE' | 'HYBRID' | 'REMOTE'
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE'
  experienceLevel: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  salaryPeriod: string
  tags: string[]
  publishedAt: Date
  updatedAt: Date
  category: { id: string; slug: string; name: string } | null
  tenant: { id: string; slug: string; name: string }
}

const JOB_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  responsibilities: true,
  requirements: true,
  benefits: true,
  location: true,
  locationType: true,
  employmentType: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  tags: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true } },
  tenant: { select: { id: true, slug: true, name: true } },
} as const

export const getPublishedJobsForFeed = cache(
  async (
    tenantId?: string | null,
    opts: { limit?: number } = {},
  ): Promise<FeedJob[]> => {
    const limit = Math.min(Math.max(1, opts.limit ?? FEED_DEFAULT_LIMIT), FEED_DEFAULT_LIMIT)
    const rows = await prisma.job
      .findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { not: null },
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: JOB_SELECT,
      })
      .catch(() => [])

    // Narrow non-null publishedAt for downstream consumers.
    return rows.filter((j) => j.publishedAt !== null) as FeedJob[]
  },
)

export const getTenantBySlug = cache(async (slug: string) => {
  if (!slug) return null
  return prisma.tenant
    .findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, status: true },
    })
    .catch(() => null)
})
