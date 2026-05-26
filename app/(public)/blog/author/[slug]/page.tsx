import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, Users } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import {
  articlesByAuthor,
  findBlogAuthor,
  getBlogAuthors,
} from '@/lib/blog-facets'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getBlogAuthors().map((author) => ({ slug: author.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const author = findBlogAuthor(params.slug)
  if (!author) return { title: 'Penulis Tidak Ditemukan' }
  return {
    title: `${author.name} — Penulis di RPI Blog`,
    description: `Semua artikel oleh ${author.name}, ${author.role}.`,
  }
}

export default function AuthorPage({ params }: { params: Params }) {
  const author = findBlogAuthor(params.slug)
  if (!author) notFound()

  const articles = articlesByAuthor(params.slug)
  const otherAuthors = getBlogAuthors()
    .filter((a) => a.slug !== params.slug)
    .slice(0, 6)

  return (
    <>
      {/* Hero */}
      <section
        className="bg-background relative isolate overflow-hidden"
        aria-labelledby="author-heading"
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
            backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, ${author.color} 16%, transparent), transparent 65%)`,
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke blog
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
            {/* LEFT column: avatar + identity */}
            <div className="flex items-start gap-5 lg:flex-col lg:items-start">
              <div
                aria-hidden
                className="grid size-24 shrink-0 place-items-center rounded-3xl text-3xl text-white shadow-xl"
                style={{ background: author.color }}
              >
                <span className="font-heading">{author.initial}</span>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px w-8"
                  style={{ background: author.color }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-[0.2em]"
                  style={{ color: author.color }}
                >
                  Penulis Blog
                </span>
              </div>
              <h1
                id="author-heading"
                className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
              >
                {author.name}
              </h1>
              <p className="text-muted-foreground mt-3 text-lg font-medium md:text-xl">
                {author.role}
              </p>
              {author.bio && (
                <p className="text-muted-foreground mt-5 max-w-2xl text-balance leading-relaxed md:text-lg">
                  {author.bio}
                </p>
              )}
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen
                    className="h-4 w-4"
                    style={{ color: author.color }}
                    aria-hidden
                  />
                  <strong className="text-foreground font-medium">
                    {articles.length}
                  </strong>{' '}
                  artikel
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          {articles.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <BookOpen
                className="text-muted-foreground mx-auto h-8 w-8"
                aria-hidden
              />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                Belum ada artikel oleh penulis ini
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Cek kembali nanti — atau jelajahi penulis lain di bawah.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/blog">Kembali ke blog</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/blog/${a.slug}` as Route}>
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
                          <span>{a.readMin} min baca</span>
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

      {/* Other authors rail */}
      {otherAuthors.length > 0 && (
        <section className="bg-muted/30 py-20 md:py-24" aria-label="Penulis lain">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-10">
              <div className="mb-3 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                  <Users className="inline h-3.5 w-3.5" aria-hidden /> Penulis lain
                </span>
              </div>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                Penulis lain di blog
              </h2>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherAuthors.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/blog/author/${a.slug}` as Route}
                    className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-5 transition"
                  >
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-xl text-lg text-white shadow"
                      style={{ background: a.color }}
                    >
                      <span className="font-heading">{a.initial}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                        {a.name}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {a.role}
                      </p>
                      <div className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                        <BookOpen className="h-3 w-3" aria-hidden />
                        {a.count} artikel
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}
