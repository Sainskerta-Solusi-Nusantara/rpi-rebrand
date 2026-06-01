import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { CourseCard } from '@/components/molecules/course-card'
import CoursesSidebar from '@/components/organisms/courses-sidebar'
import CoursesHeaderChips from '@/components/molecules/courses-header-chips'
import CoursesSortPills from '@/components/molecules/courses-sort-pills'
import { getServerT } from '@/lib/i18n/server-dictionary'
import {
  type CourseDuration,
  type CourseLevel,
  type CourseSort,
  DURATION_BUCKETS,
  getCoursesPage,
  sanitizeSort,
} from '@/lib/courses-data'
import {
  getCourseInstructors,
  getCourseTenants,
  sanitizeCourseInstructor,
  sanitizeCourseTenant,
} from '@/lib/courses-facets'

export const metadata: Metadata = {
  title: 'Kursus & Pelatihan',
  description:
    'Tingkatkan keterampilan dengan kursus terstruktur, sertifikat, dan jalur karier yang dirancang untuk pekerja Indonesia.',
}

// Labels are sourced from the dictionary at render time.

type FilterState = {
  level?: CourseLevel
  q?: string
  durations: CourseDuration[]
  tenant?: string
  instructor?: string
  sort: CourseSort
  page: number
}

function buildUrl(
  current: FilterState,
  patch: Partial<{
    level: CourseLevel | null
    q: string | null
    durations: CourseDuration[]
    tenant: string | null
    instructor: string | null
    sort: CourseSort
    page: number
    keepPage: boolean
  }>,
): string {
  const next = {
    level: 'level' in patch ? patch.level ?? undefined : current.level,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    durations: patch.durations ?? current.durations,
    tenant: 'tenant' in patch ? patch.tenant ?? undefined : current.tenant,
    instructor:
      'instructor' in patch ? patch.instructor ?? undefined : current.instructor,
    sort: patch.sort ?? current.sort,
    page: patch.page ?? (patch.keepPage ? current.page : 1),
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.level) params.push(`level=${next.level}`)
  if (next.durations.length)
    params.push(`duration=${next.durations.join(',')}`)
  if (next.tenant) params.push(`tenant=${encodeURIComponent(next.tenant)}`)
  if (next.instructor)
    params.push(`instructor=${encodeURIComponent(next.instructor)}`)
  if (next.sort !== 'newest') params.push(`sort=${next.sort}`)
  if (next.page > 1) params.push(`page=${next.page}`)
  return params.length ? `/courses?${params.join('&')}` : '/courses'
}

function parseMulti(v: string | string[] | undefined): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.flatMap((x) => x.split(',')).filter(Boolean)
  return v.split(',').filter(Boolean)
}

