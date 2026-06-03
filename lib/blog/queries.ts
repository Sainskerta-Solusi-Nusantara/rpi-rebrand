/**
 * Cached Article queries.
 *
 * Public callers (RSC pages, RSS route) read PUBLISHED articles only.
 * Admin callers read all statuses via `listAdminArticles`.
 *
 * Caching: each top-level export is wrapped with `react/cache` so multiple
 * components in the same request can call it without redundant DB hits.
 */

import { cache } from 'react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { parseQueryTerms, scoreRelevance, recencyBoost } from '@/lib/search/relevance'

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type ArticleListItem = {
  id: string
  slug: string
  title: string
  summary: string | null
  coverImage: string | null
  tags: string[]
  status: string
  publishedAt: Date | null
  createdAt: Date
  viewCount: number
  author: { id: string; name: string | null; image: string | null } | null
}

export type ArticleDetail = ArticleListItem & {
  body: string
  updatedAt: Date
}

const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  coverImage: true,
  tags: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  viewCount: true,
  author: { select: { id: true, name: true, image: true } },
} satisfies Prisma.ArticleSelect

// ---------------------------------------------------------------------------
// Public list
// ---------------------------------------------------------------------------

/**
 * Paginated list of PUBLISHED articles. Default page size is 10.
 *
 * Filters:
 *   - tag   — case-insensitive match against Article.tags (`has`)
 *   - query — case-insensitive contains over title + summary
 */
export const listPublishedArticles = cache(async function listPublishedArticles(input: {
  tag?: string
  query?: string
  page?: number
  pageSize?: number
}): Promise<{ items: ArticleListItem[]; total: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, Math.min(50, input.pageSize ?? 10))
  const where: Prisma.ArticleWhereInput = { status: 'PUBLISHED' }

  if (input.tag && input.tag.length > 0) {
    where.tags = { has: input.tag.toLowerCase() }
  }

  const q = input.query?.trim() ?? ''
  const terms = parseQueryTerms(q)

  if (terms.length > 0) {
    // Multi-term AND: every term must appear somewhere (title / summary / body / tags).
    const and: Prisma.ArticleWhereInput[] = terms.map((term) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { summary: { contains: term, mode: 'insensitive' as const } },
        { body: { contains: term, mode: 'insensitive' as const } },
        { tags: { has: term } },
      ],
    }))
    where.AND = and
  }

  if (terms.length > 0) {
    // Relevance ranking: pool up to 200 candidates, score in app code,
    // then slice for the requested page.
    const POOL = 200
    const [total, pool] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        select: { ...LIST_SELECT, body: true },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: POOL,
      }),
    ])

    const ranked = pool
      .map((row) => ({
        row,
        score:
          scoreRelevance(
            [
              { text: row.title, weight: 3 },
              { text: row.tags, weight: 2 },
              { text: row.summary, weight: 1.5 },
              { text: row.body, weight: 1 },
            ],
            terms,
            q,
          ) + recencyBoost(row.publishedAt, 0.5),
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.row.publishedAt?.getTime() ?? 0) - (a.row.publishedAt?.getTime() ?? 0),
      )

    const items: ArticleListItem[] = ranked
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ row }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { body: _body, ...rest } = row
        return rest as ArticleListItem
      })

    return { items, total }
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: LIST_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ])

  return { items, total }
})

// ---------------------------------------------------------------------------
// Single article (public)
// ---------------------------------------------------------------------------

/**
 * Fetch a single article by slug. Best-effort view-count increment runs after
 * the read so a failure to bump the counter does not break the page.
 *
 * Returns `null` if not found. Caller is responsible for status checks.
 */
export const getArticleBySlug = cache(async function getArticleBySlug(
  slug: string,
): Promise<ArticleDetail | null> {
  if (!slug) return null
  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      ...LIST_SELECT,
      body: true,
      updatedAt: true,
    },
  })
  if (!article) return null

  if (article.status === 'PUBLISHED') {
    // Fire and forget — atomic increment.
    prisma.article
      .update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
        select: { id: true },
      })
      .catch(() => {
        // best-effort
      })
  }

  return article
})

// ---------------------------------------------------------------------------
// Admin list
// ---------------------------------------------------------------------------

/**
 * Admin-facing paginated list. Includes drafts and archived. Default page
 * size 25.
 */
export const listAdminArticles = cache(async function listAdminArticles(input: {
  status?: ArticleStatus
  query?: string
  page?: number
  pageSize?: number
}): Promise<{ items: ArticleListItem[]; total: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, input.pageSize ?? 25))
  const where: Prisma.ArticleWhereInput = {}

  if (input.status) where.status = input.status
  if (input.query && input.query.length > 0) {
    const terms = parseQueryTerms(input.query)
    if (terms.length > 0) {
      // Multi-term AND: every term must appear somewhere (title / summary / slug / body / tags).
      where.AND = terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' as const } },
          { summary: { contains: term, mode: 'insensitive' as const } },
          { slug: { contains: term, mode: 'insensitive' as const } },
          { body: { contains: term, mode: 'insensitive' as const } },
          { tags: { has: term } },
        ],
      }))
    }
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ])

  return { items, total }
})

// ---------------------------------------------------------------------------
// Sidebar widgets
// ---------------------------------------------------------------------------

/** Latest published articles for homepage / sidebar widgets. */
export const getRecentArticles = cache(async function getRecentArticles(
  limit = 5,
): Promise<ArticleListItem[]> {
  const take = Math.max(1, Math.min(20, limit))
  return prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: LIST_SELECT,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take,
  })
})

/**
 * Articles whose tags overlap any of `tags`, excluding `excludeId`.
 * Used by the "Artikel terkait" section on the detail page.
 */
export const getRelatedArticles = cache(async function getRelatedArticles(input: {
  excludeId: string
  tags: string[]
  limit?: number
}): Promise<ArticleListItem[]> {
  const take = Math.max(1, Math.min(10, input.limit ?? 3))
  const normalised = input.tags.map((t) => t.toLowerCase()).filter(Boolean)
  if (normalised.length === 0) return []
  return prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: input.excludeId },
      tags: { hasSome: normalised },
    },
    select: LIST_SELECT,
    orderBy: [{ publishedAt: 'desc' }],
    take,
  })
})

/**
 * Top distinct tags across PUBLISHED articles. Used for the filter chip strip
 * on the public list page. Returns up to `limit` tag names sorted by
 * frequency (desc).
 */
export const getPopularArticleTags = cache(async function getPopularArticleTags(
  limit = 12,
): Promise<{ tag: string; count: number }[]> {
  const take = Math.max(1, Math.min(50, limit))
  // Cheap approach: scan published rows, count in memory. Scales fine until
  // we have many thousands of articles; revisit with a denormalised table
  // when needed.
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { tags: true },
    take: 500,
  })
  const counts = new Map<string, number>()
  for (const r of rows) {
    for (const t of r.tags) {
      const k = t.toLowerCase()
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, take)
})
