import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Download,
  Filter,
  Mail,
  Newspaper,
  Search,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  PRESS_CATEGORIES,
  PRESS_CATEGORY_COLOR,
  PRESS_RELEASES,
  type PressCategory,
  type PressRelease,
  filterReleases,
  getPressCategoryCounts,
  getPressYears,
  groupReleasesByYear,
} from '@/lib/press-data'
import { cn } from '@/lib/utils'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = {
  title: 'Arsip Siaran Pers',
  description:
    'Telusuri seluruh siaran pers Rumah Pekerja Indonesia. Saring berdasarkan kategori, tahun, atau cari berdasarkan kata kunci.',
}

type ArchiveState = {
  category: PressCategory | 'Semua'
  year?: number
  q?: string
}

function buildArchiveUrl(
  current: ArchiveState,
  patch: Partial<{
    category: PressCategory | 'Semua' | null
    year: number | null
    q: string | null
  }>,
): string {
  const next = {
    category:
      'category' in patch ? patch.category ?? 'Semua' : current.category,
    year: 'year' in patch ? patch.year ?? undefined : current.year,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category && next.category !== 'Semua')
    params.push(`category=${encodeURIComponent(next.category)}`)
  if (next.year !== undefined) params.push(`year=${next.year}`)
  return params.length ? `/press/archive?${params.join('&')}` : '/press/archive'
}

