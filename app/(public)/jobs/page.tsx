import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { JobCard } from '@/components/molecules/job-card'
import { SaveSearchCta } from '@/components/organisms/save-search-cta'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'
import {
  getJobCategories,
  getJobsPage,
  sanitizeJobSort,
  type JobSort,
} from '@/lib/jobs-data'

export const metadata: Metadata = {
  title: 'Cari Lowongan Pekerjaan',
  description:
    'Telusuri ribuan lowongan kerja terverifikasi di seluruh Indonesia. Saring berdasarkan kategori, lokasi, jenis pekerjaan, dan rentang gaji.',
}

// ---------------------------------------------------------------------------
// Filter option enum value lists — labels are looked up from the dictionary
// at render time so locale changes propagate without redeployment.
// ---------------------------------------------------------------------------

const EMPLOYMENT_VALUES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] as const
const LOCATION_VALUES = ['ONSITE', 'HYBRID', 'REMOTE'] as const
const LEVEL_VALUES = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'] as const

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function parseMulti(v: string | string[] | undefined): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.flatMap((x) => x.split(',')).filter(Boolean)
  return v.split(',').filter(Boolean)
}

type FilterState = {
  q?: string
  category?: string
  type: string[]
  location: string[]
  level: string[]
  salaryMin?: number
  salaryMax?: number
  sort: JobSort
  page: number
}

type FilterPatch = Partial<{
  q: string | null
  category: string | null
  type: string[]
  location: string[]
  level: string[]
  salaryMin: number | null
  salaryMax: number | null
  sort: JobSort
  /** Set true to keep current page; defaults to resetting to 1 when filters change. */
  keepPage: boolean
  /** Explicit page override. */
  page: number
}>

function buildUrl(current: FilterState, patch: FilterPatch): string {
  const next = {
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    category: 'category' in patch ? patch.category ?? undefined : current.category,
    type: patch.type ?? current.type,
    location: patch.location ?? current.location,
    level: patch.level ?? current.level,
    salaryMin:
      'salaryMin' in patch ? patch.salaryMin ?? undefined : current.salaryMin,
    salaryMax:
      'salaryMax' in patch ? patch.salaryMax ?? undefined : current.salaryMax,
    sort: patch.sort ?? current.sort,
    page: patch.page ?? (patch.keepPage ? current.page : 1),
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category) params.push(`category=${next.category}`)
  if (next.type.length) params.push(`type=${next.type.join(',')}`)
  if (next.location.length) params.push(`location=${next.location.join(',')}`)
  if (next.level.length) params.push(`level=${next.level.join(',')}`)
  if (next.salaryMin !== undefined) params.push(`salaryMin=${next.salaryMin}`)
  if (next.salaryMax !== undefined) params.push(`salaryMax=${next.salaryMax}`)
  if (next.sort !== 'newest') params.push(`sort=${next.sort}`)
  if (next.page > 1) params.push(`page=${next.page}`)
  return params.length ? `/jobs?${params.join('&')}` : '/jobs'
}

const SORT_VALUES: JobSort[] = [
  'newest',
  'salary-high',
  'salary-low',
  'least-applicants',
]

// ---------------------------------------------------------------------------
// Salary preset chips
// ---------------------------------------------------------------------------

type SalaryPreset = {
  id: string
  label: string
  min?: number
  max?: number
}

const SALARY_PRESETS: SalaryPreset[] = [
  { id: 'lt-5',     label: '< Rp 5jt',         max: 5_000_000 },
  { id: '5-10',     label: 'Rp 5–10jt',         min: 5_000_000,  max: 10_000_000 },
  { id: '10-25',    label: 'Rp 10–25jt',        min: 10_000_000, max: 25_000_000 },
  { id: '25-50',    label: 'Rp 25–50jt',        min: 25_000_000, max: 50_000_000 },
  { id: 'gt-50',    label: '> Rp 50jt',         min: 50_000_000 },
]

function matchPreset(min?: number, max?: number): SalaryPreset | undefined {
  return SALARY_PRESETS.find((p) => p.min === min && p.max === max)
}

function formatRupiahShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${Math.round(n / 1_000_000)}jt`
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}rb`
  return `Rp ${n}`
}

function salaryChipLabel(min?: number, max?: number): string {
  const preset = matchPreset(min, max)
  if (preset) return preset.label
  if (min !== undefined && max !== undefined)
    return `${formatRupiahShort(min)} – ${formatRupiahShort(max)}`
  if (min !== undefined) return `≥ ${formatRupiahShort(min)}`
  if (max !== undefined) return `≤ ${formatRupiahShort(max)}`
  return ''
}

