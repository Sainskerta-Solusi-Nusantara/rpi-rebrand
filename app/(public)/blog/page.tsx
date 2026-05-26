import type { Metadata } from 'next'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import {
  BlogHero,
  BlogFeatured,
  BlogGrid,
  BlogTopics,
} from '@/components/organisms/blog-sections'
import {
  type BlogArticle,
  type BlogSort,
  BLOG_CATEGORIES,
  BLOG_PAGE_SIZE,
  filterArticles,
  sanitizeBlogSort,
} from '@/lib/blog-data'

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

  return (
    <>
      <BlogHero
        activeCategory={activeCategory}
        activeQuery={activeQuery}
        categoryHrefs={categoryHrefs}
      />
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
