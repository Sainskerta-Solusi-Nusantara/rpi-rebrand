'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  Compass,
  GraduationCap,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'
import {
  BLOG_CATEGORIES,
  FEATURED_ARTICLE,
  REGULAR_ARTICLES,
} from '@/lib/blog-data'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CATEGORIES = BLOG_CATEGORIES

type Article = {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  authorRole: string
  date: string
  readMin: number
  gradient: [string, string]
  emoji: string
}

function toArticle(a: typeof FEATURED_ARTICLE): Article {
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

const FEATURED: Article = toArticle(FEATURED_ARTICLE)

const ARTICLES: Article[] = REGULAR_ARTICLES.map(toArticle)
void ARTICLES

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export type BlogHeroProps = {
  activeCategory: string
  activeQuery: string
  /** Pre-built hrefs for each category chip (server-rendered, no functions cross
   * the server -> client boundary). */
  categoryHrefs: Record<string, string>
}

export function BlogHero({ activeCategory, activeQuery, categoryHrefs }: BlogHeroProps) {
  const { t } = useI18n()
  const tc = t.formsPublicSections.blog
  const tl = t.formsMisc3.blogLeftover

  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="blog-hero-heading"
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

      <div className="container mx-auto w-full max-w-5xl px-6 pt-20 md:pt-28">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center justify-center gap-3"
        >
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {tc.hero.eyebrow}
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="blog-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {tl.headingPrefix}{' '}
          <span className="text-[color:var(--ring)]">{tc.hero.headingHighlight}</span>
          {' '}{tl.headingSuffix}
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg"
        >
          {tc.hero.body}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-10 flex w-full max-w-xl items-center"
        >
          <form
            method="get"
            action="/blog"
            className="border-border bg-card focus-within:border-[color:var(--ring)] flex w-full items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition"
          >
            <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery}
              placeholder={tc.hero.searchPlaceholder}
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label={tc.hero.searchLabel}
            />
            {activeQuery && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={categoryHrefs[activeCategory] as any}
                className="text-muted-foreground hover:text-foreground text-xs font-medium"
                aria-label="Hapus pencarian"
              >
                {tc.hero.clearSearch}
              </Link>
            )}
            <button
              type="submit"
              className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
            >
              {tc.hero.searchBtn}
            </button>
            {/* Preserve category when submitting a search */}
            {activeCategory !== 'all' && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
          </form>
        </motion.div>
      </div>

      <div className="container mx-auto w-full max-w-6xl px-6 pb-10 pt-12 md:pb-12 md:pt-16">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.slug
            return (
              <Link
                key={c.slug}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={categoryHrefs[c.slug] as any}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
                aria-current={active ? 'true' : undefined}
              >
                {c.label}
              </Link>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Featured Post
// ---------------------------------------------------------------------------

export function BlogFeatured() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.blog

  return (
    <section
      className="bg-background pb-12"
      aria-labelledby="blog-featured-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.5 }}
          id="blog-featured-heading"
          className="sr-only"
        >
          {tc.featured.srHeading}
        </motion.h2>
        <motion.article
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="border-border bg-card group grid overflow-hidden rounded-3xl border lg:grid-cols-[1.05fr_0.95fr]"
        >
          <Link
            href={`/blog/${FEATURED.slug}`}
            aria-hidden
            tabIndex={-1}
            className="relative block aspect-[4/3] overflow-hidden lg:aspect-auto"
            style={{
              background: `linear-gradient(135deg, ${FEATURED.gradient[0]} 0%, ${FEATURED.gradient[1]} 100%)`,
            }}
          >
            <div className="absolute inset-0 grid place-items-center text-7xl opacity-90 transition group-hover:scale-105">
              {FEATURED.emoji}
            </div>
            <div className="absolute left-5 top-5">
              <span className="bg-background/90 text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                <Sparkles className="h-3 w-3" aria-hidden />
                {tc.featured.badge}
              </span>
            </div>
          </Link>

          <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
            <CategoryBadge slug={FEATURED.category} />
            <Link href={`/blog/${FEATURED.slug}`}>
              <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-balance text-2xl font-semibold leading-tight tracking-tight transition md:text-3xl">
                {FEATURED.title}
              </h3>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed">
              {FEATURED.excerpt}
            </p>

            <div className="border-border text-muted-foreground mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-5 text-xs">
              <span className="text-foreground/85 font-medium">
                {FEATURED.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {FEATURED.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {tc.featured.readMin.replace('{n}', String(FEATURED.readMin))}
              </span>
            </div>

            <div>
              <Button asChild variant="default" className="mt-2">
                <Link href={`/blog/${FEATURED.slug}`}>
                  {tc.featured.readCta}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Article Grid
// ---------------------------------------------------------------------------

export type BlogSortOption = {
  value: 'newest' | 'alpha' | 'quick'
  label: string
  href: string
}

export type BlogPaginationLink =
  | { kind: 'page'; page: number; active: boolean; href: string }
  | { kind: 'ellipsis' }
  | { kind: 'prev' | 'next'; disabled: boolean; href: string }

export type BlogGridProps = {
  articles: Article[]
  activeCategory: string
  activeQuery: string
  clearAllHref: string
  hasAnyFilter: boolean
  /** Total filtered count (across all pages). */
  totalCount: number
  /** Current page number (1-based). */
  page: number
  /** Total pages. */
  totalPages: number
  /** Sort dropdown options with prebuilt hrefs. */
  sortOptions: BlogSortOption[]
  activeSort: BlogSortOption['value']
  /** Pagination link models — empty array hides the nav. */
  paginationLinks: BlogPaginationLink[]
}

export function BlogGrid({
  articles,
  activeCategory,
  activeQuery,
  clearAllHref,
  hasAnyFilter,
  totalCount,
  page,
  totalPages,
  sortOptions,
  activeSort,
  paginationLinks,
}: BlogGridProps) {
  const { t } = useI18n()
  const tc = t.formsPublicSections.blog
  const tl = t.formsMisc3.blogLeftover

  const activeCategoryLabel =
    activeCategory !== 'all'
      ? CATEGORIES.find((c) => c.slug === activeCategory)?.label
      : undefined

  return (
    <section
      className="bg-background pb-20 md:pb-24"
      aria-labelledby="blog-grid-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="blog-grid-heading"
              className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl"
            >
              {tc.grid.heading}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {tc.grid.countBase.replace('{total}', String(totalCount))}
              {activeCategoryLabel &&
                tc.grid.countCategory.replace('{category}', activeCategoryLabel)}
              {activeQuery && (
                <>
                  {' '}{tl.searchResultFor} &ldquo;
                  <strong className="text-foreground font-medium">
                    {activeQuery}
                  </strong>
                  &rdquo;
                </>
              )}
              {totalPages > 1 && (
                <>
                  {' '}{tc.grid.pageOf
                    .replace('{page}', String(page))
                    .replace('{total}', String(totalPages))}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort pills */}
            <div
              role="group"
              aria-label="Urutkan"
              className="border-border bg-card flex items-center gap-1 rounded-full border p-1"
            >
              <span className="text-muted-foreground px-2 text-[10px] font-medium uppercase tracking-wider">
                {tc.grid.sortLabel}
              </span>
              {sortOptions.map((opt) => {
                const active = activeSort === opt.value
                return (
                  <Link
                    key={opt.value}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={opt.href as any}
                    className={
                      active
                        ? 'bg-[color:var(--ring)] text-[color:var(--primary-foreground)] rounded-full px-3 py-1 text-xs font-medium transition'
                        : 'text-foreground/70 hover:text-foreground rounded-full px-3 py-1 text-xs transition hover:bg-muted/50'
                    }
                    aria-current={active ? 'true' : undefined}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
            {hasAnyFilter && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={clearAllHref as any}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                {tc.grid.clearFilter}
              </Link>
            )}
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border p-12 text-center">
            <Search className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
            <h3 className="font-heading text-foreground mt-4 text-lg font-semibold">
              {tc.grid.emptyHeading}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {tc.grid.emptyBody}
            </p>
            {hasAnyFilter && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={clearAllHref as any}
                className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
              >
                {tc.grid.clearFilterLink}
              </Link>
            )}
          </div>
        ) : (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, i) => (
                <motion.li
                  key={a.slug}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: 0.03 * (i % 6) }}
                >
                  <ArticleCard article={a} />
                </motion.li>
              ))}
            </ul>

            {paginationLinks.length > 0 && (
              <nav
                aria-label="Pagination"
                className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-2 text-sm"
              >
                {paginationLinks.map((link, idx) => {
                  if (link.kind === 'ellipsis') {
                    return (
                      <span key={`e-${idx}`} className="px-2 text-xs">
                        …
                      </span>
                    )
                  }
                  if (link.kind === 'prev' || link.kind === 'next') {
                    const label = link.kind === 'prev' ? tc.grid.prevPage : tc.grid.nextPage
                    const cls = link.disabled
                      ? 'border-border text-muted-foreground/40 inline-flex min-w-[36px] cursor-not-allowed items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm'
                      : 'border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm transition'
                    if (link.disabled) {
                      return (
                        <span key={link.kind} className={cls} aria-disabled="true">
                          {label}
                        </span>
                      )
                    }
                    return (
                      <Link
                        key={link.kind}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={link.href as any}
                        className={cls}
                        aria-label={label}
                      >
                        {label}
                      </Link>
                    )
                  }
                  if (link.kind === 'page') {
                    const cls = link.active
                      ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium'
                      : 'border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm transition'
                    return (
                      <Link
                        key={link.page}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={link.href as any}
                        className={cls}
                        aria-label={tc.grid.pageLabel.replace('{page}', String(link.page))}
                        aria-current={link.active ? 'page' : undefined}
                      >
                        {link.page}
                      </Link>
                    )
                  }
                  return null
                })}
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function ArticleCard({ article }: { article: Article }) {
  const { t } = useI18n()
  const tl = t.formsMisc3.blogLeftover

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full flex-col overflow-hidden rounded-2xl border transition"
    >
      <div
        aria-hidden
        className="relative aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${article.gradient[0]} 0%, ${article.gradient[1]} 100%)`,
        }}
      >
        <div className="absolute inset-0 grid place-items-center text-5xl opacity-90 transition group-hover:scale-110">
          {article.emoji}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <CategoryBadge slug={article.category} />
        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] line-clamp-2 text-base font-semibold leading-snug transition">
          {article.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {article.excerpt}
        </p>

        <div className="border-border text-muted-foreground mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs">
          <span className="text-foreground/80 truncate font-medium">
            {article.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" aria-hidden />
            {tl.articleReadMin.replace('{n}', String(article.readMin))}
          </span>
        </div>
      </div>
    </Link>
  )
}

function CategoryBadge({ slug }: { slug: string }) {
  const cat = CATEGORIES.find((c) => c.slug === slug)
  if (!cat || cat.slug === 'all') return null
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: `color-mix(in oklab, ${cat.color} 12%, transparent)`,
        color: cat.color,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: cat.color }}
      />
      {cat.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Topics & Most Popular
// ---------------------------------------------------------------------------

const POPULAR = [
  { rank: 1, title: 'Negosiasi gaji untuk yang pertama kali', reads: '124K' },
  { rank: 2, title: 'Membaca offer letter: 9 hal yang sering terlewat', reads: '98K' },
  { rank: 3, title: 'Resign dengan elegan (tanpa membakar jembatan)', reads: '76K' },
  { rank: 4, title: 'Portfolio designer yang menjual diri sendiri', reads: '65K' },
  { rank: 5, title: 'Membuat keputusan job hopping vs bertahan', reads: '54K' },
]

const TOPIC_TILES = [
  { icon: Briefcase,    label: 'Tips Karier',     slug: 'tips-karier',  count: 124, color: '#635BFF' },
  { icon: Users,        label: 'Rekrutmen',       slug: 'rekrutmen',    count: 86,  color: '#10B981' },
  { icon: TrendingUp,   label: 'Gaji & Industri', slug: 'gaji',         count: 52,  color: '#F59E0B' },
  { icon: GraduationCap,label: 'Skill & Belajar', slug: 'skills',       count: 71,  color: '#0EA5E9' },
  { icon: Compass,      label: 'Kepemimpinan',    slug: 'kepemimpinan', count: 38,  color: '#EC4899' },
  { icon: Sparkles,     label: 'Cerita Pekerja',  slug: 'cerita',       count: 47,  color: '#8B5CF6' },
]

export function BlogTopics() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.blog

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="blog-topics-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr]">
          {/* Topics grid */}
          <div>
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {tc.topics.eyebrow}
                </span>
              </div>
              <h2
                id="blog-topics-heading"
                className="font-heading text-2xl font-semibold tracking-tight md:text-3xl"
              >
                {tc.topics.heading}
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TOPIC_TILES.map((tile, i) => {
                const Icon = tile.icon
                return (
                  <motion.a
                    key={tile.label}
                    {...fadeUp}
                    transition={{ duration: 0.4, delay: 0.03 * i }}
                    href={`/blog/topic/${tile.slug}`}
                    className="border-border bg-card hover:border-[color:var(--ring)] group flex flex-col gap-3 rounded-xl border p-4 transition"
                  >
                    <span
                      aria-hidden
                      className="grid size-9 place-items-center rounded-lg"
                      style={{
                        background: `color-mix(in oklab, ${tile.color} 12%, transparent)`,
                        color: tile.color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-heading text-foreground text-sm font-semibold">
                        {tile.label}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {tc.topics.articleCount.replace('{count}', String(tile.count))}
                      </div>
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </div>

          {/* Popular list */}
          <motion.aside
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {tc.topics.popularEyebrow}
              </span>
            </div>
            <ol className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
              {POPULAR.map((p) => (
                <li key={p.rank}>
                  <a
                    href={`/blog/popular-${p.rank}`}
                    className="hover:bg-muted/40 group flex items-start gap-4 px-5 py-4 transition"
                  >
                    <span className="font-heading text-[color:var(--ring)] w-6 shrink-0 text-2xl font-semibold">
                      {p.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-foreground group-hover:text-[color:var(--ring)] line-clamp-2 text-sm font-medium transition">
                        {p.title}
                      </h3>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <BookOpen className="h-3 w-3" aria-hidden />
                        {tc.topics.reads.replace('{reads}', p.reads)}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
