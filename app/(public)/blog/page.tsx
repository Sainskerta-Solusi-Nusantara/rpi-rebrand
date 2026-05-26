import type { Metadata } from 'next'
import Link from 'next/link'
import { Tag, User, Calendar } from 'lucide-react'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import {
  BlogHero,
  BlogFeatured,
  BlogGrid,
  BlogTopics,
} from '@/components/organisms/blog-sections'
import BlogHeaderChips from '@/components/molecules/blog-header-chips'
import {
  type BlogArticle,
  type BlogSort,
  BLOG_CATEGORIES,
  BLOG_PAGE_SIZE,
  filterArticles,
  findCategory,
  sanitizeBlogSort,
} from '@/lib/blog-data'
import {
  getBlogAuthors,
  getBlogTags,
  getBlogYears,
} from '@/lib/blog-facets'

/** Flatten the lib BlogArticle into the shape BlogGrid expects. Defined here
 * (server component) instead of importing from blog-sections, since exports
 * from a 'use client' file become client references and can't be called during
 * server render. */
function toCard(a: BlogArticle) {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    author: a.author.name,
    authorRole: a.author.role,
    date: a.date,
    readMin: a.readMin,
    gradient: a.gradient,
    emoji: a.emoji,
  }
}

export const metadata: Metadata = {
  title: 'Blog & Insight',
  description:
    'Cerita, riset, dan panduan praktis dari dunia kerja Indonesia — untuk pencari kerja, perekrut, dan pemimpin SDM.',
}

type BlogState = {
  category: string
  q?: string
  sort: BlogSort
  page: number
}

