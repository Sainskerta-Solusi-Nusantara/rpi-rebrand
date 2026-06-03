import { cache } from 'react'
import { prisma } from '@/lib/db'
import { tenantMeta } from '@/lib/tenant-meta'
import { parseQueryTerms, scoreRelevance, recencyBoost } from '@/lib/search/relevance'

export type JobLocationType = 'onsite' | 'hybrid' | 'remote'
export type JobEmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship'
  | 'freelance'
export type JobExperienceLevel = 'Entry' | 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Executive'

export type DummyJob = {
  id: string
  slug: string
  title: string
  company: string
  companyTagline: string
  companyAbout: string
  industry: string
  category: string
  location: string
  locationType: JobLocationType
  employmentType: JobEmploymentType
  experienceLevel: JobExperienceLevel
  salaryMin: number
  salaryMax: number
  tags: string[]
  postedAt: string
  postedDaysAgo: number
  applicants: number
  views: number
  description: string
  responsibilities: string[]
  requirements: string[]
  niceToHave: string[]
  benefits: string[]
}

// ---------------------------------------------------------------------------
// Enum mappers
// ---------------------------------------------------------------------------

const EMPLOYMENT_MAP: Record<string, JobEmploymentType> = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
}

const LOCATION_MAP: Record<string, JobLocationType> = {
  ONSITE: 'onsite',
  HYBRID: 'hybrid',
  REMOTE: 'remote',
}

const LEVEL_MAP: Record<string, JobExperienceLevel> = {
  ENTRY: 'Entry',
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitBullets(input: string | null | undefined): string[] {
  if (!input) return []
  return input
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
}

function relativeIndonesian(publishedAt: Date | null): { label: string; days: number } {
  if (!publishedAt) return { label: 'baru saja', days: 0 }
  const diffMs = Date.now() - publishedAt.getTime()
  const days = Math.max(0, Math.floor(diffMs / 86_400_000))
  if (days === 0) return { label: 'hari ini', days: 0 }
  if (days === 1) return { label: '1 hari lalu', days: 1 }
  if (days < 7) return { label: `${days} hari lalu`, days }
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return { label: weeks === 1 ? '1 minggu lalu' : `${weeks} minggu lalu`, days }
  }
  const months = Math.floor(days / 30)
  return { label: months === 1 ? '1 bulan lalu' : `${months} bulan lalu`, days }
}

// Strip auto-generated tags (category slug, employment type lowercase, level
// lowercase) that the seed adds; only keep meaningful skill tags.
function cleanTags(
  raw: string[],
  hidden: { category?: string | null; type: string; level: string },
): string[] {
  const hide = new Set<string>(
    [
      hidden.category?.toLowerCase(),
      hidden.type.toLowerCase(),
      hidden.level.toLowerCase(),
    ].filter((x): x is string => Boolean(x)),
  )
  return raw.filter((t) => !hide.has(t.toLowerCase()))
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

type PrismaJobWithRelations = {
  id: string
  slug: string
  title: string
  description: string
  responsibilities: string | null
  requirements: string | null
  benefits: string | null
  salaryMin: number | null
  salaryMax: number | null
  employmentType: string
  experienceLevel: string
  location: string
  locationType: string
  tags: string[]
  views: number
  publishedAt: Date | null
  tenant: { slug: string; name: string }
  category: { name: string; slug: string } | null
  _count: { applications: number }
}

function transform(row: PrismaJobWithRelations): DummyJob {
  const meta = tenantMeta(row.tenant.slug)
  const posted = relativeIndonesian(row.publishedAt)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.tenant.name,
    companyTagline: meta.tagline,
    companyAbout: meta.about,
    industry: meta.industry,
    category: row.category?.name ?? 'Lowongan',
    location: row.location,
    locationType: LOCATION_MAP[row.locationType] ?? 'onsite',
    employmentType: EMPLOYMENT_MAP[row.employmentType] ?? 'full-time',
    experienceLevel: LEVEL_MAP[row.experienceLevel] ?? 'Mid',
    salaryMin: row.salaryMin ?? 0,
    salaryMax: row.salaryMax ?? 0,
    tags: cleanTags(row.tags, {
      category: row.category?.slug,
      type: row.employmentType,
      level: row.experienceLevel,
    }),
    postedAt: posted.label,
    postedDaysAgo: posted.days,
    applicants: row._count.applications,
    views: row.views,
    description: row.description,
    responsibilities: splitBullets(row.responsibilities),
    requirements: splitBullets(row.requirements),
    niceToHave: [],
    benefits: splitBullets(row.benefits),
  }
}

// ---------------------------------------------------------------------------
// Queries (memoized per-request via React cache)
// ---------------------------------------------------------------------------