function toggleDuration(
  list: CourseDuration[],
  value: CourseDuration,
): CourseDuration[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const tc = t.public.courses
  const LEVEL_LABEL: Record<CourseLevel, string> = tc.levelLabels
  const SORT_LABEL: Record<CourseSort, string> = tc.sortLabels

  const rawLevel =
    typeof searchParams.level === 'string' ? searchParams.level.toLowerCase() : ''
  const level: CourseLevel | undefined =
    rawLevel === 'beginner' || rawLevel === 'intermediate' || rawLevel === 'advanced'
      ? rawLevel
      : undefined
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeDurations = parseMulti(searchParams.duration).filter(
    (v): v is CourseDuration => v === 'short' || v === 'medium' || v === 'long',
  )
  const activeSort = sanitizeSort(
    typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  )
  const pageParam =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const activePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  // Facets load first so we can sanitize tenant/instructor against known sets.
  const [tenants, instructors] = await Promise.all([
    getCourseTenants(),
    getCourseInstructors(),
  ])
  const activeTenant = sanitizeCourseTenant(
    typeof searchParams.tenant === 'string' ? searchParams.tenant : undefined,
    tenants.map((t) => t.slug),
  )
  const activeInstructor = sanitizeCourseInstructor(
    typeof searchParams.instructor === 'string' ? searchParams.instructor : undefined,
    instructors.map((i) => i.id),
  )

  const current: FilterState = {
    level,
    q: activeQuery || undefined,
    durations: activeDurations,
    tenant: activeTenant,
    instructor: activeInstructor,
    sort: activeSort,
    page: activePage,
  }

  const result = await getCoursesPage(
    {
      ...(level ? { level } : {}),
      ...(activeQuery ? { q: activeQuery } : {}),
      ...(activeDurations.length ? { durations: activeDurations } : {}),
      ...(activeTenant ? { tenantSlug: activeTenant } : {}),
      ...(activeInstructor ? { instructorId: activeInstructor } : {}),
      sort: activeSort,
    },
    activePage,
  )
  const courses = result.items
  const totalPages = result.totalPages

  const hasAnyFilter =
    !!level ||
    !!activeQuery ||
    activeDurations.length > 0 ||
    !!activeTenant ||
    !!activeInstructor

  // Pre-build sidebar items
  const LEVELS: CourseLevel[] = ['beginner', 'intermediate', 'advanced']
  const sidebarLevels = LEVELS.map((lvl) => ({
    label: LEVEL_LABEL[lvl],
    href:
      level === lvl
        ? buildUrl(current, { level: null })
        : buildUrl(current, { level: lvl }),
    active: level === lvl,
  }))
  const sidebarDurations = (Object.keys(DURATION_BUCKETS) as CourseDuration[]).map(
    (d) => ({
      label: DURATION_BUCKETS[d].label,
      href: buildUrl(current, { durations: toggleDuration(activeDurations, d) }),
      active: activeDurations.includes(d),
    }),
  )
  const sidebarTenants = tenants.map((t) => ({
    label: t.name,
    count: t.count,
    href:
      activeTenant === t.slug
        ? buildUrl(current, { tenant: null })
        : buildUrl(current, { tenant: t.slug }),
    active: activeTenant === t.slug,
  }))
  const sidebarInstructors = instructors.map((i) => ({
    label: i.name,
    count: i.count,
    href:
      activeInstructor === i.id
        ? buildUrl(current, { instructor: null })
        : buildUrl(current, { instructor: i.id }),
    active: activeInstructor === i.id,
  }))

  // Header chips for all active filters
  const chips: { label: string; clearHref: string }[] = []
  if (activeQuery) {
    chips.push({
      label: `"${activeQuery}"`,
      clearHref: buildUrl(current, { q: null }),
    })
  }
  if (level) {
    chips.push({
      label: LEVEL_LABEL[level],
      clearHref: buildUrl(current, { level: null }),
    })
  }
  for (const d of activeDurations) {
    chips.push({
      label: DURATION_BUCKETS[d].label,
      clearHref: buildUrl(current, {
        durations: toggleDuration(activeDurations, d),
      }),
    })
  }
  if (activeTenant) {
    const t = tenants.find((x) => x.slug === activeTenant)
    if (t) {
      chips.push({
        label: t.name,
        clearHref: buildUrl(current, { tenant: null }),
      })
    }
  }
  if (activeInstructor) {
    const i = instructors.find((x) => x.id === activeInstructor)
    if (i) {
      chips.push({
        label: i.name,
        clearHref: buildUrl(current, { instructor: null }),
      })
    }
  }

  // Sort pill options
  const sortOptions = (Object.keys(SORT_LABEL) as CourseSort[]).map((s) => ({
    value: s,
    label: SORT_LABEL[s],
    href: buildUrl(current, { sort: s }),
    active: activeSort === s,
  }))

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">{tc.title}</h1>
        <p className="text-muted-foreground mt-2">
          {result.total.toLocaleString('id-ID')} {tc.counter.courses}
          {activeQuery && (
            <>
              {' '}{t.public.jobs.counter.forQuery} &ldquo;
              <strong className="text-foreground font-medium">{activeQuery}</strong>
              &rdquo;
            </>
          )}
          {totalPages > 1 && (
            <>
              {' '}· {t.public.jobs.counter.page}{' '}
              <strong className="text-foreground font-medium">{activePage}</strong>{' '}
              {t.public.jobs.counter.of} {totalPages}
            </>
          )}
        </p>

        {/* Search form — submits as GET, preserves other filters via hidden inputs */}
        <form method="get" action="/courses" className="mt-5 max-w-2xl">
          <div className="border-border bg-card focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery}
              placeholder={tc.searchPlaceholder}
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label={tc.searchAria}
            />
            {activeQuery && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={buildUrl(current, { q: null }) as any}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                <X className="h-3 w-3" aria-hidden />
                {tc.clear}
              </Link>
            )}
            <button
              type="submit"
              className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
            >
              {tc.searchCta}
            </button>
          </div>
          {/* Preserve other filters on submit */}
          {level && <input type="hidden" name="level" value={level} />}
          {activeDurations.length > 0 && (
            <input type="hidden" name="duration" value={activeDurations.join(',')} />
          )}
          {activeTenant && (
            <input type="hidden" name="tenant" value={activeTenant} />
          )}
          {activeInstructor && (
            <input type="hidden" name="instructor" value={activeInstructor} />
          )}
          {activeSort !== 'newest' && (
            <input type="hidden" name="sort" value={activeSort} />
          )}
        </form>

        <CoursesHeaderChips chips={chips} clearAllHref="/courses" />
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <CoursesSidebar
          levels={sidebarLevels}
          durations={sidebarDurations}
          tenants={sidebarTenants}
          instructors={sidebarInstructors}
        />

        <section aria-label="Daftar kursus">
          <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
            <CoursesSortPills options={sortOptions} />
          </div>

          {courses.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                {tc.empty.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {hasAnyFilter ? tc.empty.withFilter : tc.empty.none}
              </p>
              {hasAnyFilter && (
                <Link
                  href="/courses"
                  className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
                >
                  {tc.empty.clear}
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/courses/${c.slug}` as any}
                    className="block"
                  >
                    <CourseCard
                      title={c.title}
                      instructor={c.instructor.name}
                      level={c.level}
                      durationHours={c.durationHours}
                      lessonsCount={c.lessonsCount}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <CoursesPagination
              current={current}
              page={activePage}
              totalPages={totalPages}
              labels={{
                previous: t.public.jobs.pagination.previous,
                next: t.public.jobs.pagination.next,
                pageAria: t.public.jobs.pagination.pageAria,
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function CoursesPagination({
  current,
  page,
  totalPages,
  labels,
}: {
  current: FilterState
  page: number
  totalPages: number
  labels: { previous: string; next: string; pageAria: string }
}) {
  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  const pages: (number | 'ellipsis')[] = []
  const window = 1
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-2 text-sm"
    >
      <PageLink current={current} page={prevPage} disabled={page === 1} aria={labels.previous}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{labels.previous}</span>
      </PageLink>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-xs">
            …
          </span>
        ) : (
          <PageLink
            key={p}
            current={current}
            page={p}
            active={p === page}
            aria={`${labels.pageAria} ${p}`}
          >
            {p}
          </PageLink>
        ),
      )}

      <PageLink
        current={current}
        page={nextPage}
        disabled={page === totalPages}
        aria={labels.next}
      >
        <span className="hidden sm:inline">{labels.next}</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </PageLink>
    </nav>
  )
}

function PageLink({
  current,
  page,
  active,
  disabled,
  aria,
  children,
}: {
  current: FilterState
  page: number
  active?: boolean
  disabled?: boolean
  aria: string
  children: React.ReactNode
}) {
  const className = active
    ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium'
    : disabled
      ? 'border-border text-muted-foreground/40 inline-flex min-w-[36px] cursor-not-allowed items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm'
      : 'border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm transition'
  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={buildUrl(current, { page, keepPage: true }) as any}
      className={className}
      aria-label={aria}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}
