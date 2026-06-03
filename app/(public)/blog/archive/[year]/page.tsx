import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, CalendarRange } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  articlesByYear,
  getBlogYears,
  type BlogYearFacet,
} from '@/lib/blog-facets'
import { getServerT } from '@/lib/i18n/server-dictionary'

type Params = { year: string }

export function generateStaticParams(): Params[] {
  return getBlogYears().map((y) => ({ year: String(y.year) }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const yearInt = Number.parseInt(params.year, 10)
  const years = getBlogYears()
  const known = years.find((y) => y.year === yearInt)
  if (!Number.isFinite(yearInt) || !known) {
    return { title: 'Arsip Tidak Ditemukan' }
  }
  return {
    title: `${yearInt} — Arsip Blog RPI`,
    description: `Semua artikel blog RPI yang terbit tahun ${yearInt}.`,
  }
}

export default async function ArchivePage({
  params: { year },
}: {
  params: Params
}) {
  const t = await getServerT()
  const yearInt = Number.parseInt(year, 10)
  if (!Number.isFinite(yearInt)) notFound()

  const years = getBlogYears()
  const current = years.find((y) => y.year === yearInt)
  if (!current) notFound()

  const articles = articlesByYear(yearInt)
  const otherYears: BlogYearFacet[] = years.filter(
    (y) => y.year !== yearInt,
  )

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="archive-heading"
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
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--ring)]">
              {t.pagesBlog.archive.eyebrow}
            </span>
          </div>
          <h1
            id="archive-heading"
            className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
          >
            {t.pagesBlog.archive.heading.replace('{year}', String(yearInt))}
          </h1>
          <p className="text-muted-foreground mt-5 text-balance text-lg leading-relaxed md:text-xl">
            {t.pagesBlog.archive.subtitle.replace('{year}', String(yearInt))}
          </p>
          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen
                className="h-4 w-4 text-[color:var(--ring)]"
                aria-hidden
              />
              <strong className="text-foreground font-medium">
                {current.count}
              </strong>{' '}
              {t.pagesBlog.archive.articlesInArchive}
            </span>
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          {articles.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <BookOpen
                className="text-muted-foreground mx-auto h-8 w-8"
                aria-hidden
              />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                {t.pagesBlog.archive.emptyHeading.replace('{year}', String(yearInt))}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t.pagesBlog.archive.emptyBody}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/blog">{t.pagesBlog.seeAllArticles}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Link href={`/blog/${a.slug}` as any}>
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
                        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] mb-2 text-base font-semibold leading-snug transition line-clamp-2">
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

      {/* Other years */}
      {otherYears.length > 0 && (
        <section
          className="bg-muted/30 py-16 md:py-20"
          aria-label={t.pagesBlog.archive.otherYearsAriaLabel}
        >
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex items-center gap-3">
              <CalendarRange
                className="h-4 w-4 text-[color:var(--ring)]"
                aria-hidden
              />
              <h2 className="font-heading text-foreground text-lg font-semibold tracking-tight md:text-xl">
                {t.pagesBlog.archive.otherYears}
              </h2>
            </div>
            <ul className="flex flex-wrap gap-3">
              {otherYears.map((y) => (
                <li key={y.year}>
                  <Link
                    href={`/blog/archive/${y.year}`}
                    className="border-border bg-card hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
                  >
                    <span className="text-foreground">{y.year}</span>
                    <span className="text-muted-foreground text-xs">
                      {t.pagesBlog.articleCount.replace('{n}', String(y.count))}
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
