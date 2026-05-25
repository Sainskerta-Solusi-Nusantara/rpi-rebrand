import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Info,
  Lightbulb,
  Linkedin,
  Mail,
  MessageCircle,
  Quote,
  Share2,
  TriangleAlert,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import {
  BLOG_ARTICLES,
  BLOG_CATEGORIES,
  type BlogArticle,
  type BlogSection,
  findArticle,
  relatedArticles,
} from '@/lib/blog-data'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const a = findArticle(params.slug)
  if (!a) return { title: 'Artikel Tidak Ditemukan' }
  return {
    title: `${a.title} — RPI Blog`,
    description: a.subtitle.slice(0, 160),
    openGraph: {
      title: a.title,
      description: a.subtitle.slice(0, 160),
      type: 'article',
      authors: [a.author.name],
      publishedTime: a.dateIso,
      tags: a.tags,
    },
  }
}

function getCategory(slug: string) {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)
}

export default function ArticleDetailPage({ params }: { params: Params }) {
  const article = findArticle(params.slug)
  if (!article) notFound()

  const related = relatedArticles(params.slug, 3)
  const h2Sections = article.body
    .map((b, i) => (b.type === 'h2' ? { idx: i, text: b.text } : null))
    .filter((x): x is { idx: number; text: string } => x !== null)
  const category = getCategory(article.category)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.subtitle,
    datePublished: article.dateIso,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rumah Pekerja Indonesia',
    },
    keywords: article.tags.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="article-heading"
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

        <div className="container mx-auto w-full max-w-3xl px-6 pt-12 md:pt-16">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke blog
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-3xl px-6 pb-10 pt-8 md:pb-12 md:pt-10">
          {category && (
            <div className="mb-5">
              <span
                className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: `color-mix(in oklab, ${category.color} 12%, transparent)`,
                  color: category.color,
                }}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: category.color }}
                />
                {category.label}
              </span>
            </div>
          )}
          <h1
            id="article-heading"
            className="font-heading text-balance text-3xl font-semibold leading-[1.15] tracking-tight md:text-4xl lg:text-5xl"
          >
            {article.title}
          </h1>
          <p className="text-muted-foreground mt-5 text-balance text-lg md:text-xl">
            {article.subtitle}
          </p>

          {/* Author meta */}
          <div className="border-border mt-8 flex flex-wrap items-center gap-4 border-y py-5">
            <span
              aria-hidden
              className="font-heading grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${article.author.color} 0%, color-mix(in oklab, ${article.author.color} 70%, black) 100%)`,
              }}
            >
              {article.author.initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-foreground text-sm font-semibold">
                {article.author.name}
              </div>
              <div className="text-muted-foreground text-xs">
                {article.author.role}
              </div>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {article.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {article.readMin} menit baca
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="bg-background pb-12 md:pb-16">
        <div className="container mx-auto w-full max-w-4xl px-6">
          <div
            aria-hidden
            className="relative aspect-[16/8] w-full overflow-hidden rounded-3xl shadow-xl md:aspect-[16/7]"
            style={{
              background: `linear-gradient(135deg, ${article.gradient[0]} 0%, ${article.gradient[1]} 100%)`,
            }}
          >
            <div className="absolute inset-0 grid place-items-center text-8xl md:text-9xl">
              {article.emoji}
            </div>
          </div>
        </div>
      </section>

      {/* Body with optional TOC */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[200px_1fr_240px]">
            {/* TOC */}
            <aside
              className="hidden lg:block"
              aria-label="Daftar isi"
            >
              {h2Sections.length > 0 && (
                <div className="lg:sticky lg:top-24">
                  <div className="text-muted-foreground mb-3 text-[10px] font-medium uppercase tracking-wider">
                    Daftar Isi
                  </div>
                  <ol className="border-border space-y-2 border-l-2 pl-4 text-sm">
                    {h2Sections.map((s, i) => (
                      <li key={s.idx}>
                        <a
                          href={`#h-${s.idx}`}
                          className="text-foreground/70 hover:text-[color:var(--ring)] line-clamp-2 block transition"
                        >
                          <span className="text-muted-foreground mr-1.5 text-xs">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {s.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </aside>

            {/* Article body */}
            <article className="min-w-0">
              <div className="space-y-6">
                {article.body.map((section, i) => (
                  <SectionRender key={i} section={section} index={i} />
                ))}
              </div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="border-border mt-12 border-t pt-8">
                  <div className="text-muted-foreground mb-3 text-[10px] font-medium uppercase tracking-wider">
                    Topik
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="border-border bg-muted/40 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author bio */}
              <div className="border-border bg-card mt-10 flex flex-col gap-5 rounded-2xl border p-7 sm:flex-row sm:items-start">
                <span
                  aria-hidden
                  className="font-heading grid size-16 shrink-0 place-items-center rounded-full text-xl font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${article.author.color} 0%, color-mix(in oklab, ${article.author.color} 70%, black) 100%)`,
                  }}
                >
                  {article.author.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-foreground text-base font-semibold">
                    Tentang {article.author.name}
                  </h3>
                  <p className="text-[color:var(--ring)] mt-0.5 text-[10px] font-medium uppercase tracking-wider">
                    {article.author.role}
                  </p>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    {article.author.bio}
                  </p>
                </div>
              </div>
            </article>

            {/* Share sidebar */}
            <aside className="hidden lg:block" aria-label="Bagikan">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div>
                  <div className="text-muted-foreground mb-3 text-[10px] font-medium uppercase tracking-wider">
                    Bagikan
                  </div>
                  <div className="flex flex-col gap-2">
                    <ShareButton
                      icon={Linkedin}
                      label="LinkedIn"
                      href="https://linkedin.com"
                    />
                    <ShareButton
                      icon={MessageCircle}
                      label="WhatsApp"
                      href="https://wa.me"
                    />
                    <ShareButton icon={Mail} label="Email" href="mailto:" />
                    <ShareButton icon={Share2} label="Salin link" />
                  </div>
                </div>

                <div className="border-border bg-card rounded-xl border p-4">
                  <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                    Cepat
                  </div>
                  <div className="text-foreground mt-2 text-sm font-medium">
                    {article.readMin} menit baca
                  </div>
                  <div className="text-muted-foreground text-xs">
                    ~{Math.round(article.readMin * 200)} kata
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section
          className="bg-muted/30 py-20 md:py-24"
          aria-label="Artikel terkait"
        >
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Artikel Terkait
                  </span>
                </div>
                <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  Lanjutkan membaca
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
              >
                Semua artikel
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-6 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <RelatedArticleCard article={r} />
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

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function SectionRender({
  section,
  index,
}: {
  section: BlogSection
  index: number
}) {
  switch (section.type) {
    case 'p':
      return (
        <p className="text-foreground/85 text-base leading-[1.75] md:text-lg">
          {section.text}
        </p>
      )
    case 'h2':
      return (
        <h2
          id={`h-${index}`}
          className="font-heading text-foreground mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight md:text-3xl"
        >
          {section.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 className="font-heading text-foreground mt-8 text-xl font-semibold tracking-tight">
          {section.text}
        </h3>
      )
    case 'list':
      if (section.ordered) {
        return (
          <ol className="ml-6 list-decimal space-y-3 text-base text-foreground/85 marker:text-[color:var(--ring)] marker:font-semibold md:text-lg">
            {section.items.map((it) => (
              <li key={it} className="pl-1 leading-relaxed">
                {it}
              </li>
            ))}
          </ol>
        )
      }
      return (
        <ul className="space-y-3 text-base text-foreground/85 md:text-lg">
          {section.items.map((it) => (
            <li key={it} className="flex items-start gap-3 leading-relaxed">
              <span
                aria-hidden
                className="bg-[color:var(--ring)] mt-2.5 size-1.5 shrink-0 rounded-full md:mt-3"
              />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'quote':
      return (
        <blockquote className="border-l-[color:var(--ring)] my-4 border-l-2 pl-6">
          <Quote className="text-[color:var(--ring)]/40 -ml-1 h-7 w-7" aria-hidden />
          <p className="font-heading text-foreground/95 mt-2 text-lg italic leading-relaxed md:text-xl">
            {section.text}
          </p>
          {section.author && (
            <footer className="text-muted-foreground mt-4 text-xs">
              — {section.author}
            </footer>
          )}
        </blockquote>
      )
    case 'callout': {
      const tone = section.tone ?? 'info'
      const Icon = tone === 'warn' ? TriangleAlert : tone === 'tip' ? Lightbulb : Info
      const colors = {
        info: { bg: 'bg-[color:var(--ring)]/5', border: 'border-[color:var(--ring)]/30', icon: 'text-[color:var(--ring)]' },
        tip: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', icon: 'text-emerald-500' },
        warn: { bg: 'bg-amber-500/5', border: 'border-amber-500/30', icon: 'text-amber-500' },
      }[tone]
      return (
        <div className={`${colors.bg} ${colors.border} my-2 rounded-2xl border p-5`}>
          <div className="flex items-start gap-3">
            <Icon className={`${colors.icon} mt-0.5 h-5 w-5 shrink-0`} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-heading text-foreground text-sm font-semibold">
                {section.title}
              </div>
              <p className="text-foreground/80 mt-1.5 text-sm leading-relaxed">
                {section.body}
              </p>
            </div>
          </div>
        </div>
      )
    }
    case 'image':
      return (
        <figure className="my-6">
          <div
            aria-hidden
            className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${section.gradient[0]} 0%, ${section.gradient[1]} 100%)`,
            }}
          >
            <div className="absolute inset-0 grid place-items-center text-7xl">
              {section.emoji}
            </div>
          </div>
          {section.caption && (
            <figcaption className="text-muted-foreground mt-3 text-center text-xs">
              {section.caption}
            </figcaption>
          )}
        </figure>
      )
  }
}

// ---------------------------------------------------------------------------
// Share + Related
// ---------------------------------------------------------------------------

function ShareButton({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
}) {
  const cls =
    'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition'
  if (href) {
    const isExternal = href.startsWith('http')
    return (
      <a
        href={href}
        className={cls}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </a>
    )
  }
  return (
    <button type="button" className={cls}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  )
}

function RelatedArticleCard({ article }: { article: BlogArticle }) {
  const cat = getCategory(article.category)
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
        {cat && (
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
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
            {article.readMin} min
          </span>
        </div>
      </div>
    </Link>
  )
}