function buildBlogUrl(
  current: BlogState,
  patch: Partial<{
    category: string | null
    q: string | null
    sort: BlogSort
    page: number
    keepPage: boolean
  }>,
): string {
  const next = {
    category:
      'category' in patch
        ? (patch.category ?? 'all')
        : current.category,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    sort: patch.sort ?? current.sort,
    page: patch.page ?? (patch.keepPage ? current.page : 1),
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category && next.category !== 'all')
    params.push(`category=${next.category}`)
  if (next.sort !== 'newest') params.push(`sort=${next.sort}`)
  if (next.page > 1) params.push(`page=${next.page}`)
  return params.length ? `/blog?${params.join('&')}` : '/blog'
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rawCategory =
    typeof searchParams.category === 'string' ? searchParams.category : 'all'
  const activeCategory = BLOG_CATEGORIES.some((c) => c.slug === rawCategory)
    ? rawCategory
    : 'all'
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeSort = sanitizeBlogSort(
    typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  )
  const pageParam =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const activePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const current: BlogState = {
    category: activeCategory,
    q: activeQuery || undefined,
    sort: activeSort,
    page: activePage,
  }
  const hasAnyFilter = activeCategory !== 'all' || !!activeQuery

  const allFiltered = filterArticles({
    category: activeCategory,
    q: activeQuery || undefined,
    sort: activeSort,
  })
  const total = allFiltered.length
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE))
  const safePage = Math.min(activePage, totalPages)
  const pageStart = (safePage - 1) * BLOG_PAGE_SIZE
  const articles = allFiltered
    .slice(pageStart, pageStart + BLOG_PAGE_SIZE)
    .map(toCard)

  // Pre-build category hrefs (server-side) so the (client) BlogHero only
  // receives plain serializable props.
  const categoryHrefs: Record<string, string> = {}
  for (const c of BLOG_CATEGORIES) {
    categoryHrefs[c.slug] = buildBlogUrl(current, {
      category: c.slug === 'all' ? null : c.slug,
    })
  }

  // Sort dropdown options: each href applies the new sort and resets page.
  const sortOptions: { value: BlogSort; label: string; href: string }[] = (
    [
      { value: 'newest', label: 'Terbaru' },
      { value: 'alpha', label: 'A–Z' },
      { value: 'quick', label: 'Baca cepat' },
    ] as const
  ).map((s) => ({
    value: s.value,
    label: s.label,
    href: buildBlogUrl(current, { sort: s.value }),
  }))

  // Pagination links: prev/next/numbered + ellipsis (compact).
  const paginationLinks = buildPaginationLinks(current, safePage, totalPages)

  // Header chip strip — active filter chips with X-to-remove.
  const headerChips: { label: string; clearHref: string }[] = []
  if (activeQuery) {
    headerChips.push({
      label: `"${activeQuery}"`,
      clearHref: buildBlogUrl(current, { q: null }),
    })
  }
  if (activeCategory !== 'all') {
    const cat = findCategory(activeCategory)
    if (cat) {
      headerChips.push({
        label: cat.label,
        clearHref: buildBlogUrl(current, { category: null }),
      })
    }
  }

  // Discovery rail data — top tags, authors, years for browsing sub-routes.
  const topTags = getBlogTags().slice(0, 12)
  const topAuthors = getBlogAuthors().slice(0, 6)
  const years = getBlogYears()

  return (
    <>
      <BlogHero
        activeCategory={activeCategory}
        activeQuery={activeQuery}
        categoryHrefs={categoryHrefs}
      />
      {headerChips.length > 0 && (
        <section className="bg-background pt-6" aria-label="Filter aktif">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="flex justify-center">
              <BlogHeaderChips chips={headerChips} clearAllHref="/blog" />
            </div>
          </div>
        </section>
      )}
      <BlogFeatured />
      <BlogGrid
        articles={articles}
        activeCategory={activeCategory}
        activeQuery={activeQuery}
        clearAllHref="/blog"
        hasAnyFilter={hasAnyFilter}
        totalCount={total}
        page={safePage}
        totalPages={totalPages}
        sortOptions={sortOptions}
        activeSort={activeSort}
        paginationLinks={paginationLinks}
      />
      <BlogTopics />

      {/* Discovery rail: browse by tag, author, or year */}
      <section className="bg-muted/30 py-20 md:py-24" aria-label="Jelajahi blog">
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
              Telusuri blog lewat tag, penulis, atau arsip
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
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
                      href={`/blog/tag/${t.slug}` as any}
                      className="border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition"
                    >
                      #{t.name}
                      <span className="text-muted-foreground">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Authors */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground mb-4 inline-flex items-center gap-2 text-base font-semibold">
                <User className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
                Penulis kami
              </h3>
              <ul className="space-y-3">
                {topAuthors.map((a) => (
                  <li key={a.slug}>
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={`/blog/author/${a.slug}` as any}
                      className="hover:bg-muted/40 group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition"
                    >
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-full text-xs text-white"
                        style={{ background: a.color }}
                      >
                        {a.initial}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground group-hover:text-[color:var(--ring)] block truncate text-sm font-medium transition">
                          {a.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {a.count} artikel · {a.role}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Years */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground mb-4 inline-flex items-center gap-2 text-base font-semibold">
                <Calendar className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
                Arsip tahunan
              </h3>
              <ul className="space-y-1.5">
                {years.map((y) => (
                  <li key={y.year}>
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={`/blog/archive/${y.year}` as any}
                      className="text-foreground/80 hover:text-[color:var(--ring)] flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition"
                    >
                      <span>{y.year}</span>
                      <span className="text-muted-foreground text-xs">
                        {y.count} artikel
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}

type PaginationLink =
  | { kind: 'page'; page: number; active: boolean; href: string }
  | { kind: 'ellipsis' }
  | { kind: 'prev' | 'next'; disabled: boolean; href: string }

function buildPaginationLinks(
  current: BlogState,
  page: number,
  totalPages: number,
): PaginationLink[] {
  if (totalPages <= 1) return []
  const links: PaginationLink[] = []

  links.push({
    kind: 'prev',
    disabled: page === 1,
    href: buildBlogUrl(current, {
      page: Math.max(1, page - 1),
      keepPage: true,
    }),
  })

  const window = 1
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - window && p <= page + window)) {
      links.push({
        kind: 'page',
        page: p,
        active: p === page,
        href: buildBlogUrl(current, { page: p, keepPage: true }),
      })
    } else if (links[links.length - 1]?.kind !== 'ellipsis') {
      links.push({ kind: 'ellipsis' })
    }
  }

  links.push({
    kind: 'next',
    disabled: page === totalPages,
    href: buildBlogUrl(current, {
      page: Math.min(totalPages, page + 1),
      keepPage: true,
    }),
  })

  return links
}
