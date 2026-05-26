import { cache } from 'react'
import { prisma } from '@/lib/db'
import { tenantMeta } from '@/lib/tenant-meta'

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

export type JobFilters = {
  /** Category slug, single-select. */
  categorySlug?: string
  /** Prisma enum values, multi-select. */
  employmentTypes?: string[]
  locationTypes?: string[]
  experienceLevels?: string[]
}

function sanitize(values: string[] | undefined, allowed: Set<string>): string[] {
  if (!values || values.length === 0) return []
  return values.filter((v) => allowed.has(v))
}

export const getAllJobs = cache(
  async (filters: JobFilters = {}): Promise<DummyJob[]> => {
    const employmentTypes = sanitize(filters.employmentTypes, VALID_EMPLOYMENT_TYPES)
    const locationTypes = sanitize(filters.locationTypes, VALID_LOCATION_TYPES)
    const experienceLevels = sanitize(filters.experienceLevels, VALID_EXPERIENCE_LEVELS)

    const rows = await prisma.job
      .findMany({
        where: {
          status: 'PUBLISHED',
          ...(filters.categorySlug
            ? { category: { slug: filters.categorySlug } }
            : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(employmentTypes.length ? ({ employmentType: { in: employmentTypes as any } } as object) : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(locationTypes.length ? ({ locationType: { in: locationTypes as any } } as object) : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(experienceLevels.length ? ({ experienceLevel: { in: experienceLevels as any } } as object) : {}),
        },
        orderBy: { publishedAt: 'desc' },
        include: JOB_INCLUDE,
      })
      .catch(() => [])
    return rows.map(transform)
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
