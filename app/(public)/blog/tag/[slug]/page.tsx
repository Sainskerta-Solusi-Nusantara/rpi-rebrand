import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, Tag as TagIcon } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  articlesByTag,
  findBlogTag,
  getBlogTags,
} from '@/lib/blog-facets'
import { getServerT } from '@/lib/i18n/server-dictionary'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getBlogTags().map((tag) => ({ slug: tag.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const tag = findBlogTag(params.slug)
  if (!tag) return { title: 'Tag Tidak Ditemukan' }
  return {
    title: `#${tag.name} — Blog RPI`,
    description: `Semua artikel dengan tag ${tag.name} di blog RPI.`,
  }
}

export default async function TagPage({
  params: { slug },
}: {
  params: Params
}) {
  const t = await getServerT()
  const tag = findBlogTag(slug)
  if (!tag) notFound()

  const articles = articlesByTag(slug)
  const allTags = getBlogTags()
  const relatedTags = allTags
    .filter((t) => t.slug !== slug)
    .slice(0, 8)
  const otherTagsForRail = allTags
    .filter((t) => t.slug !== slug)
    .slice(0, 12)

  return (
    <>
      {/* Hero */}
      <section
        className="bg-background relative isolate overflow-hidden"
        aria-labelledby="tag-heading"
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
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 16%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.pagesBlog.backToBlog}
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="mb-4 flex items-center gap-3">
            <span
              aria-hidden
              className="h-px w-8 bg-[color:var(--ring)]"
            />
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
              <TagIcon className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              {t.pagesBlog.tag.eyebrow}
            </span>
          </div>
          <h1
            id="tag-heading"
            className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
          >
            #{tag.name}
          </h1>
          <p className="text-muted-foreground mt-5 text-balance text-lg leading-relaxed md:text-xl">
            <strong className="text-foreground font-medium">
              {tag.count}
            </strong>{' '}
            {t.pagesBlog.tag.articlesWith.replace('{n}', '').trimStart()}
          </p>

          {relatedTags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground mr-1 text-xs font-medium uppercase tracking-wider">
                {t.pagesBlog.tag.otherTags}
              </span>
              {relatedTags.map((tag) => (
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/blog/tag/${tag.slug}` as any}
                  key={tag.slug}
                  className="border-border bg-card text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition"
                >
                  #{tag.name}
                  <span className="text-muted-foreground">{tag.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Articles grid */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          {articles.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <BookOpen className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                {t.pagesBlog.tag.emptyHeading}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t.pagesBlog.tag.emptyBody}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/blog">{t.pagesBlog.seeAllArticles}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/blog/${a.slug}` as any}
                    className="block h-full"
                  >
                    <article className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full flex-col overflow-hidden rounded-2xl border transition">
                      <div
                        className="relative aspect-[16/9] overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`,
                        }}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-0 grid place-items-center text-5xl"
                        >
                          {a.emoji}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
                          <span>{a.category}</span>
                          <span aria-hidden>·</span>
                          <span>{t.pagesBlog.readMin.replace('{n}', String(a.readMin))}</span>
                        </div>
                        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] mb-2 line-clamp-2 text-base font-semibold leading-snug transition">
                          {a.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
                          {a.excerpt}
                        </p>
                        <div className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
                          <span>{a.author.name}</span>
                          <span>{a.date}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Footer rail: other tags */}
      {otherTagsForRail.length > 0 && (
        <section
          className="bg-muted/30 py-16 md:py-20"
          aria-label={t.pagesBlog.tag.exploreOtherTagsAriaLabel}
        >
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                {t.pagesBlog.tag.exploreOtherTags}
              </span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {otherTagsForRail.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/blog/tag/${tag.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] text-foreground/80 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition"
                  >
                    #{tag.name}
                    <span className="text-muted-foreground text-xs">
                      {tag.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