const JOB_INCLUDE = {
  tenant: { select: { slug: true, name: true } },
  category: { select: { name: true, slug: true } },
  _count: { select: { applications: true } },
} as const

// Valid enum values mirror the Prisma enums. Anything not in these lists is
// ignored so a malformed URL can't crash the query.
const VALID_EMPLOYMENT_TYPES = new Set([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
])
const VALID_LOCATION_TYPES = new Set(['ONSITE', 'HYBRID', 'REMOTE'])
const VALID_EXPERIENCE_LEVELS = new Set([
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'EXECUTIVE',
])

export type JobSort =
  | 'relevance'
  | 'newest'
  | 'salary-high'
  | 'salary-low'
  | 'least-applicants'

const VALID_JOB_SORTS = new Set<JobSort>([
  'relevance',
  'newest',
  'salary-high',
  'salary-low',
  'least-applicants',
])

export function sanitizeJobSort(value: string | undefined): JobSort {
  return value && VALID_JOB_SORTS.has(value as JobSort)
    ? (value as JobSort)
    : 'newest'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildJobsOrderBy(sort: JobSort | undefined): any {
  switch (sanitizeJobSort(sort)) {
    case 'salary-high':
      return { salaryMax: { sort: 'desc', nulls: 'last' } }
    case 'salary-low':
      return { salaryMin: { sort: 'asc', nulls: 'last' } }
    case 'least-applicants':
      return { applications: { _count: 'asc' } }
    default:
      return { publishedAt: 'desc' }
  }
}

export type JobFilters = {
  /** Free-text query — matched against title, description, tags, tenant name. */
  q?: string
  /** Category slug, single-select. */
  categorySlug?: string
  /** Prisma enum values, multi-select. */
  employmentTypes?: string[]
  locationTypes?: string[]
  experienceLevels?: string[]
  /** Salary in IDR. Overlap-match: a job is kept if its [salaryMin, salaryMax]
   * range overlaps with the filter [salaryMin, salaryMax] window. Jobs with
   * unknown salary are excluded when either bound is set. */
  salaryMin?: number
  salaryMax?: number
  /** Sort order. Defaults to newest (publishedAt desc). */
  sort?: JobSort
}

function sanitize(values: string[] | undefined, allowed: Set<string>): string[] {
  if (!values || values.length === 0) return []
  return values.filter((v) => allowed.has(v))
}

function safeSalary(n: number | undefined): number | undefined {
  if (n === undefined || !Number.isFinite(n)) return undefined
  if (n < 0) return undefined
  // Clamp at IDR 1 billion/month — defensive upper bound, not a real-world cap.
  return Math.min(1_000_000_000, Math.floor(n))
}

// Build the Prisma where clause from filters. Shared between findMany and count
// so pagination always counts the same set the page query reads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildJobsWhere(filters: JobFilters): any {
  const employmentTypes = sanitize(filters.employmentTypes, VALID_EMPLOYMENT_TYPES)
  const locationTypes = sanitize(filters.locationTypes, VALID_LOCATION_TYPES)
  const experienceLevels = sanitize(filters.experienceLevels, VALID_EXPERIENCE_LEVELS)
  const fMin = safeSalary(filters.salaryMin)
  const fMax = safeSalary(filters.salaryMax)
  const terms = parseQueryTerms(filters.q)

  // All AND clauses accumulate into one array so salary + per-term filters
  // don't collide on the `AND` key.
  const and: object[] = []

  // Salary overlap test:
  //   keep job if job.salaryMax >= fMin AND job.salaryMin <= fMax
  // Jobs with null salary fields are excluded when either bound is active.
  if (fMin !== undefined) and.push({ salaryMax: { gte: fMin } })
  if (fMax !== undefined) and.push({ salaryMin: { lte: fMax } })

  // Multi-term AND: every term must match somewhere (title/description/tags/
  // tenant name). More precise than treating the whole query as one substring.
  for (const term of terms) {
    and.push({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { tags: { has: term } },
        { tenant: { name: { contains: term, mode: 'insensitive' as const } } },
      ],
    })
  }

  return {
    status: 'PUBLISHED',
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(employmentTypes.length ? { employmentType: { in: employmentTypes } } : {}),
    ...(locationTypes.length ? { locationType: { in: locationTypes } } : {}),
    ...(experienceLevels.length ? { experienceLevel: { in: experienceLevels } } : {}),
    ...(and.length ? { AND: and } : {}),
  }
}

/** Relevance score for a job row against the parsed query terms. */
function jobRelevanceScore(
  row: PrismaJobWithRelations,
  terms: string[],
  fullQuery: string,
): number {
  return (
    scoreRelevance(
      [
        { text: row.title, weight: 3 },
        { text: row.tags, weight: 2 },
        { text: row.tenant?.name, weight: 1.5 },
        { text: row.description, weight: 1 },
      ],
      terms,
      fullQuery,
    ) + recencyBoost(row.publishedAt, 0.5)
  )
}

