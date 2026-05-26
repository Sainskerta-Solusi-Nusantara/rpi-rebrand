import type { Metadata } from 'next'
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
import {
  PRESS_CATEGORIES,
  type PressCategory,
  type PressRelease,
  PRESS_RELEASES,
  filterReleases,
} from '@/lib/press-data'

export const metadata: Metadata = {
  title: 'Press & Media',
  description:
    'Siaran pers, peliputan media, dan press kit Rumah Pekerja Indonesia. Materi resmi untuk jurnalis, peneliti, dan mitra media.',
}

type PressState = {
  category: PressCategory | 'Semua'
  q?: string
}

function buildPressUrl(
  current: PressState,
  patch: Partial<{
    category: PressCategory | 'Semua' | null
    q: string | null
  }>,
): string {
  const next = {
    category:
      'category' in patch ? patch.category ?? 'Semua' : current.category,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category && next.category !== 'Semua')
    params.push(`category=${encodeURIComponent(next.category)}`)
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

  const current: PressState = {
    category: activeCategory,
    q: activeQuery || undefined,
  }
  const hasAnyFilter = activeCategory !== 'Semua' || !!activeQuery

  const releases = filterReleases({
    category: activeCategory,
    q: activeQuery || undefined,
  }).map(toRow)

  // Pre-build category hrefs server-side (no functions cross the boundary).
  const categoryHrefs: Record<string, string> = {}
  for (const c of PRESS_CATEGORIES) {
    categoryHrefs[c] = buildPressUrl(current, {
      category: c === 'Semua' ? null : c,
    })
  }

  return (
    <>
      <PressHero />
      <PressReleases
        releases={releases}
        totalCount={PRESS_RELEASES.length}
        activeCategory={activeCategory}
        activeQuery={activeQuery}
        categoryHrefs={categoryHrefs}
        clearAllHref="/press"
        hasAnyFilter={hasAnyFilter}
      />
      <PressCoverage />
      <PressAwards />
      <PressLeadership />
      <PressKit />
      <PressContact />
      <CTABanner />
    </>
  )
}
