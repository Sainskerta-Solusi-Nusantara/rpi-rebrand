import { cache } from 'react'
import { prisma } from '@/lib/db'
import { tenantMeta } from '@/lib/tenant-meta'

export type Partner = {
  id: string
  slug: string
  name: string
  primaryColor: string
  jobsCount: number
  industry: string
  planTier: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
  createdAt: Date
}

export type MitraSort = 'newest' | 'alpha' | 'jobs-high' | 'jobs-low'

export type MitraFilters = {
  q?: string
  industry?: string
  plan?: Partner['planTier']
  sort?: MitraSort
}

export const MITRA_PAGE_SIZE = 24

export const MITRA_PLAN_TIERS: { value: Partner['planTier']; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'PRO', label: 'Pro' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

const VALID_PLAN_TIERS = new Set<Partner['planTier']>([
  'FREE',
  'PRO',
  'BUSINESS',
  'ENTERPRISE',
])

const VALID_MITRA_SORTS = new Set<MitraSort>([
  'newest',
  'alpha',
  'jobs-high',
  'jobs-low',
])

export function sanitizeMitraSort(value: string | undefined): MitraSort {
  return value && VALID_MITRA_SORTS.has(value as MitraSort)
    ? (value as MitraSort)
    : 'newest'
}

export function sanitizeMitraPlan(
  value: string | undefined,
): Partner['planTier'] | undefined {
  return value && VALID_PLAN_TIERS.has(value as Partner['planTier'])
    ? (value as Partner['planTier'])
    : undefined
}

/** Fetch all active partners enriched with industry from tenantMeta.
 * Tenant dataset is bounded by our own provisioning, so it's fine to pull the
 * full list once per request and apply industry filter/sort/pagination in
 * memory. q + plan are still pushed down to the DB. */
const getActivePartners = cache(
  async (filters: { q?: string; plan?: Partner['planTier'] }): Promise<Partner[]> => {
    const rows = await prisma.tenant
      .findMany({
        where: {
          status: 'ACTIVE',
          ...(filters.q
            ? { name: { contains: filters.q, mode: 'insensitive' } }
            : {}),
          ...(filters.plan ? { planTier: filters.plan } : {}),
        },
        orderBy: [{ planTier: 'desc' }, { createdAt: 'desc' }],
        include: {
          branding: { select: { primaryColor: true } },
          _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
        },
      })
      .catch(() => [])

    return rows.map((t) => {
      const meta = tenantMeta(t.slug)
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        primaryColor: t.branding?.primaryColor ?? meta.fallbackColor,
        jobsCount: t._count.jobs,
        industry: meta.industry,
        planTier: t.planTier as Partner['planTier'],
        createdAt: t.createdAt,
      }
    })
  },
)

function applySort(rows: Partner[], sort: MitraSort): Partner[] {
  const copy = rows.slice()
  switch (sort) {
    case 'alpha':
      copy.sort((a, b) => a.name.localeCompare(b.name, 'id'))
      return copy
    case 'jobs-high':
      copy.sort((a, b) => b.jobsCount - a.jobsCount)
      return copy
    case 'jobs-low':
      copy.sort((a, b) => a.jobsCount - b.jobsCount)
      return copy
    default:
      copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return copy
  }
}

export async function getMitraPage(
  filters: MitraFilters,
  page: number,
): Promise<{
  items: Partner[]
  total: number
  page: number
  totalPages: number
}> {
  const all = await getActivePartners({ q: filters.q, plan: filters.plan })
  const filtered = filters.industry
    ? all.filter((p) => p.industry === filters.industry)
    : all
  const sorted = applySort(filtered, sanitizeMitraSort(filters.sort))

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / MITRA_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * MITRA_PAGE_SIZE
  const items = sorted.slice(start, start + MITRA_PAGE_SIZE)
  return { items, total, page: safePage, totalPages }
}

export const getMitraIndustries = cache(
  async (): Promise<{ name: string; count: number }[]> => {
    const all = await getActivePartners({})
    const counts = new Map<string, number>()
    for (const p of all) {
      counts.set(p.industry, (counts.get(p.industry) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'))
  },
)

export const getMitraStats = cache(async () => {
  const [activeTenants, publishedJobs] = await Promise.all([
    prisma.tenant.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.job.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
  ])
  return { activeTenants, publishedJobs }
})
