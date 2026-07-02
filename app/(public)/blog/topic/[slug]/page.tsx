import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import {
  BLOG_CATEGORIES,
  articlesByCategory,
  findCategory,
  type BlogArticle,
} from '@/lib/blog-data'
import { getServerT } from '@/lib/i18n/server-dictionary'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return BLOG_CATEGORIES
    .filter((c) => c.slug !== 'all')
    .map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const cat = findCategory(params.slug)
  if (!cat || cat.slug === 'all') return { title: 'Topik Tidak Ditemukan' }
  return {
    title: `${cat.label} — Blog SSN`,
    description: cat.description ?? `Artikel di topik ${cat.label}`,
  }
}

export default async function BlogTopicPage({ params }: { params: Params }) {
  const t = await getServerT()
  const cat = findCategory(params.slug)
  if (!cat || cat.slug === 'all') notFound()

  const articles = articlesByCategory(params.slug)
  const otherTopics = BLOG_CATEGORIES.filter(
    (c) => c.slug !== 'all' && c.slug !== params.slug,
  )

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="topic-heading"
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
            backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, ${cat.color} 16%, transparent), transparent 65%)`,
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.pagesBlog.topic.backToBlog}
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden className="h-px w-8" style={{ background: cat.color }} />
                <span
                  className="text-xs font-medium uppercase tracking-[0.2em]"
                  style={{ color: cat.color }}
                >
                  {t.pagesBlog.topic.eyebrow}
                </span>
              </div>
              <h1
                id="topic-heading"
                className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
              >
                {cat.label}
              </h1>
              {cat.description && (
                <p className="text-muted-foreground mt-5 text-balance text-lg leading-relaxed md:text-xl">
                  {cat.description}
                </p>
              )}
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" style={{ color: cat.color }} aria-hidden />
                  <strong className="text-foreground font-medium">
                    {articles.length}
                  </strong>{' '}
                  {t.pagesBlog.topic.articlesInTopic}
                </span>
              </div>
            </div>

            {/* Big emoji visual */}
            <div
              aria-hidden
              className="hidden h-40 w-40 shrink-0 place-items-center rounded-3xl text-6xl shadow-xl lg:grid"
              style={{
                background: `linear-gradient(135deg, ${cat.color} 0%, color-mix(in oklab, ${cat.color} 65%, black) 100%)`,
              }}
            >
              <span className="grid place-items-center">{cat.emoji ?? '📰'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Articles list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          {articles.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <BookOpen className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                {t.pagesBlog.topic.emptyHeading}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t.pagesBlog.topic.emptyBody}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/blog">{t.pagesBlog.seeAllArticles}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, i) => (
                <li key={a.slug}>
                  <ArticleCard article={a} highlight={i === 0} latest={t.pagesBlog.topic.latest} readMin={t.pagesBlog.readMin} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Other topics */}
      <section className="bg-muted/30 py-20 md:py-24" aria-label={t.pagesBlog.topic.otherTopicsAriaLabel}>
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <Compass className="inline h-3.5 w-3.5" aria-hidden /> {t.pagesBlog.topic.otherTopicsEyebrow}
                </span>
              </div>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                {t.pagesBlog.topic.otherTopicsHeading}
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
            >
              {t.pagesBlog.topic.allArticles}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherTopics.map((topic) => {
              const count = articlesByCategory(topic.slug).length
              return (
                <li key={topic.slug}>
                  <Link
                    href={`/blog/topic/${topic.slug}`}
                    className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-5 transition"
                  >
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-xl text-xl"
                      style={{
                        background: `color-mix(in oklab, ${topic.color} 12%, transparent)`,
                        color: topic.color,
                      }}
                    >
                      {topic.emoji ?? '📰'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                        {topic.label}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                        {topic.description ?? ''}
                      </p>
                      <div className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                        <BookOpen className="h-3 w-3" aria-hidden />
                        {t.pagesBlog.articleCount.replace('{n}', String(count))}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}

function ArticleCard({
  article,
  highlight,
  latest,
  readMin,
}: {
  article: BlogArticle
  highlight?: boolean
  latest: string
  readMin: string
}) {
  const cat = findCategory(article.category)
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
        {highlight && (
          <div className="absolute left-3 top-3">
            <span className="bg-background/90 text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
              {latest}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {cat && (
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
        )}
        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] line-clamp-2 text-base font-semibold leading-snug transition">
          {article.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {article.excerpt}
        </p>
        <div className="border-border text-muted-foreground mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs">
          <span className="text-foreground/80 truncate font-medium">
            {article.author.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" aria-hidden />
            {readMin.replace('{n}', String(article.readMin))}
          </span>
        </div>
      </div>
    </Link>
  )
}
