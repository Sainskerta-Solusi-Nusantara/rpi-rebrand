import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { JobCard } from '@/components/molecules/job-card'
import { getAllJobs, getJobCategories } from '@/lib/jobs-data'

export const metadata: Metadata = {
  title: 'Cari Lowongan Pekerjaan',
  description:
    'Telusuri ribuan lowongan kerja terverifikasi di seluruh Indonesia. Saring berdasarkan kategori, lokasi, jenis pekerjaan, dan rentang gaji.',
}

// ---------------------------------------------------------------------------
// Filter option definitions — enum value paired with Indonesian label.
// ---------------------------------------------------------------------------

const EMPLOYMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'FULL_TIME',  label: 'Penuh Waktu' },
  { value: 'PART_TIME',  label: 'Paruh Waktu' },
  { value: 'CONTRACT',   label: 'Kontrak' },
  { value: 'INTERNSHIP', label: 'Magang' },
  { value: 'FREELANCE',  label: 'Lepas' },
]

const LOCATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'ONSITE', label: 'Di Tempat' },
  { value: 'HYBRID', label: 'Hibrida' },
  { value: 'REMOTE', label: 'Jarak Jauh' },
]

const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'ENTRY',     label: 'Pemula' },
  { value: 'JUNIOR',    label: 'Junior' },
  { value: 'MID',       label: 'Menengah' },
  { value: 'SENIOR',    label: 'Senior' },
  { value: 'LEAD',      label: 'Lead' },
  { value: 'EXECUTIVE', label: 'Eksekutif' },
]

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
}

function buildUrl(
  current: FilterState,
  patch: Partial<{
    q: string | null
    category: string | null
    type: string[]
    location: string[]
    level: string[]
  }>,
): string {
  const next = {
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    category: 'category' in patch ? patch.category ?? undefined : current.category,
    type: patch.type ?? current.type,
    location: patch.location ?? current.location,
    level: patch.level ?? current.level,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category) params.push(`category=${next.category}`)
  if (next.type.length) params.push(`type=${next.type.join(',')}`)
  if (next.location.length) params.push(`location=${next.location.join(',')}`)
  if (next.level.length) params.push(`level=${next.level.join(',')}`)
  return params.length ? `/jobs?${params.join('&')}` : '/jobs'
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
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeCategory =
    typeof searchParams.category === 'string' ? searchParams.category : undefined
  const activeTypes = parseMulti(searchParams.type)
  const activeLocations = parseMulti(searchParams.location)
  const activeLevels = parseMulti(searchParams.level)

  const current: FilterState = {
    q: activeQuery || undefined,
    category: activeCategory,
    type: activeTypes,
    location: activeLocations,
    level: activeLevels,
  }
  const hasAnyFilter =
    !!activeQuery ||
    !!activeCategory ||
    activeTypes.length > 0 ||
    activeLocations.length > 0 ||
    activeLevels.length > 0

  const [jobs, categories] = await Promise.all([
    getAllJobs({
      q: activeQuery || undefined,
      categorySlug: activeCategory,
      employmentTypes: activeTypes,
      locationTypes: activeLocations,
      experienceLevels: activeLevels,
    }),
    getJobCategories(),
  ])
  const total = jobs.length
  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name
    : undefined

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Lowongan Pekerjaan</h1>
        <p className="text-muted-foreground mt-2">
          {total.toLocaleString('id-ID')} lowongan tersedia
          {activeQuery && (
            <>
              {' '}untuk &ldquo;
              <strong className="text-foreground font-medium">{activeQuery}</strong>
              &rdquo;
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
              placeholder="Cari judul, deskripsi, atau perusahaan…"
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label="Cari lowongan"
            />
            {activeQuery && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={buildUrl(current, { q: null }) as any}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                <X className="h-3 w-3" aria-hidden />
                Bersihkan
              </Link>
            )}
            <button
              type="submit"
              className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
            >
              Cari
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
              const opt = EMPLOYMENT_OPTIONS.find((o) => o.value === v)
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
              const opt = LOCATION_OPTIONS.find((o) => o.value === v)
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
              const opt = LEVEL_OPTIONS.find((o) => o.value === v)
              if (!opt) return null
              return (
                <FilterChip
                  key={`lvl-${v}`}
                  label={opt.label}
                  clearHref={buildUrl(current, { level: toggle(activeLevels, v) })}
                />
              )
            })}
            <Link
              href="/jobs"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
            >
              <X className="h-3 w-3" aria-hidden />
              Bersihkan semua
            </Link>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filter" className="space-y-8">
          <FilterGroup title="Kategori">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-xs">Belum ada kategori.</p>
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

          <FilterGroup title="Jenis Pekerjaan">
            {EMPLOYMENT_OPTIONS.map((o) => {
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

          <FilterGroup title="Lokasi">
            {LOCATION_OPTIONS.map((o) => {
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

          <FilterGroup title="Tingkat Pengalaman">
            {LEVEL_OPTIONS.map((o) => {
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

          <FilterGroup title="Rentang Gaji (IDR/bulan)">
            <div className="text-muted-foreground text-xs">Rp 0 – Rp 50.000.000</div>
            <div className="bg-muted relative mt-3 h-1 rounded-full">
              <div className="bg-primary absolute left-[10%] right-[20%] h-1 rounded-full" />
            </div>
            <p className="text-muted-foreground/80 mt-2 text-[10px]">
              Filter rentang gaji belum aktif
            </p>
          </FilterGroup>
        </aside>

        <section aria-label="Daftar lowongan">
          {jobs.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                Tidak ada lowongan
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {hasAnyFilter
                  ? 'Belum ada lowongan yang cocok dengan filter saat ini.'
                  : 'Belum ada lowongan terdaftar.'}
              </p>
              {hasAnyFilter && (
                <Link
                  href="/jobs"
                  className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
                >
                  Bersihkan filter
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