export const getAllJobs = cache(
  async (filters: JobFilters = {}): Promise<DummyJob[]> => {
    const rows = await prisma.job
      .findMany({
        where: buildJobsWhere(filters),
        orderBy: buildJobsOrderBy(filters.sort),
        include: JOB_INCLUDE,
      })
      .catch(() => [])
    return rows.map(transform)
  },
)

export type JobsPage = {
  items: DummyJob[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const DEFAULT_JOBS_PAGE_SIZE = 12

export const getJobsPage = cache(
  async (
    filters: JobFilters = {},
    page = 1,
    pageSize: number = DEFAULT_JOBS_PAGE_SIZE,
  ): Promise<JobsPage> => {
    const safePage = Math.max(1, Math.floor(page))
    const safeSize = Math.min(60, Math.max(1, Math.floor(pageSize)))
    const where = buildJobsWhere(filters)
    const q = filters.q?.trim() ?? ''
    const terms = parseQueryTerms(q)
    const useRelevance = sanitizeJobSort(filters.sort) === 'relevance' && terms.length > 0

    let total = 0
    let rows: PrismaJobWithRelations[] = []
    try {
      if (useRelevance) {
        // Relevance can't be expressed in Prisma orderBy, so rank a bounded
        // candidate pool in app code. The pool is ordered by recency first so
        // the most relevant of the freshest jobs surface on early pages.
        const RELEVANCE_POOL = 200
        const result = await prisma.$transaction([
          prisma.job.count({ where }),
          prisma.job.findMany({
            where,
            orderBy: { publishedAt: 'desc' },
            include: JOB_INCLUDE,
            take: RELEVANCE_POOL,
          }),
        ])
        total = result[0]
        const ranked = (result[1] as PrismaJobWithRelations[])
          .map((row) => ({ row, score: jobRelevanceScore(row, terms, q) }))
          .sort(
            (a, b) =>
              b.score - a.score ||
              (b.row.publishedAt?.getTime() ?? 0) - (a.row.publishedAt?.getTime() ?? 0),
          )
        rows = ranked
          .slice((safePage - 1) * safeSize, safePage * safeSize)
          .map((s) => s.row)
      } else {
        const result = await prisma.$transaction([
          prisma.job.count({ where }),
          prisma.job.findMany({
            where,
            orderBy: buildJobsOrderBy(filters.sort),
            include: JOB_INCLUDE,
            skip: (safePage - 1) * safeSize,
            take: safeSize,
          }),
        ])
        total = result[0]
        rows = result[1] as PrismaJobWithRelations[]
      }
    } catch {
      // db unreachable — fall through with empty result
    }

    const totalPages = Math.max(1, Math.ceil(total / safeSize))
    return {
      items: rows.map(transform),
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
    }
  },
)

export type JobCategorySummary = {
  slug: string
  name: string
  count: number
}

export const getJobCategories = cache(async (): Promise<JobCategorySummary[]> => {
  const rows = await prisma.jobCategory
    .findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
      },
    })
    .catch(() => [])
  return rows
    .map((c) => ({ slug: c.slug, name: c.name, count: c._count.jobs }))
    .filter((c) => c.count > 0)
})

export const findJob = cache(async (slug: string): Promise<DummyJob | undefined> => {
  const row = await prisma.job
    .findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: JOB_INCLUDE,
    })
    .catch(() => null)
  return row ? transform(row) : undefined
})

export const relatedJobs = cache(
  async (slug: string, n = 3): Promise<DummyJob[]> => {
    const current = await findJob(slug)
    if (!current) {
      const all = await getAllJobs()
      return all.slice(0, n)
    }
    const all = await getAllJobs()
    return all
      .filter((j) => j.slug !== slug)
      .sort((a, b) => {
        const aScore =
          (a.category === current.category ? 3 : 0) +
          (a.industry === current.industry ? 2 : 0) +
          (a.experienceLevel === current.experienceLevel ? 1 : 0)
        const bScore =
          (b.category === current.category ? 3 : 0) +
          (b.industry === current.industry ? 2 : 0) +
          (b.experienceLevel === current.experienceLevel ? 1 : 0)
        return bScore - aScore
      })
      .slice(0, n)
  },
)

export const EMPLOYMENT_TYPE_LABEL: Record<JobEmploymentType, string> = {
  'full-time': 'Penuh Waktu',
  'part-time': 'Paruh Waktu',
  contract: 'Kontrak',
  internship: 'Magang',
  freelance: 'Lepas',
}

export const LOCATION_TYPE_LABEL: Record<JobLocationType, string> = {
  onsite: 'Di Tempat',
  hybrid: 'Hibrida',
  remote: 'Jarak Jauh',
}
