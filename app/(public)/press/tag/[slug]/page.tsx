import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Newspaper, Tag as TagIcon } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  findPressTag,
  getPressTags,
  releasesByTag,
} from '@/lib/press-facets'
import { PRESS_CATEGORY_COLOR } from '@/lib/press-data'
import { getServerT } from '@/lib/i18n/server-dictionary'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getPressTags().map((tag) => ({ slug: tag.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const tag = findPressTag(params.slug)
  if (!tag) return { title: 'Tag Tidak Ditemukan' }
  return {
    title: `#${tag.name} — Press SSN`,
    description: `Semua siaran pers SSN dengan tag ${tag.name}.`,
  }
}

export default async function TagPage({
  params: { slug },
}: {
  params: Params
}) {
  const t = await getServerT()
  const tag = findPressTag(slug)
  if (!tag) notFound()

  const releases = releasesByTag(slug)
  const allTags = getPressTags()
  const relatedTags = allTags
    .filter((tg) => tg.slug !== slug)
    .slice(0, 8)
  const otherTagsForRail = allTags
    .filter((tg) => tg.slug !== slug)
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
            href="/press"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.pagesPress.common.backToPressBrief}
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
              {t.pagesPress.tag.eyebrow}
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
            {t.pagesPress.common.pressReleaseCount.replace('{n}', '').trim()}
          </p>

          {relatedTags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground mr-1 text-xs font-medium uppercase tracking-wider">
                {t.pagesPress.tag.otherTagsLabel}
              </span>
              {relatedTags.map((tg) => (
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/press/tag/${tg.slug}` as any}
                  key={tg.slug}
                  className="border-border bg-card text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition"
                >
                  #{tg.name}
                  <span className="text-muted-foreground">{tg.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Release list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-5xl px-6">
          {releases.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <Newspaper className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                {t.pagesPress.tag.emptyHeading}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t.pagesPress.tag.emptyBody}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/press">{t.pagesPress.tag.emptyAction}</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {releases.map((r) => (
                <li key={r.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/press/${r.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] group block rounded-2xl border p-6 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white"
                            style={{ background: PRESS_CATEGORY_COLOR[r.category] }}
                          >
                            {r.category}
                          </span>
                          <span>{r.date}</span>
                        </div>
                        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-lg font-semibold leading-snug transition">{r.title}</h3>
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-relaxed">{r.excerpt}</p>
                      </div>
                    </div>
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
          aria-label={t.pagesPress.tag.ariaOtherTags}
        >
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                {t.pagesPress.tag.otherEyebrow}
              </span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {otherTagsForRail.map((tg) => (
                <li key={tg.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/press/tag/${tg.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] text-foreground/80 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition"
                  >
                    #{tg.name}
                    <span className="text-muted-foreground text-xs">
                      {tg.count}
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
