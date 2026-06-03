import { cache } from 'react'
import { prisma } from '@/lib/db'
import { parseQueryTerms, scoreRelevance, recencyBoost } from '@/lib/search/relevance'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export type CourseLesson = {
  title: string
  durationMin: number
  type: 'video' | 'article' | 'quiz' | 'project'
}

export type CourseModule = {
  title: string
  durationMin: number
  lessons: CourseLesson[]
}

export type DummyCourse = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  level: CourseLevel
  durationHours: number
  lessonsCount: number
  studentsCount: number
  rating: number
  reviewsCount: number
  language: string
  certificate: boolean
  priceIdr: number | 'free'
  originalPriceIdr?: number
  gradient: [string, string]
  emoji: string
  category: string
  instructor: {
    name: string
    role: string
    bio: string
    initial: string
    color: string
    coursesCount: number
    studentsCount: string
  }
  whatYouLearn: string[]
  requirements: string[]
  targetAudience: string[]
  modules: CourseModule[]
  tags: string[]
}

// ---------------------------------------------------------------------------
// Enum + presentation maps
// ---------------------------------------------------------------------------

const LEVEL_FROM_DB: Record<string, CourseLevel> = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
}

const LESSON_TYPE_FROM_DB: Record<string, CourseLesson['type']> = {
  VIDEO: 'video',
  ARTICLE: 'article',
  QUIZ: 'quiz',
  ASSIGNMENT: 'project',
  DOWNLOAD: 'article',
}

// Palette for slug-deterministic gradient + emoji selection
const GRADIENT_PALETTE: [string, string][] = [
  ['#635BFF', '#0EA5E9'],
  ['#0EA5E9', '#8B5CF6'],
  ['#EC4899', '#8B5CF6'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#0EA5E9'],
  ['#EC4899', '#F59E0B'],
  ['#0EA5E9', '#10B981'],
  ['#8B5CF6', '#0A2540'],
]

const EMOJI_PALETTE = ['📚', '⚛️', '🗄️', '🎯', '📡', '☁️', '🔒', '🎧', '🐍', '🎨', '🤖', '⚙️', '📢', '🧭', '💼', '📱', '🎤']

const INSTRUCTOR_COLOR_PALETTE = [
  '#635BFF', '#EC4899', '#0EA5E9', '#10B981',
  '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#0A2540',
]

function hashSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h << 5) - h + slug.charCodeAt(i)
  return Math.abs(h)
}

function pickByHash<T>(palette: T[], slug: string, salt = 0): T {
  return palette[(hashSlug(slug) + salt) % palette.length]!
}

