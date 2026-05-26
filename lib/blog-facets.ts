import { BLOG_ARTICLES, type BlogArticle } from '@/lib/blog-data'

/**
 * Slugify a display string for use in tag/author URLs.
 * Lowercases, replaces spaces and `&` with `-`, strips non-[a-z0-9-] chars,
 * collapses repeated `-`, trims leading/trailing `-`.
 */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s&]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type BlogTagFacet = {
  name: string
  slug: string
  count: number
}

/**
 * Collect unique tags across BLOG_ARTICLES.
 * Dedup is case-insensitive (by slug); the first-seen display name wins.
 * Sorted by count desc, then name asc (id locale).
 */
export function getBlogTags(): BlogTagFacet[] {
  const map = new Map<string, { name: string; count: number }>()
  for (const article of BLOG_ARTICLES) {
    const seen = new Set<string>()
    for (const tag of article.tags) {
      const slug = toSlug(tag)
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      const existing = map.get(slug)
      if (existing) {
        existing.count += 1
      } else {
        map.set(slug, { name: tag, count: 1 })
      }
    }
  }
  return Array.from(map.entries())
    .map(([slug, { name, count }]) => ({ name, slug, count }))
    .sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'),
    )
}

/** Find a tag facet entry by its slug. */
export function findBlogTag(slug: string): BlogTagFacet | undefined {
  return getBlogTags().find((tag) => tag.slug === slug)
}

/** All articles where any tag slugifies to the given slug, newest first. */
export function articlesByTag(slug: string): BlogArticle[] {
  return BLOG_ARTICLES.filter((article) =>
    article.tags.some((tag) => toSlug(tag) === slug),
  ).sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
}

export type BlogAuthorFacet = {
  name: string
  slug: string
  role: string
  bio: string
  initial: string
  color: string
  count: number
}

/**
 * Collect unique authors across BLOG_ARTICLES (keyed by author name).
 * Sorted by count desc, then name asc (id locale).
 */
export function getBlogAuthors(): BlogAuthorFacet[] {
  const map = new Map<string, BlogAuthorFacet>()
  for (const article of BLOG_ARTICLES) {
    const author = article.author
    const slug = toSlug(author.name)
    if (!slug) continue
    const existing = map.get(slug)
    if (existing) {
      existing.count += 1
    } else {
      map.set(slug, {
        name: author.name,
        slug,
        role: author.role,
        bio: author.bio,
        initial: author.initial,
        color: author.color,
        count: 1,
      })
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'),
  )
}

/** Find an author facet entry by its slug. */
export function findBlogAuthor(slug: string): BlogAuthorFacet | undefined {
  return getBlogAuthors().find((author) => author.slug === slug)
}

/** All articles where toSlug(author.name) === slug, newest first. */
export function articlesByAuthor(slug: string): BlogArticle[] {
  return BLOG_ARTICLES.filter(
    (article) => toSlug(article.author.name) === slug,
  ).sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
}

export type BlogYearFacet = {
  year: number
  count: number
}

/** Distinct years derived from dateIso, sorted year desc. */
export function getBlogYears(): BlogYearFacet[] {
  const counts = new Map<number, number>()
  for (const article of BLOG_ARTICLES) {
    const year = Number.parseInt(article.dateIso.slice(0, 4), 10)
    if (!Number.isFinite(year)) continue
    counts.set(year, (counts.get(year) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year)
}

/** All articles in the given year (parsed from dateIso), newest first. */
export function articlesByYear(year: number): BlogArticle[] {
  return BLOG_ARTICLES.filter(
    (article) => Number.parseInt(article.dateIso.slice(0, 4), 10) === year,
  ).sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
}

export type BlogReadBucket = 'quick' | 'medium' | 'long'

export const BLOG_READ_BUCKETS: Record<
  BlogReadBucket,
  { label: string; min?: number; max?: number }
> = {
  quick: { label: 'Baca cepat (≤ 5 min)', max: 5 },
  medium: { label: 'Menengah (6–10 min)', min: 6, max: 10 },
  long: { label: 'Panjang (> 10 min)', min: 11 },
}

const VALID_READ_BUCKETS: readonly BlogReadBucket[] = ['quick', 'medium', 'long']

/** Coerce an unknown string into a valid BlogReadBucket, else undefined. */
export function sanitizeBlogReadBucket(
  value: string | undefined,
): BlogReadBucket | undefined {
  if (value && (VALID_READ_BUCKETS as readonly string[]).includes(value)) {
    return value as BlogReadBucket
  }
  return undefined
}

/** Whether an article's readMin falls within the bucket's [min, max] window. */
export function articleMatchesReadBucket(
  article: BlogArticle,
  bucket: BlogReadBucket,
): boolean {
  const { min, max } = BLOG_READ_BUCKETS[bucket]
  if (typeof min === 'number' && article.readMin < min) return false
  if (typeof max === 'number' && article.readMin > max) return false
  return true
}
