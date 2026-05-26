import type { Metadata } from 'next'
import Link from 'next/link'
import { Archive, FolderTree, Newspaper, Tag } from 'lucide-react'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  PressHero,
  PressReleases,
  PressCoverage,
  PressKit,
  PressAwards,
  PressLeadership,
  PressContact,
} from '@/components/organisms/press-sections'
import PressHeaderChips from '@/components/molecules/press-header-chips'
import PressSortPills from '@/components/molecules/press-sort-pills'
import {
  PRESS_CATEGORIES,
  type PressCategory,
  type PressRelease,
  PRESS_RELEASES,
  filterReleases,
} from '@/lib/press-data'
import {
  getPressCategoryFacets,
  getPressTags,
  type PressSort,
  sanitizePressSort,
  sortReleases,
} from '@/lib/press-facets'

export const metadata: Metadata = {
  title: 'Press & Media',
  description:
    'Siaran pers, peliputan media, dan press kit Rumah Pekerja Indonesia. Materi resmi untuk jurnalis, peneliti, dan mitra media.',
}

const SORT_LABEL: Record<PressSort, string> = {
  newest: 'Terbaru',
  oldest: 'Terlama',
  alpha: 'A–Z',
}

type PressState = {
  category: PressCategory | 'Semua'
  q?: string
  sort: PressSort
}

function buildPressUrl(
  current: PressState,
  patch: Partial<{
    category: PressCategory | 'Semua' | null
    q: string | null
    sort: PressSort
  }>,
): string {
  const next = {
    category:
      'category' in patch ? patch.category ?? 'Semua' : current.category,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    sort: patch.sort ?? current.sort,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category && next.category !== 'Semua')
    params.push(`category=${encodeURIComponent(next.category)}`)
  if (next.sort !== 'newest') params.push(`sort=${next.sort}`)
  return params.length ? `/press?${params.join('&')}` : '/press'
}

/** Shape used internally by PressReleases. The lib row has more fields; we
 * trim to what the row card actually renders. */
function toRow(r: PressRelease): {
  date: string
  category: PressCategory
  title: string
  excerpt: string
  href: string
} {
  return {
    date: r.date,
    category: r.category,
    title: r.title,
    excerpt: r.excerpt,
    href: `/press/${r.slug}`,
  }
}

export default function PressPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rawCategory =
    typeof searchParams.category === 'string' ? searchParams.category : 'Semua'
  const activeCategory: PressCategory | 'Semua' = (
    PRESS_CATEGORIES as readonly string[]
  ).includes(rawCategory)
    ? (rawCategory as PressCategory | 'Semua')
    : 'Semua'
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeSort = sanitizePressSort(
    typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  )

  const current: PressState = {
    category: activeCategory,
    q: activeQuery || undefined,
    sort: activeSort,
  }
  const hasAnyFilter = activeCategory !== 'Semua' || !!activeQuery

  const filtered = filterReleases({
    category: activeCategory,
    q: activeQuery || undefined,
  })
  const releases = sortReleases(filtered, activeSort).map(toRow)

  // Pre-build category hrefs server-side (no functions cross the boundary).
  const categoryHrefs: Record<string, string> = {}
  for (const c of PRESS_CATEGORIES) {
    categoryHrefs[c] = buildPressUrl(current, {
      category: c === 'Semua' ? null : c,
    })
  }

  // Sort pill options
  const sortOptions = (Object.keys(SORT_LABEL) as PressSort[]).map((s) => ({
    value: s,
    label: SORT_LABEL[s],
    href: buildPressUrl(current, { sort: s }),
    active: activeSort === s,
  }))

  // Header chip strip
  const headerChips: { label: string; clearHref: string }[] = []
  if (activeQuery) {
    headerChips.push({
      label: `"${activeQuery}"`,
      clearHref: buildPressUrl(current, { q: null }),
    })
  }
  if (activeCategory !== 'Semua') {
    headerChips.push({
      label: activeCategory,
      clearHref: buildPressUrl(current, { category: null }),
    })
  }

  // Discovery rail data — top tags + all categories for browsing
  const topTags = getPressTags().slice(0, 14)
  const categoryFacets = getPressCategoryFacets()

  return (
    <>
      <PressHero />

      {(headerChips.length > 0 || activeSort !== 'newest') && (
        <section
          className="bg-background pt-6"
          aria-label="Filter + urutkan siaran pers"
        >
          <div className="container mx-auto w-full max-w-5xl px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <PressHeaderChips chips={headerChips} clearAllHref="/press" />
              <PressSortPills options={sortOptions} />
            </div>
          </div>
        </section>
      )}

      <PressReleases
        releases={releases}
        totalCount={PRESS_RELEASES.length}
        activeCategory={activeCategory}
        activeQuery={activeQuery}
        categoryHrefs={categoryHrefs}
        clearAllHref="/press"
        hasAnyFilter={hasAnyFilter}
      />

      {/* Show sort pills below releases too, so they're always available */}
      {activeSort === 'newest' && headerChips.length === 0 && (
        <section className="bg-muted/30 -mt-12 pb-12" aria-label="Urutkan">
          <div className="container mx-auto w-full max-w-5xl px-6">
            <div className="flex justify-end">
              <PressSortPills options={sortOptions} />
            </div>
          </div>
        </section>
      )}

      <PressCoverage />
      <PressAwards />
      <PressLeadership />
      <PressKit />

      {/* Discovery rail — tag, category, archive, kit */}
      <section
        className="bg-background py-20 md:py-24"
        aria-label="Jelajahi press"
      >
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                Jelajahi
              </span>
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            </div>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Telusuri press lewat tag, kategori, arsip, atau kit media
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* Tags */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground mb-4 inline-flex items-center gap-2 text-base font-semibold">
                <Tag className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
                Tag populer
              </h3>
              <ul className="flex flex-wrap gap-2">
                {topTags.map((t) => (
                  <li key={t.slug}>
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={`/press/tag/${t.slug}` as any}
                      className="border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition"
                    >
                      #{t.name}
                      <span className="text-muted-foreground">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground mb-4 inline-flex items-center gap-2 text-base font-semibold">
                <FolderTree className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
                Kategori
              </h3>
              <ul className="space-y-1.5">
                {categoryFacets.map((c) => (
                  <li key={c.slug}>
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={`/press/category/${c.slug}` as any}
                      className="text-foreground/80 hover:text-[color:var(--ring)] flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition"
                    >
                      <span>{c.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {c.count} rilis
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/press/archive"
              className="border-border bg-card hover:border-[color:var(--ring)] group flex items-start gap-4 rounded-2xl border p-5 transition"
            >
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
              >
                <Archive className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                  Arsip Lengkap
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Semua siaran pers RPI dikelompokkan per tahun.
                </p>
              </div>
            </Link>
            <Link
              href="/press/kit"
              className="border-border bg-card hover:border-[color:var(--ring)] group flex items-start gap-4 rounded-2xl border p-5 transition"
            >
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
              >
                <Newspaper className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                  Press Kit & Media
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Boilerplate, logo, fact sheet, dan profil kepemimpinan untuk jurnalis.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <PressContact />
      <CTABanner />
    </>
  )
}
