import type { Metadata } from 'next'
import Link from 'next/link'
import { Rss, Search } from 'lucide-react'
import { ArticleCard } from '@/components/organisms/article-card'
import BlogHeaderChips from '@/components/molecules/blog-header-chips'
import { getServerT } from '@/lib/i18n/server-dictionary'
import {
  listPublishedArticles,
  getPopularArticleTags,
} from '@/lib/blog/queries'

export const metadata: Metadata = {
  title: 'Blog & Insight',
  description:
    'Cerita, riset, dan panduan praktis dari dunia kerja Indonesia — untuk pencari kerja, perekrut, dan pemimpin SDM.',
  openGraph: {
    title: 'Blog Rumah Pekerja Indonesia',
    description:
      'Cerita, riset, dan panduan praktis dari dunia kerja Indonesia.',
    type: 'website',
  },
}

const PAGE_SIZE = 9

type BlogState = {
  tag?: string
  query?: string
  page: number
}

function buildBlogUrl(
  current: BlogState,
  patch: Partial<{ tag: string | null; query: string | null; page: number; keepPage: boolean }>,
): string {
  const next = {
    tag: 'tag' in patch ? (patch.tag ?? undefined) : current.tag,
    query: 'query' in patch ? (patch.query ?? undefined) : current.query,
    page: patch.page ?? (patch.keepPage ? current.page : 1),
  }
  const params: string[] = []
  if (next.query) params.push(`q=${encodeURIComponent(next.query)}`)
  if (next.tag) params.push(`tag=${encodeURIComponent(next.tag)}`)
  if (next.page > 1) params.push(`page=${next.page}`)
  return params.length ? `/blog?${params.join('&')}` : '/blog'
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const tb = t.public.blog

  const tagParam =
    typeof searchParams.tag === 'string' && searchParams.tag.length > 0
      ? searchParams.tag.toLowerCase()
      : undefined
  const queryParam =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const pageRaw =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1

  const current: BlogState = {
    tag: tagParam,
    query: queryParam || undefined,
    page,
  }
  const hasFilter = Boolean(tagParam) || Boolean(queryParam)

  const [{ items, total }, popularTags] = await Promise.all([
    listPublishedArticles({
      tag: tagParam,
      query: queryParam || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    getPopularArticleTags(12),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  // Header chips for active filters.
  const headerChips: { label: string; clearHref: string }[] = []
  if (queryParam) {
    headerChips.push({
      label: `"${queryParam}"`,
      clearHref: buildBlogUrl(current, { query: null }),
    })
  }
  if (tagParam) {
    headerChips.push({
      label: `#${tagParam}`,
      clearHref: buildBlogUrl(current, { tag: null }),
    })
  }

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background pb-12 pt-16 md:pb-16 md:pt-24"
        aria-labelledby="blog-hero-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 14%, transparent), transparent 65%)',
          }}
        />
        <div className="container mx-auto w-full max-w-4xl px-6 text-center">
          <span className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            {tb.eyebrow}
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </span>
          <h1
            id="blog-hero-heading"
            className="font-heading text-foreground mt-4 text-balance text-3xl font-semibold leading-tight md:text-5xl"
          >
            {tb.heroTitle}
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-balance text-base md:text-lg">
            {tb.heroBody}
          </p>

          <form action="/blog" method="get" className="mx-auto mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search
                className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                defaultValue={queryParam}
                placeholder={tb.searchPlaceholder}
                className="border-input bg-background focus:border-ring focus:ring-ring/30 block w-full rounded-md border px-3 py-2 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2"
              />
            </div>
            {tagParam && <input type="hidden" name="tag" value={tagParam} />}
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {tb.searchCta}
            </button>
          </form>

          <div className="mt-4 flex justify-center">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/feed.xml' as any}
              className="text-muted-foreground hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 text-xs font-medium underline-offset-2 transition hover:underline"
            >
              <Rss className="h-3.5 w-3.5" aria-hidden />
              {tb.rss}
            </Link>
          </div>
        </div>
      </section>

      {/* Active filter chip strip */}
      {headerChips.length > 0 && (
        <section className="bg-background pb-2 pt-2" aria-label="Filter aktif">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="flex justify-center">
              <BlogHeaderChips chips={headerChips} clearAllHref="/blog" />
            </div>
          </div>
        </section>
      )}

      {/* Popular tag chips */}
      {popularTags.length > 0 && (
        <section className="bg-background pb-6 pt-4" aria-label="Tag populer">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <ul className="flex flex-wrap justify-center gap-2">
              {popularTags.map((t) => {
                const isActive = tagParam === t.tag
                const href = buildBlogUrl(current, {
                  tag: isActive ? null : t.tag,
                })
                return (
                  <li key={t.tag}>
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={href as any}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                        isActive
                          ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-white'
                          : 'border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)]'
                      }`}
                    >
                      #{t.tag}
                      <span
                        className={
                          isActive
                            ? 'text-white/70'
                            : 'text-muted-foreground'
                        }
                      >
                        {t.count}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="bg-background pb-20 pt-6 md:pb-24" aria-label="Daftar artikel">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="text-muted-foreground mb-6 text-sm">
            {total.toLocaleString('id-ID')} {tb.articlesCount}
            {hasFilter ? ` ${tb.matchingFilter}` : ''}
          </div>

          {items.length === 0 ? (
            <div className="border-border bg-card mx-auto max-w-xl rounded-2xl border p-10 text-center">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                {tb.empty.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {hasFilter ? tb.empty.withFilter : tb.empty.none}
              </p>
              {hasFilter && (
                <Link
                  href="/blog"
                  className="mt-4 inline-flex rounded-md border border-[color:var(--ring)] px-3 py-1.5 text-sm text-[color:var(--ring)]"
                >
                  {tb.empty.clearAll}
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} />
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={
                  buildBlogUrl(current, {
                    page: Math.max(1, safePage - 1),
                    keepPage: true,
                  }) as any
                }
                aria-disabled={safePage === 1}
                className={`border-border rounded-md border px-3 py-1.5 text-sm ${
                  safePage === 1
                    ? 'text-muted-foreground pointer-events-none opacity-50'
                    : 'hover:border-[color:var(--ring)] hover:text-[color:var(--ring)]'
                }`}
              >
                {tb.pagination.previous}
              </Link>
              <span className="text-muted-foreground text-sm">
                {tb.pagination.pageOf.replace('{page}', String(safePage)).replace('{total}', String(totalPages))}
              </span>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={
                  buildBlogUrl(current, {
                    page: Math.min(totalPages, safePage + 1),
                    keepPage: true,
                  }) as any
                }
                aria-disabled={safePage === totalPages}
                className={`border-border rounded-md border px-3 py-1.5 text-sm ${
                  safePage === totalPages
                    ? 'text-muted-foreground pointer-events-none opacity-50'
                    : 'hover:border-[color:var(--ring)] hover:text-[color:var(--ring)]'
                }`}
              >
                {tb.pagination.next}
              </Link>
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