function initialsFrom(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function firstSentence(text: string, maxLen = 120): string {
  const trimmed = text.trim()
  const end = trimmed.search(/[.!?]\s/)
  if (end > 0 && end < maxLen) return trimmed.slice(0, end + 1)
  return trimmed.slice(0, maxLen) + (trimmed.length > maxLen ? '…' : '')
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

type PrismaCourseWithRelations = {
  id: string
  slug: string
  title: string
  description: string
  thumbnail: string | null
  level: string
  durationHours: number
  publishedAt: Date | null
  instructor: {
    id: string
    name: string | null
    headline: string | null
    bio: string | null
    image: string | null
  } | null
  modules: {
    title: string
    durationMin: number
    lessons: {
      title: string
      durationMin: number
      contentType: string
    }[]
  }[]
  _count: { enrollments: number }
}

function transform(row: PrismaCourseWithRelations): DummyCourse {
  const lessonsCount = row.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const modules: CourseModule[] = row.modules.map((m) => ({
    title: m.title,
    durationMin: m.durationMin,
    lessons: m.lessons.map((l) => ({
      title: l.title,
      durationMin: l.durationMin,
      type: LESSON_TYPE_FROM_DB[l.contentType] ?? 'article',
    })),
  }))

  const instructorName = row.instructor?.name ?? 'Instruktur RPI'
  const instructorRole = row.instructor?.headline ?? 'Pengajar Bersertifikat'

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: firstSentence(row.description),
    description: row.description,
    longDescription: row.description,
    level: LEVEL_FROM_DB[row.level] ?? 'beginner',
    durationHours: row.durationHours,
    lessonsCount,
    studentsCount: row._count.enrollments,
    rating: 4.7,
    reviewsCount: Math.max(8, row._count.enrollments * 4),
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: pickByHash(GRADIENT_PALETTE, row.slug),
    emoji: pickByHash(EMOJI_PALETTE, row.slug, 3),
    category: 'Pelatihan',
    instructor: {
      name: instructorName,
      role: instructorRole,
      bio:
        row.instructor?.bio ??
        `${instructorName} adalah pengajar di RPI Academy dengan pengalaman praktis di industri.`,
      initial: initialsFrom(instructorName),
      color: pickByHash(INSTRUCTOR_COLOR_PALETTE, instructorName, 7),
      coursesCount: 1,
      studentsCount: row._count.enrollments.toLocaleString('id-ID'),
    },
    whatYouLearn: [],
    requirements: [],
    targetAudience: [],
    modules,
    tags: [],
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const COURSE_INCLUDE = {
  instructor: { select: { id: true, name: true, headline: true, bio: true, image: true } },
  modules: {
    orderBy: { order: 'asc' as const },
    select: {
      title: true,
      durationMin: true,
      lessons: {
        orderBy: { order: 'asc' as const },
        select: { title: true, durationMin: true, contentType: true },
      },
    },
  },
  _count: { select: { enrollments: true } },
} as const

export type CourseDuration = 'short' | 'medium' | 'long'
export type CourseSort = 'relevance' | 'newest' | 'popular' | 'alpha'

export const DURATION_BUCKETS: Record<
  CourseDuration,
  { label: string; min?: number; max?: number }
> = {
  short: { label: 'Pendek (≤ 8 jam)', max: 8 },
  medium: { label: 'Menengah (8–20 jam)', min: 9, max: 20 },
  long: { label: 'Panjang (> 20 jam)', min: 21 },
}

const VALID_DURATIONS = new Set<CourseDuration>(['short', 'medium', 'long'])
const VALID_SORTS = new Set<CourseSort>(['relevance', 'newest', 'popular', 'alpha'])

export type CourseFilters = {
  level?: CourseLevel
  /** Free-text query — matched against title, description, instructor name. */
  q?: string
  /** Duration buckets, multi-select. */
  durations?: CourseDuration[]
  /** Sort order. Defaults to newest. */
  sort?: CourseSort
  /** Filter by tenant (mitra) slug. */
  tenantSlug?: string
  /** Filter by instructor user id. */
  instructorId?: string
}

function sanitizeDurations(values: string[] | undefined): CourseDuration[] {
  if (!values) return []
  return values.filter((v): v is CourseDuration =>
    VALID_DURATIONS.has(v as CourseDuration),
  )
}

export function sanitizeSort(value: string | undefined): CourseSort {
  return value && VALID_SORTS.has(value as CourseSort)
    ? (value as CourseSort)
    : 'newest'
}

function durationClause(d: CourseDuration): object {
  const b = DURATION_BUCKETS[d]
  if (b.min !== undefined && b.max !== undefined) {
    return { durationHours: { gte: b.min, lte: b.max } }
  }
  if (b.min !== undefined) return { durationHours: { gte: b.min } }
  if (b.max !== undefined) return { durationHours: { lte: b.max } }
  return {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCoursesWhere(filters: CourseFilters): any {
  const dbLevel = filters.level
    ? Object.entries(LEVEL_FROM_DB).find(([, v]) => v === filters.level)?.[0]
    : undefined
  const durations = sanitizeDurations(filters.durations)
  const terms = parseQueryTerms(filters.q)

  // All AND clauses accumulate into one array so duration + per-term filters
  // don't collide on the `AND` key.
  const and: object[] = []

  // Duration multi-select: a course matches if it fits any selected bucket.
  if (durations.length) and.push({ OR: durations.map(durationClause) })

  // Multi-term AND: every term must match somewhere (title/description/
  // instructor name). More precise than treating the whole query as one substring.
  for (const term of terms) {
    and.push({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { instructor: { name: { contains: term, mode: 'insensitive' as const } } },
      ],
    })
  }

  return {
    status: 'PUBLISHED',
    ...(dbLevel ? { level: dbLevel } : {}),
    ...(filters.tenantSlug ? { tenant: { slug: filters.tenantSlug } } : {}),
    ...(filters.instructorId ? { instructorId: filters.instructorId } : {}),
    ...(and.length ? { AND: and } : {}),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCoursesOrderBy(sort: CourseSort | undefined): any {
  switch (sanitizeSort(sort)) {
    case 'popular':
      return { enrollments: { _count: 'desc' as const } }
    case 'alpha':
      return { title: 'asc' as const }
    // 'relevance' and 'newest' both use recency as the DB ordering;
    // relevance re-sorts the pool in app code.
    default:
      return { publishedAt: 'desc' as const }
  }
}

/** Relevance score for a course row against the parsed query terms. */
function courseRelevanceScore(
  row: PrismaCourseWithRelations,
  terms: string[],
  fullQuery: string,
): number {
  return (
    scoreRelevance(
      [
        { text: row.title, weight: 3 },
        { text: row.instructor?.name, weight: 2 },
        { text: row.description, weight: 1 },
      ],
      terms,
      fullQuery,
    ) + recencyBoost(row.publishedAt, 0.5)
  )
}

export const getAllCourses = cache(
  async (filters: CourseFilters = {}): Promise<DummyCourse[]> => {
    const rows = await prisma.course
      .findMany({
        where: buildCoursesWhere(filters),
        orderBy: buildCoursesOrderBy(filters.sort),
        include: COURSE_INCLUDE,
      })
      .catch(() => [])
    return rows.map(transform)
  },
)

export type CoursesPage = {
  items: DummyCourse[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const DEFAULT_COURSES_PAGE_SIZE = 9

export const getCoursesPage = cache(
  async (
    filters: CourseFilters = {},
    page = 1,
    pageSize: number = DEFAULT_COURSES_PAGE_SIZE,
  ): Promise<CoursesPage> => {
    const safePage = Math.max(1, Math.floor(page))
    const safeSize = Math.min(60, Math.max(1, Math.floor(pageSize)))
    const where = buildCoursesWhere(filters)
    const q = filters.q?.trim() ?? ''
    const terms = parseQueryTerms(q)
    const useRelevance = sanitizeSort(filters.sort) === 'relevance' && terms.length > 0

    let total = 0
    let rows: PrismaCourseWithRelations[] = []
    try {
      if (useRelevance) {
        // Relevance can't be expressed in Prisma orderBy, so rank a bounded
        // candidate pool in app code. The pool is ordered by recency first so
        // the most relevant of the freshest courses surface on early pages.
        const RELEVANCE_POOL = 200
        const result = await prisma.$transaction([
          prisma.course.count({ where }),
          prisma.course.findMany({
            where,
            orderBy: { publishedAt: 'desc' },
            include: COURSE_INCLUDE,
            take: RELEVANCE_POOL,
          }),
        ])
        total = result[0]
        const ranked = (result[1] as PrismaCourseWithRelations[])
          .map((row) => ({ row, score: courseRelevanceScore(row, terms, q) }))
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
          prisma.course.count({ where }),
          prisma.course.findMany({
            where,
            orderBy: buildCoursesOrderBy(filters.sort),
            include: COURSE_INCLUDE,
            skip: (safePage - 1) * safeSize,
            take: safeSize,
          }),
        ])
        total = result[0]
        rows = result[1] as PrismaCourseWithRelations[]
      }
    } catch {
      // db unreachable
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

export const findCourse = cache(async (slug: string): Promise<DummyCourse | undefined> => {
  const row = await prisma.course
    .findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: COURSE_INCLUDE,
    })
    .catch(() => null)
  return row ? transform(row) : undefined
})

export const relatedCourses = cache(
  async (slug: string, n = 3): Promise<DummyCourse[]> => {
    const current = await findCourse(slug)
    const all = await getAllCourses()
    if (!current) return all.slice(0, n)
    return all
      .filter((c) => c.slug !== slug)
      .sort((a, b) => {
        const aScore =
          (a.category === current.category ? 3 : 0) +
          (a.instructor.name === current.instructor.name ? 2 : 0) +
          (a.level === current.level ? 1 : 0)
        const bScore =
          (b.category === current.category ? 3 : 0) +
          (b.instructor.name === current.instructor.name ? 2 : 0) +
          (b.level === current.level ? 1 : 0)
        return bScore - aScore
      })
      .slice(0, n)
  },
)

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Lanjutan',
}

export const LEVEL_COLOR: Record<CourseLevel, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
}

export const LESSON_TYPE_LABEL: Record<CourseLesson['type'], string> = {
  video: 'Video',
  article: 'Artikel',
  quiz: 'Kuis',
  project: 'Proyek',
}