function parseSalary(v: string | string[] | undefined): number | undefined {
  if (typeof v !== 'string') return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const tj = t.public.jobs
  const employmentOptions = EMPLOYMENT_VALUES.map((value) => ({
    value,
    label: tj.employmentLabels[value],
  }))
  const locationOptions = LOCATION_VALUES.map((value) => ({
    value,
    label: tj.locationLabels[value],
  }))
  const levelOptions = LEVEL_VALUES.map((value) => ({
    value,
    label: tj.levelLabels[value],
  }))
  const sortOptions = SORT_VALUES.map((value) => ({
    value,
    label: tj.sortOptions[value],
  }))

  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeCategory =
    typeof searchParams.category === 'string' ? searchParams.category : undefined
  const activeTypes = parseMulti(searchParams.type)
  const activeLocations = parseMulti(searchParams.location)
  const activeLevels = parseMulti(searchParams.level)
  const activeSalaryMin = parseSalary(searchParams.salaryMin)
  const activeSalaryMax = parseSalary(searchParams.salaryMax)
  const activeSort = sanitizeJobSort(
    typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  )
  const pageParam =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const activePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const current: FilterState = {
    q: activeQuery || undefined,
    category: activeCategory,
    type: activeTypes,
    location: activeLocations,
    level: activeLevels,
    salaryMin: activeSalaryMin,
    salaryMax: activeSalaryMax,
    sort: activeSort,
    page: activePage,
  }
  const hasAnyFilter =
    !!activeQuery ||
    !!activeCategory ||
    activeTypes.length > 0 ||
    activeLocations.length > 0 ||
    activeLevels.length > 0 ||
    activeSalaryMin !== undefined ||
    activeSalaryMax !== undefined

  const [pageResult, categories, session] = await Promise.all([
    getJobsPage(
      {
        q: activeQuery || undefined,
        categorySlug: activeCategory,
        employmentTypes: activeTypes,
        locationTypes: activeLocations,
        experienceLevels: activeLevels,
        salaryMin: activeSalaryMin,
        salaryMax: activeSalaryMax,
        sort: activeSort,
      },
      activePage,
    ),
    getJobCategories(),
    auth(),
  ])
  const isAuthenticated = Boolean(session?.user)
  const jobs = pageResult.items
  const total = pageResult.total
  const totalPages = pageResult.totalPages
  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name
    : undefined

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">{tj.title}</h1>
        <p className="text-muted-foreground mt-2">
          {total.toLocaleString('id-ID')} {tj.counter.jobs}
          {activeQuery && (
            <>
              {' '}{tj.counter.forQuery} &ldquo;
              <strong className="text-foreground font-medium">{activeQuery}</strong>
              &rdquo;
            </>
          )}
          {totalPages > 1 && (
            <>
              {' '}· {tj.counter.page}{' '}
              <strong className="text-foreground font-medium">{activePage}</strong>
              {' '}{tj.counter.of} {totalPages}
            </>
          )}
        </p>

        {/* Search form — submits as GET, preserves other filters via hidden inputs */}
        <form method="get" action="/jobs" className="mt-5 max-w-2xl">
          <div className="border-border bg-card focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery}
              placeholder={tj.searchPlaceholder}
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label={tj.searchAria}
            />
            {activeQuery && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={buildUrl(current, { q: null }) as any}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                <X className="h-3 w-3" aria-hidden />
                {tj.clear}
              </Link>
            )}
            <button
              type="submit"
              className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
            >
              {tj.searchCta}
            </button>
          </div>
          {/* Preserve other filters when submitting a new search */}
          {activeCategory && (
            <input type="hidden" name="category" value={activeCategory} />
          )}
          {activeTypes.length > 0 && (
            <input type="hidden" name="type" value={activeTypes.join(',')} />
          )}
          {activeLocations.length > 0 && (
            <input type="hidden" name="location" value={activeLocations.join(',')} />
          )}
          {activeLevels.length > 0 && (
            <input type="hidden" name="level" value={activeLevels.join(',')} />
          )}
          {activeSalaryMin !== undefined && (
            <input type="hidden" name="salaryMin" value={activeSalaryMin} />
          )}
          {activeSalaryMax !== undefined && (
            <input type="hidden" name="salaryMax" value={activeSalaryMax} />
          )}
          {activeSort !== 'newest' && (
            <input type="hidden" name="sort" value={activeSort} />
          )}
        </form>

        {hasAnyFilter && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeQuery && (
              <FilterChip
                label={`"${activeQuery}"`}
                clearHref={buildUrl(current, { q: null })}
              />
            )}
            {activeCategoryName && (
              <FilterChip
                label={activeCategoryName}
                clearHref={buildUrl(current, { category: null })}
              />
            )}
            {activeTypes.map((v) => {
              const opt = employmentOptions.find((o) => o.value === v)
              if (!opt) return null
              return (
                <FilterChip
                  key={`type-${v}`}
                  label={opt.label}
                  clearHref={buildUrl(current, { type: toggle(activeTypes, v) })}
                />
              )
            })}
            {activeLocations.map((v) => {
              const opt = locationOptions.find((o) => o.value === v)
              if (!opt) return null
              return (
                <FilterChip
                  key={`loc-${v}`}
                  label={opt.label}
                  clearHref={buildUrl(current, { location: toggle(activeLocations, v) })}
                />
              )
            })}
            {activeLevels.map((v) => {
              const opt = levelOptions.find((o) => o.value === v)
              if (!opt) return null
              return (
                <FilterChip
                  key={`lvl-${v}`}
                  label={opt.label}
                  clearHref={buildUrl(current, { level: toggle(activeLevels, v) })}
                />
              )
            })}
            {(activeSalaryMin !== undefined || activeSalaryMax !== undefined) && (
              <FilterChip
                label={salaryChipLabel(activeSalaryMin, activeSalaryMax)}
                clearHref={buildUrl(current, {
                  salaryMin: null,
                  salaryMax: null,
                })}
              />
            )}
            <Link
              href="/jobs"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
            >
              <X className="h-3 w-3" aria-hidden />
              {tj.clearAll}
            </Link>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label={tj.filtersLabel} className="space-y-8">
          <FilterGroup title={tj.filters.category}>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-xs">{tj.filters.noCategories}</p>
            ) : (
              categories.map((c) => (
                <ToggleRow
                  key={c.slug}
                  label={c.name}
                  count={c.count}
                  active={c.slug === activeCategory}
                  href={
                    c.slug === activeCategory
                      ? buildUrl(current, { category: null })
                      : buildUrl(current, { category: c.slug })
                  }
                />
              ))
            )}
          </FilterGroup>

          <FilterGroup title={tj.filters.employmentType}>
            {employmentOptions.map((o) => {
              const active = activeTypes.includes(o.value)
              return (
                <ToggleRow
                  key={o.value}
                  label={o.label}
                  active={active}
                  href={buildUrl(current, { type: toggle(activeTypes, o.value) })}
                />
              )
            })}
          </FilterGroup>

          <FilterGroup title={tj.filters.location}>
            {locationOptions.map((o) => {
              const active = activeLocations.includes(o.value)
              return (
                <ToggleRow
                  key={o.value}
                  label={o.label}
                  active={active}
                  href={buildUrl(current, {
                    location: toggle(activeLocations, o.value),
                  })}
                />
              )
            })}
          </FilterGroup>

          <FilterGroup title={tj.filters.experienceLevel}>
            {levelOptions.map((o) => {
              const active = activeLevels.includes(o.value)
              return (
                <ToggleRow
                  key={o.value}
                  label={o.label}
                  active={active}
                  href={buildUrl(current, { level: toggle(activeLevels, o.value) })}
                />
              )
            })}
          </FilterGroup>

          <FilterGroup title={tj.filters.salaryRange}>
            <div className="flex flex-wrap gap-1.5">
              {SALARY_PRESETS.map((p) => {
                const active =
                  current.salaryMin === p.min && current.salaryMax === p.max
                return (
                  <Link
                    key={p.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={
                      buildUrl(current, {
                        salaryMin: active ? null : p.min ?? null,
                        salaryMax: active ? null : p.max ?? null,
                      }) as any
                    }
                    className={
                      active
                        ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] rounded-full border px-2.5 py-1 text-[11px] font-medium transition'
                        : 'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] rounded-full border px-2.5 py-1 text-[11px] transition'
                    }
                    aria-current={active ? 'true' : undefined}
                  >
                    {p.label}
                  </Link>
                )
              })}
            </div>

            <form method="get" action="/jobs" className="mt-4 space-y-2">
              <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                {tj.filters.customSalary}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500_000}
                  name="salaryMin"
                  defaultValue={current.salaryMin ?? ''}
                  placeholder={tj.filters.minPlaceholder}
                  aria-label={tj.filters.minAria}
                  className="border-border bg-background focus:border-[color:var(--ring)] focus:ring-[color:var(--ring)]/30 rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-2"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500_000}
                  name="salaryMax"
                  defaultValue={current.salaryMax ?? ''}
                  placeholder={tj.filters.maxPlaceholder}
                  aria-label={tj.filters.maxAria}
                  className="border-border bg-background focus:border-[color:var(--ring)] focus:ring-[color:var(--ring)]/30 rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-2"
                />
              </div>
              {/* Preserve other active filters when applying custom salary */}
              {activeQuery && <input type="hidden" name="q" value={activeQuery} />}
              {activeCategory && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              {activeTypes.length > 0 && (
                <input type="hidden" name="type" value={activeTypes.join(',')} />
              )}
              {activeLocations.length > 0 && (
                <input
                  type="hidden"
                  name="location"
                  value={activeLocations.join(',')}
                />
              )}
              {activeLevels.length > 0 && (
                <input type="hidden" name="level" value={activeLevels.join(',')} />
              )}
              {activeSort !== 'newest' && (
                <input type="hidden" name="sort" value={activeSort} />
              )}
              <button
                type="submit"
                className="border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] mt-1 inline-flex w-full items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium transition"
              >
                {tj.filters.apply}
              </button>
            </form>
          </FilterGroup>
        </aside>

        <section aria-label={tj.listAria}>
          {hasAnyFilter && (
            <SaveSearchCta isAuthenticated={isAuthenticated} />
          )}
          {jobs.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                {tj.sortLabel}
              </span>
              {sortOptions.map((o) => {
                const active = activeSort === o.value
                return (
                  <Link
                    key={o.value}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={buildUrl(current, { sort: o.value }) as any}
                    aria-current={active ? 'true' : undefined}
                    className={
                      active
                        ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition'
                        : 'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center rounded-full border px-3 py-1 text-xs transition'
                    }
                  >
                    {o.label}
                  </Link>
                )
              })}
            </div>
          )}
          {jobs.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                {tj.empty.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {hasAnyFilter ? tj.empty.withFilter : tj.empty.none}
              </p>
              {hasAnyFilter && (
                <Link
                  href="/jobs"
                  className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
                >
                  {tj.clearFilters}
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.slug}`} className="block">
                    <JobCard
                      title={j.title}
                      company={j.company}
                      location={j.location}
                      locationType={j.locationType}
                      employmentType={j.employmentType}
                      salaryMin={j.salaryMin}
                      salaryMax={j.salaryMax}
                      tags={j.tags}
                      postedAt={j.postedAt}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <Pagination
              current={current}
              page={activePage}
              totalPages={totalPages}
              labels={{
                previous: tj.pagination.previous,
                next: tj.pagination.next,
                previousAria: tj.pagination.previousAria,
                nextAria: tj.pagination.nextAria,
                pageAria: tj.pagination.pageAria,
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  count,
  active,
  href,
}: {
  label: string
  count?: number
  active: boolean
  href: string
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={href as any}
      className={
        active
          ? 'flex items-center justify-between gap-2 rounded-md bg-[color:var(--ring)]/10 px-2 py-1 text-sm font-medium text-[color:var(--ring)] transition'
          : 'text-foreground/80 hover:text-foreground flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-muted/50'
      }
      aria-current={active ? 'true' : undefined}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={
            active
              ? 'border-[color:var(--ring)] bg-[color:var(--ring)] grid size-4 place-items-center rounded border'
              : 'border-border bg-background grid size-4 place-items-center rounded border'
          }
        >
          {active && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-[color:var(--primary-foreground)] h-3 w-3"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
        {label}
      </span>
      {count != null && (
        <span
          className={
            active
              ? 'text-[color:var(--ring)] text-xs font-semibold'
              : 'text-muted-foreground text-xs'
          }
        >
          {count}
        </span>
      )}
    </Link>
  )
}

function FilterChip({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={clearHref as any}
      className="border-[color:var(--ring)]/40 bg-[color:var(--ring)]/10 text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:bg-[color:var(--ring)]/20"
    >
      {label}
      <X className="h-3 w-3" aria-hidden />
    </Link>
  )
}

type PaginationLabels = {
  previous: string
  next: string
  previousAria: string
  nextAria: string
  pageAria: string
}

function Pagination({
  current,
  page,
  totalPages,
  labels,
}: {
  current: FilterState
  page: number
  totalPages: number
  labels: PaginationLabels
}) {
  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  // Build a compact page list with ellipses around current.
  const pages: (number | 'ellipsis')[] = []
  const window = 1 // how many siblings on each side
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
      <PageLink
        current={current}
        page={prevPage}
        disabled={page === 1}
        aria={labels.previousAria}
      >
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
        aria={labels.nextAria}
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
