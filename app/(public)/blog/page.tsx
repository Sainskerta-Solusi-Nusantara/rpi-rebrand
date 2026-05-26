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
  BLOG_CATEGORIES,
  filterArticles,
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
}

function buildBlogUrl(
  current: BlogState,
  patch: Partial<{ category: string | null; q: string | null }>,
): string {
  const next = {
    category:
      'category' in patch
        ? (patch.category ?? 'all')
        : current.category,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.category && next.category !== 'all')
    params.push(`category=${next.category}`)
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

  const current: BlogState = {
    category: activeCategory,
    q: activeQuery || undefined,
  }
  const hasAnyFilter = activeCategory !== 'all' || !!activeQuery

  const articles = filterArticles({
    category: activeCategory,
    q: activeQuery || undefined,
  }).map(toCard)

  // Pre-build category hrefs (server-side) so the (client) BlogHero only
  // receives plain serializable props.
  const categoryHrefs: Record<string, string> = {}
  for (const c of BLOG_CATEGORIES) {
    categoryHrefs[c.slug] = buildBlogUrl(current, {
      category: c.slug === 'all' ? null : c.slug,
    })
  }

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

