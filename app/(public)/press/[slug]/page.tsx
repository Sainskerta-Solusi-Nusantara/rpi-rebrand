import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Copy,
  Download,
  FileText,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  Printer,
  Quote,
  Share2,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  PRESS_CATEGORY_COLOR,
  PRESS_RELEASES,
  type PressRelease,
  type PressSection,
  findRelease,
  relatedReleases,
} from '@/lib/press-data'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return PRESS_RELEASES.map((r) => ({ slug: r.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const r = findRelease(params.slug)
  if (!r) return { title: 'Siaran Pers Tidak Ditemukan' }
  return {
    title: `${r.title} — Press RPI`,
    description: r.subtitle.slice(0, 160),
    openGraph: {
      title: r.title,
      description: r.subtitle.slice(0, 160),
      type: 'article',
      publishedTime: r.dateIso,
      tags: r.tags,
    },
  }
}

export default function PressDetailPage({ params }: { params: Params }) {
  const release = findRelease(params.slug)
  if (!release) notFound()

  const related = relatedReleases(params.slug, 3)
  const color = PRESS_CATEGORY_COLOR[release.category]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: release.title,
    description: release.subtitle,
    datePublished: release.dateIso,
    author: {
      '@type': 'Organization',
      name: 'Rumah Pekerja Indonesia',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rumah Pekerja Indonesia',
    },
    keywords: release.tags.join(', '),
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
        aria-labelledby="press-detail-heading"
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
            href="/press"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke press room
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-3xl px-6 pb-10 pt-8 md:pb-12 md:pt-10">
          {/* Category badge */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: `color-mix(in oklab, ${color} 12%, transparent)`,
                color: color,
              }}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: color }}
              />
              {release.category}
            </span>
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {release.date}
            </span>
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Jakarta, Indonesia
            </span>
          </div>

          <h1
            id="press-detail-heading"
            className="font-heading text-balance text-3xl font-semibold leading-[1.15] tracking-tight md:text-4xl lg:text-[42px] lg:leading-[1.1]"
          >
            {release.title}
          </h1>
          <p className="text-muted-foreground mt-5 text-balance text-lg leading-relaxed md:text-xl">
            {release.subtitle}
          </p>

          {/* Embargo + actions strip */}
          <div className="border-border mt-8 flex flex-wrap items-center justify-between gap-4 border-y py-4">
            <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
              <Newspaper className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
              <span>
                <strong className="text-foreground font-medium">UNTUK PUBLIKASI SEGERA</strong>{' '}
                · {release.dateline}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PrintButton />
              <CopyLinkButton slug={release.slug} />
              <Button asChild size="sm" variant="outline">
                <a href={release.downloads[0].href}>
                  <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  PDF
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            {/* Article */}
            <article className="min-w-0">
              {/* Lead paragraph with dateline */}
              <p className="text-foreground/85 mb-6 text-base leading-[1.75] md:text-lg">
                <strong className="text-foreground font-semibold">
                  {release.dateline}
                </strong>{' '}
                — {(release.body[0]?.type === 'p' ? release.body[0].text : '')}
              </p>

              <div className="space-y-6">
                {release.body.slice(1).map((section, i) => (
                  <SectionRender key={i} section={section} />
                ))}
              </div>

              {/* End marker */}
              <div className="text-muted-foreground my-10 text-center text-sm tracking-[0.4em]">
                — # # # —
              </div>

              {/* Tags */}
              {release.tags.length > 0 && (
                <div className="border-border border-t pt-8">
                  <div className="text-muted-foreground mb-3 text-[10px] font-medium uppercase tracking-wider">
                    Topik
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {release.tags.map((t) => (
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
            </article>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
              {/* Media contact */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Kontak Media
                </div>
                <div className="font-heading text-foreground mt-2 text-base font-semibold">
                  {release.contact.name}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {release.contact.role}
                </div>
                <div className="text-muted-foreground mt-4 space-y-2 text-sm">
                  <a
                    href={`mailto:${release.contact.email}?subject=Tanya: ${encodeURIComponent(release.title)}`}
                    className="hover:text-[color:var(--ring)] inline-flex items-center gap-2 transition"
                  >
                    <Mail className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                    {release.contact.email}
                  </a>
                  <a
                    href={`tel:${release.contact.phone.replace(/\s+/g, '')}`}
                    className="hover:text-[color:var(--ring)] inline-flex items-center gap-2 transition"
                  >
                    <Phone className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                    {release.contact.phone}
                  </a>
                </div>
                <Button asChild size="sm" className="mt-5 w-full">
                  <a
                    href={`mailto:${release.contact.email}?subject=Wawancara: ${encodeURIComponent(release.title)}`}
                  >
                    Permintaan Wawancara
                  </a>
                </Button>
              </div>

              {/* Downloads */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Materi Pengunduhan
                </div>
                <ul className="mt-4 space-y-2">
                  {release.downloads.map((d) => (
                    <li key={d.label}>
                      <a
                        href={d.href}
                        className="hover:bg-muted/40 hover:border-[color:var(--ring)] border-border flex items-center gap-3 rounded-lg border p-3 text-sm transition"
                      >
                        <FileText
                          className="text-[color:var(--ring)] h-4 w-4 shrink-0"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground truncate font-medium">
                            {d.label}
                          </div>
                          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                            {d.format}
                          </div>
                        </div>
                        <Download
                          className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Share */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  <Share2 className="inline h-3.5 w-3.5" aria-hidden /> Bagikan
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['LinkedIn', 'WhatsApp', 'Email', 'X / Twitter'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] rounded-md border px-2.5 py-1 text-[10px] font-medium transition"
                    >
                      {s}
                    </button>
                  ))}
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
          aria-label="Siaran pers terkait"
        >
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Siaran Pers Lain
                  </span>
                </div>
                <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  Pengumuman terkait
                </h2>
              </div>
              <Link
                href="/press"
                className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
              >
                Lihat semua
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <RelatedReleaseCard release={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Press room CTA */}
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto w-full max-w-4xl px-6">
          <div className="border-border bg-card relative overflow-hidden rounded-3xl border p-10 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-50"
              style={{
                background:
                  'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 18%, transparent), transparent)',
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  Butuh informasi lebih?
                </h2>
                <p className="text-muted-foreground mt-3 max-w-xl text-sm">
                  Akses arsip lengkap siaran pers, press kit, foto eksekutif, dan
                  brand guidelines di press room kami.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild>
                  <Link href="/press">
                    <Newspaper className="mr-2 h-4 w-4" aria-hidden />
                    Press Room
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a href="/press-kit/RPI-Press-Kit-Full.zip">
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    Press Kit
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function SectionRender({ section }: { section: PressSection }) {
  switch (section.type) {
    case 'p':
      return (
        <p className="text-foreground/85 text-base leading-[1.75] md:text-lg">
          {section.text}
        </p>
      )
    case 'h2':
      return (
        <h2 className="font-heading text-foreground mt-10 text-xl font-semibold tracking-tight md:text-2xl">
          {section.text}
        </h2>
      )
    case 'list':
      if (section.ordered) {
        return (
          <ol className="ml-6 list-decimal space-y-2 text-base text-foreground/85 marker:text-[color:var(--ring)] marker:font-semibold md:text-lg">
            {section.items.map((it) => (
              <li key={it} className="pl-1 leading-relaxed">
                {it}
              </li>
            ))}
          </ol>
        )
      }
      return (
        <ul className="space-y-2.5 text-base text-foreground/85 md:text-lg">
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
        <blockquote className="border-l-[color:var(--ring)] my-2 border-l-2 pl-6">
          <Quote className="text-[color:var(--ring)]/40 -ml-1 h-7 w-7" aria-hidden />
          <p className="font-heading text-foreground/95 mt-2 text-lg italic leading-relaxed md:text-xl">
            "{section.text}"
          </p>
          <footer className="text-muted-foreground mt-4 text-xs">
            <strong className="text-foreground font-medium">
              {section.author}
            </strong>{' '}
            — {section.role}
          </footer>
        </blockquote>
      )
    case 'stat':
      return (
        <dl className="border-border bg-muted/20 my-4 grid grid-cols-2 gap-6 rounded-2xl border p-6 md:grid-cols-4">
          {section.items.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="font-heading text-[color:var(--ring)] text-2xl font-semibold tracking-tight md:text-3xl">
                {s.value}
              </dt>
              <dd className="text-muted-foreground mt-1 text-[10px] uppercase tracking-wider">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      )
  }
}

// ---------------------------------------------------------------------------
// Interactive bits
// ---------------------------------------------------------------------------

function PrintButton() {
  return (
    <a
      href="javascript:window.print()"
      className="border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition"
    >
      <Printer className="h-3.5 w-3.5" aria-hidden />
      Cetak
    </a>
  )
}

function CopyLinkButton({ slug }: { slug: string }) {
  return (
    <a
      href={`/press/${slug}`}
      className="border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden />
      Salin link
    </a>
  )
}

function RelatedReleaseCard({ release }: { release: PressRelease }) {
  const color = PRESS_CATEGORY_COLOR[release.category]
  return (
    <Link
      href={`/press/${release.slug}`}
      className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full flex-col gap-3 rounded-2xl border p-5 transition"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: `color-mix(in oklab, ${color} 12%, transparent)`,
            color,
          }}
        >
          <span
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ background: color }}
          />
          {release.category}
        </span>
        <span className="text-muted-foreground text-xs">{release.date}</span>
      </div>
      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] line-clamp-3 text-base font-semibold leading-snug transition">
        {release.title}
      </h3>
      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
        {release.excerpt}
      </p>
      <span className="text-foreground/80 group-hover:text-[color:var(--ring)] mt-auto inline-flex items-center gap-1 text-xs font-medium transition">
        Baca selengkapnya
        <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  )
}