export default async function PressArchivePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const allYears = getPressYears()
  const categoryCounts = getPressCategoryCounts()

  // Parse + validate searchParams
  const rawCategory =
    typeof searchParams.category === 'string' ? searchParams.category : 'Semua'
  const category: PressCategory | 'Semua' = (
    PRESS_CATEGORIES as readonly string[]
  ).includes(rawCategory)
    ? (rawCategory as PressCategory | 'Semua')
    : 'Semua'

  const rawYear =
    typeof searchParams.year === 'string'
      ? parseInt(searchParams.year, 10)
      : undefined
  const year =
    rawYear !== undefined && Number.isFinite(rawYear) && allYears.includes(rawYear)
      ? rawYear
      : undefined

  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''

  const current: ArchiveState = { category, year, q: q || undefined }
  const isFiltered = !!q || category !== 'Semua' || year !== undefined

  const filtered = filterReleases({
    category,
    year,
    q: q || undefined,
  })
  const grouped = groupReleasesByYear(filtered)
  const groupedYears = Array.from(grouped.keys()).sort((a, b) => b - a)

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="archive-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)',
            backgroundSize: '100% 96px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 14%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/press"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.pagesPress.common.backToPress}
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.pagesPress.archive.eyebrow}
            </span>
          </div>
          <h1
            id="archive-heading"
            className="font-heading text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl lg:text-5xl"
          >
            {t.pagesPress.archive.heading}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base md:text-lg">
            {t.pagesPress.archive.bodyPrefix}{' '}
            <strong className="text-foreground font-medium">
              {t.pagesPress.archive.totalReleases.replace('{n}', String(PRESS_RELEASES.length))}
            </strong>{' '}
            {t.pagesPress.archive.bodySuffix}
          </p>
        </div>
      </section>

      {/* Filter & list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            {/* Main column */}
            <div className="min-w-0">
              {/* Filter bar */}
              <div className="border-border bg-card mb-8 rounded-2xl border p-5">
                {/* Search */}
                <form method="get" action="/press/archive">
                  <div className="border-border bg-background focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 transition">
                    <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                    <input
                      type="search"
                      name="q"
                      defaultValue={q}
                      placeholder={t.pagesPress.archive.searchPlaceholder}
                      className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
                      aria-label={t.pagesPress.archive.searchAriaLabel}
                    />
                    {q && (
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={buildArchiveUrl(current, { q: null }) as any}
                        className="text-muted-foreground hover:text-foreground text-xs font-medium"
                        aria-label={t.pagesPress.archive.clearSearchAria}
                      >
                        {t.pagesPress.archive.clearSearch}
                      </Link>
                    )}
                    <button
                      type="submit"
                      className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
                    >
                      {t.pagesPress.archive.searchButton}
                    </button>
                  </div>
                  {/* Preserve filters when submitting search */}
                  {category !== 'Semua' && (
                    <input type="hidden" name="category" value={category} />
                  )}
                  {year !== undefined && (
                    <input type="hidden" name="year" value={year} />
                  )}
                </form>

                {/* Category chips */}
                <div className="border-border mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                    <Filter className="h-3 w-3" aria-hidden />
                    {t.pagesPress.archive.categoryLabel}
                  </span>
                  {PRESS_CATEGORIES.map((c) => {
                    const active = category === c
                    return (
                      <Link
                        key={c}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={
                          buildArchiveUrl(current, {
                            category: c === 'Semua' ? null : c,
                          }) as any
                        }
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition',
                          active
                            ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground',
                        )}
                        aria-current={active ? 'true' : undefined}
                      >
                        {c}
                        <span
                          className={
                            active ? 'opacity-70' : 'text-muted-foreground/60'
                          }
                        >
                          {categoryCounts[c] ?? 0}
                        </span>
                      </Link>
                    )
                  })}
                </div>

                {/* Year tabs */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {t.pagesPress.archive.yearLabel}
                  </span>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={buildArchiveUrl(current, { year: null }) as any}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      year === undefined
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    )}
                    aria-current={year === undefined ? 'true' : undefined}
                  >
                    {t.pagesPress.archive.yearAll}
                  </Link>
                  {allYears.map((y) => {
                    const active = year === y
                    return (
                      <Link
                        key={y}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={
                          buildArchiveUrl(current, {
                            year: active ? null : y,
                          }) as any
                        }
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition',
                          active
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground',
                        )}
                        aria-current={active ? 'true' : undefined}
                      >
                        {y}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Result count */}
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-foreground text-lg font-semibold">
                  {t.pagesPress.archive.resultCount.replace('{n}', String(filtered.length))}
                  {isFiltered && (
                    <span className="text-muted-foreground text-sm font-normal">
                      {' '}{t.pagesPress.archive.resultCountSuffix.replace('{total}', String(PRESS_RELEASES.length))}
                    </span>
                  )}
                </h2>
                {isFiltered && (
                  <Link
                    href="/press/archive"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
                  >
                    <ArrowLeft className="h-3 w-3" aria-hidden />
                    {t.pagesPress.archive.resetFilter}
                  </Link>
                )}
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="border-border bg-card rounded-2xl border p-12 text-center">
                  <Search className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
                  <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
                    {t.pagesPress.archive.emptyHeading}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {t.pagesPress.archive.emptyBody}
                  </p>
                </div>
              )}

              {/* Grouped list */}
              {groupedYears.map((y) => {
                const list = grouped.get(y)!
                return (
                  <section key={y} className="mb-10" aria-label={`${y}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
                        {y}
                      </h3>
                      <span className="bg-border h-px flex-1" aria-hidden />
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">
                        {t.pagesPress.archive.releasesPerYear.replace('{n}', String(list.length))}
                      </span>
                    </div>
                    <ol className="border-border bg-card divide-border overflow-hidden rounded-2xl border">
                      {list.map((r) => (
                        <li
                          key={r.slug}
                          className="border-border [&:not(:last-child)]:border-b"
                        >
                          <ReleaseRow release={r} readLabel={t.pagesPress.archive.rowReadLabel} />
                        </li>
                      ))}
                    </ol>
                  </section>
                )
              })}
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
              {/* Stats */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  {t.pagesPress.archive.sidebarArchiveLabel}
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <StatLine label={t.pagesPress.archive.sidebarTotal} value={PRESS_RELEASES.length.toString()} />
                  <StatLine label={t.pagesPress.archive.sidebarActiveYears} value={allYears.length.toString()} />
                  <StatLine
                    label={t.pagesPress.archive.sidebarCategories}
                    value={(PRESS_CATEGORIES.length - 1).toString()}
                  />
                  <StatLine label={t.pagesPress.archive.sidebarSince} value={Math.min(...allYears).toString()} />
                </dl>
              </div>

              {/* Categories overview */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  {t.pagesPress.archive.sidebarPerCategory}
                </div>
                <ul className="mt-4 space-y-2">
                  {PRESS_CATEGORIES.filter((c) => c !== 'Semua').map((c) => {
                    const color = PRESS_CATEGORY_COLOR[c as PressCategory]
                    const count = categoryCounts[c] ?? 0
                    const active = category === c
                    return (
                      <li key={c}>
                        <Link
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          href={
                            buildArchiveUrl(current, {
                              category: active ? null : c,
                            }) as any
                          }
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition',
                            active
                              ? 'bg-[color:var(--ring)]/10 text-[color:var(--ring)] font-medium'
                              : 'hover:bg-muted/30',
                          )}
                          aria-current={active ? 'true' : undefined}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ background: color }}
                            />
                            <span
                              className={active ? '' : 'text-foreground/85'}
                            >
                              {c}
                            </span>
                          </span>
                          <span
                            className={
                              active
                                ? 'text-[color:var(--ring)] text-xs font-semibold'
                                : 'text-muted-foreground text-xs'
                            }
                          >
                            {count}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Media contact */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  {t.pagesPress.archive.sidebarMediaTeam}
                </div>
                <p className="text-foreground/85 mt-3 text-sm leading-relaxed">
                  {t.pagesPress.archive.sidebarMediaBody}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <a
                    href="mailto:press@rumahpekerja.id"
                    className="text-foreground hover:text-[color:var(--ring)] inline-flex items-center gap-2 font-medium transition"
                  >
                    <Mail className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                    press@rumahpekerja.id
                  </a>
                </div>
                <Button asChild size="sm" className="mt-5 w-full">
                  <Link href="/press#press-contact">{t.pagesPress.archive.sidebarContactTeam}</Link>
                </Button>
              </div>

              {/* Press kit */}
              <div className="border-[color:var(--ring)]/30 bg-[color:var(--ring)]/5 rounded-2xl border p-6">
                <div className="text-[color:var(--ring)] inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                  <Newspaper className="h-3 w-3" aria-hidden /> Press Kit
                </div>
                <p className="text-foreground/85 mt-3 text-sm leading-relaxed">
                  {t.pagesPress.archive.sidebarPressKitBody}
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <a href="/press-kit/RPI-Press-Kit-Full.zip">
                    <Download className="mr-2 h-3.5 w-3.5" aria-hidden />
                    {t.pagesPress.archive.sidebarDownload}
                  </a>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

function ReleaseRow({ release, readLabel }: { release: PressRelease; readLabel: string }) {
  const color = PRESS_CATEGORY_COLOR[release.category]
  return (
    <Link
      href={`/press/${release.slug}`}
      className="group hover:bg-muted/30 grid gap-4 px-5 py-5 transition sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-6 sm:px-7"
    >
      <div className="flex flex-col gap-2 sm:items-start">
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: `color-mix(in oklab, ${color} 12%, transparent)`,
            color,
          }}
        >
          <span
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ background: color }}
          />
          {release.category}
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {release.date}
        </span>
      </div>
      <div className="min-w-0">
        <h4 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold leading-snug transition sm:text-lg">
          {release.title}
        </h4>
        <p className="text-muted-foreground line-clamp-2 mt-2 text-sm leading-relaxed">
          {release.excerpt}
        </p>
      </div>
      <span className="text-foreground/80 group-hover:text-[color:var(--ring)] hidden shrink-0 items-center gap-1 self-start pt-1 text-sm font-medium transition sm:inline-flex">
        {readLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  )
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-heading text-foreground text-base font-semibold">
        {value}
      </dd>
    </div>
  )
}
