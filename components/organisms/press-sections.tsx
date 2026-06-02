'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Calendar,
  Camera,
  Download,
  FileText,
  Globe,
  Linkedin,
  Mail,
  Newspaper,
  Palette,
  Quote,
  Send,
  Sparkles,
  Trophy,
  Type,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'
import {
  PRESS_CATEGORIES,
  PRESS_CATEGORY_COLOR,
  type PressCategory,
} from '@/lib/press-data'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function PressHero() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press
  const tl = t.formsMisc3.pressLeftover

  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="press-hero-heading"
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

      <div className="container mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
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
          id="press-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {tl.headingPrefix}{' '}
          <span className="text-[color:var(--ring)]">{tc.hero.headingHighlight}</span>{' '}
          {tl.headingSuffix}
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          {tc.hero.body}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <a href="#press-kit">
              {tc.hero.ctaPressKit}
              <Download className="ml-2 h-4 w-4" aria-hidden />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#press-contact">
              {tc.hero.ctaContact}
            </a>
          </Button>
        </motion.div>

        <motion.dl
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {[
            { v: '2.4M+', l: tc.hero.statWorkers },
            { v: '12K+',  l: tc.hero.statPartners },
            { v: '34',    l: tc.hero.statProvinces },
            { v: '2021',  l: tc.hero.statFounded },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <dt className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                {s.v}
              </dt>
              <dd className="text-muted-foreground mt-1 text-xs uppercase tracking-wider">
                {s.l}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Press Releases
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = PRESS_CATEGORY_COLOR

type Release = {
  date: string
  category: PressCategory
  title: string
  excerpt: string
  href: string
}

const RELEASE_CATEGORIES = PRESS_CATEGORIES

export type PressReleasesProps = {
  releases: Release[]
  totalCount: number
  /** Active filter — 'Semua' means no category filter. */
  activeCategory: PressCategory | 'Semua'
  activeQuery: string
  /** Pre-built hrefs for each category chip (keyed by category label,
   * including 'Semua' for clear). */
  categoryHrefs: Record<string, string>
  clearAllHref: string
  hasAnyFilter: boolean
}

export function PressReleases({
  releases,
  totalCount,
  activeCategory,
  activeQuery,
  categoryHrefs,
  clearAllHref,
  hasAnyFilter,
}: PressReleasesProps) {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press
  const tl = t.formsMisc3.pressLeftover

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="press-releases-heading"
    >
      <div className="container mx-auto w-full max-w-5xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.releases.eyebrow}
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="press-releases-heading"
                className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
              >
                {tc.releases.heading}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {hasAnyFilter
                  ? tc.releases.countFiltered
                      .replace('{count}', String(releases.length))
                      .replace('{total}', String(totalCount))
                  : tc.releases.countAll.replace('{total}', String(totalCount))}
                {activeQuery && (
                  <>
                    {' '}{tl.searchResultFor} &ldquo;
                    <strong className="text-foreground font-medium">
                      {activeQuery}
                    </strong>
                    &rdquo;
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RELEASE_CATEGORIES.map((c) => {
                const active = activeCategory === c
                return (
                  <Link
                    key={c}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={categoryHrefs[c] as any}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                      active
                        ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    )}
                    aria-current={active ? 'true' : undefined}
                  >
                    {c}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Search form */}
          <form method="get" action="/press" className="mt-6 max-w-xl">
            <div className="border-border bg-card focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition">
              <input
                type="search"
                name="q"
                defaultValue={activeQuery}
                placeholder={tc.releases.searchPlaceholder}
                className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
                aria-label={tc.releases.searchLabel}
              />
              {activeQuery && (
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={categoryHrefs[activeCategory] as any}
                  className="text-muted-foreground hover:text-foreground text-xs font-medium"
                  aria-label="Hapus pencarian"
                >
                  {tc.releases.clearSearch}
                </Link>
              )}
              <button
                type="submit"
                className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
              >
                {tc.releases.searchBtn}
              </button>
              {activeCategory !== 'Semua' && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
            </div>
          </form>
        </motion.div>

        {releases.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border p-12 text-center">
            <h3 className="font-heading text-foreground text-lg font-semibold">
              {tc.releases.emptyHeading}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {tc.releases.emptyBody}
            </p>
            {hasAnyFilter && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={clearAllHref as any}
                className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
              >
                {tc.releases.clearFilter}
              </Link>
            )}
          </div>
        ) : (
        <ol className="border-border bg-card divide-border overflow-hidden rounded-2xl border">
          {releases.map((r, i) => {
            const color = CATEGORY_COLORS[r.category]
            return (
              <motion.li
                key={r.href}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
                className="border-border [&:not(:last-child)]:border-b"
              >
                <a
                  href={r.href}
                  className="group hover:bg-muted/30 grid gap-4 px-5 py-5 transition sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-6 sm:px-7"
                >
                  <div className="flex flex-col gap-2 sm:items-start">
                    <span
                      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
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
                      {r.category}
                    </span>
                    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {r.date}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold leading-snug transition sm:text-lg">
                      {r.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {r.excerpt}
                    </p>
                  </div>
                  <span className="text-foreground/80 group-hover:text-[color:var(--ring)] hidden shrink-0 items-center gap-1 self-start pt-1 text-sm font-medium transition sm:inline-flex">
                    {tc.releases.readCta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </a>
              </motion.li>
            )
          })}
        </ol>
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <a href="/press/archive">
              {tc.releases.archiveCta}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Coverage (As Seen In)
// ---------------------------------------------------------------------------

type Outlet = {
  name: string
  initial: string
  color: string
}

const OUTLETS: Outlet[] = [
  { name: 'Kompas',         initial: 'K',  color: '#003F88' },
  { name: 'Tempo',          initial: 'T',  color: '#E31837' },
  { name: 'Bisnis Indonesia',initial: 'BI', color: '#003D7A' },
  { name: 'DealStreetAsia', initial: 'D',  color: '#0A2540' },
  { name: 'TechCrunch',     initial: 'TC', color: '#0A8852' },
  { name: 'Tech in Asia',   initial: 'TA', color: '#FF5722' },
  { name: 'Bloomberg',      initial: 'B',  color: '#000000' },
  { name: 'Katadata',       initial: 'K',  color: '#FF6900' },
  { name: 'Detik',          initial: 'D',  color: '#0066B3' },
  { name: 'CNBC Indonesia', initial: 'C',  color: '#005AAB' },
]

type QuoteItem = {
  outlet: string
  date: string
  headline: string
  quote: string
  href: string
}

const QUOTES: QuoteItem[] = [
  {
    outlet: 'Bloomberg',
    date: 'Mei 2026',
    headline: "Indonesia's Next Talent Powerhouse",
    quote:
      '"RPI mengubah cara perusahaan Indonesia berburu talenta — dari hubungan personal yang lambat menjadi proses berbasis data yang transparan."',
    href: 'https://example.com/bloomberg',
  },
  {
    outlet: 'TechCrunch',
    date: 'April 2026',
    headline: 'Why RPI Is Different from LinkedIn',
    quote:
      '"Berbeda dengan platform global yang melokalisasi, RPI dibangun dari Indonesia untuk Indonesia — perbedaan ini terasa pada setiap detail produk."',
    href: 'https://example.com/techcrunch',
  },
  {
    outlet: 'Tempo',
    date: 'Maret 2026',
    headline: 'Wajah Baru Pasar Kerja Indonesia',
    quote:
      '"Lewat data publik dan riset terbuka, RPI bukan hanya menjual produk — mereka mengubah percakapan publik tentang ketenagakerjaan."',
    href: 'https://example.com/tempo',
  },
]

export function PressCoverage() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="press-coverage-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.coverage.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="press-coverage-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.coverage.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.coverage.body}
          </p>
        </motion.div>

        {/* Outlet logos */}
        <motion.ul
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-5"
        >
          {OUTLETS.map((o) => (
            <li
              key={o.name}
              className="border-border bg-card flex items-center gap-3 rounded-xl border p-3"
            >
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-md text-xs font-bold text-white"
                style={{ background: o.color }}
              >
                {o.initial}
              </span>
              <span className="text-foreground/85 truncate text-sm font-medium">
                {o.name}
              </span>
            </li>
          ))}
        </motion.ul>

        {/* Featured quotes */}
        <div className="grid gap-5 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.a
              key={q.headline}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              href={q.href}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-card hover:border-[color:var(--ring)] group flex flex-col rounded-2xl border p-6 transition"
            >
              <Quote className="text-[color:var(--ring)]/40 h-6 w-6" aria-hidden />
              <blockquote className="text-foreground/90 font-heading mt-3 text-sm italic leading-relaxed">
                {q.quote}
              </blockquote>
              <div className="border-border mt-auto pt-4 border-t mt-5">
                <div className="text-foreground group-hover:text-[color:var(--ring)] text-sm font-semibold transition">
                  {q.outlet}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {q.headline} · {q.date}
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

type AwardItem = {
  year: string
  title: string
  org: string
  category: string
}

const AWARDS: AwardItem[] = [
  { year: '2026', title: 'LinkedIn Top Startup Indonesia', org: 'LinkedIn',           category: 'Talent Brand' },
  { year: '2026', title: 'Best HR Tech Platform',          org: 'HR Asia Awards',     category: 'Produk' },
  { year: '2025', title: 'Forbes 30 Under 30 Asia',        org: 'Forbes',             category: 'CEO Founder' },
  { year: '2025', title: 'Most Innovative SaaS',           org: 'IDC FutureScape',     category: 'Inovasi' },
  { year: '2025', title: 'Best Workplace Indonesia',       org: 'Great Place to Work', category: 'Budaya' },
  { year: '2024', title: 'Tech in Asia Top 50',            org: 'Tech in Asia',        category: 'Startup Pilihan' },
]

export function PressAwards() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="press-awards-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.awards.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="press-awards-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.awards.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.awards.body}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AWARDS.map((a, i) => (
            <motion.div
              key={`${a.year}-${a.title}`}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.03 * i }}
              className="border-border bg-card hover:border-[color:var(--ring)]/50 group flex h-full items-start gap-4 rounded-xl border p-5 transition"
            >
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
              >
                <Trophy className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {a.year} · {a.category}
                </div>
                <h3 className="font-heading text-foreground mt-1 text-base font-semibold leading-snug">
                  {a.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">{a.org}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Leadership (Headshots & Bios)
// ---------------------------------------------------------------------------

type Leader = {
  name: string
  role: string
  bio: string
  initial: string
  color: string
}

export function PressLeadership() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press

  const LEADERS: Leader[] = [
    {
      name: 'Arif Wibowo',
      role: 'Co-Founder & CEO',
      bio: tc.leadership.leaderArif.bio,
      initial: 'AW',
      color: '#0A2540',
    },
    {
      name: 'Siti Nurhasanah',
      role: 'Co-Founder & CTO',
      bio: tc.leadership.leaderSiti.bio,
      initial: 'SN',
      color: '#635BFF',
    },
    {
      name: 'Daniel Setiawan',
      role: 'Chief Operating Officer',
      bio: tc.leadership.leaderDaniel.bio,
      initial: 'DS',
      color: '#10B981',
    },
    {
      name: 'Maya Pratiwi',
      role: 'VP Communications',
      bio: tc.leadership.leaderMaya.bio,
      initial: 'MP',
      color: '#EC4899',
    },
  ]

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="press-leadership-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.leadership.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="press-leadership-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.leadership.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.leadership.body}
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERS.map((l, i) => (
            <motion.div
              key={l.name}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="border-border bg-card flex h-full flex-col items-center rounded-2xl border p-6 text-center"
            >
              <div
                aria-hidden
                className="font-heading mb-4 grid size-24 place-items-center rounded-full text-2xl font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${l.color} 0%, color-mix(in oklab, ${l.color} 70%, black) 100%)`,
                }}
              >
                {l.initial}
              </div>
              <h3 className="font-heading text-foreground text-base font-semibold">
                {l.name}
              </h3>
              <p className="text-[color:var(--ring)] mt-1 text-xs font-medium uppercase tracking-wider">
                {l.role}
              </p>
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                {l.bio}
              </p>
              <a
                href={`https://linkedin.com/in/${l.name.toLowerCase().replace(/\s+/g, '-')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1.5 text-xs font-medium transition"
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden />
                LinkedIn
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Press Kit
// ---------------------------------------------------------------------------

type KitItem = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  format: string
  href: string
}

export function PressKit() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press

  const KIT_ITEMS: KitItem[] = [
    {
      icon: Sparkles,
      title: 'Logo Pack',
      desc: tc.kit.logoDesc,
      format: 'SVG · PNG · 2.4 MB',
      href: '/press-kit/RPI-Logo-Pack.zip',
    },
    {
      icon: Palette,
      title: 'Brand Guidelines',
      desc: tc.kit.brandDesc,
      format: 'PDF · 6.8 MB',
      href: '/press-kit/RPI-Brand-Guidelines.pdf',
    },
    {
      icon: Camera,
      title: 'Foto & Headshot',
      desc: tc.kit.photoDesc,
      format: 'JPG · 48 MB',
      href: '/press-kit/RPI-Photos.zip',
    },
    {
      icon: FileText,
      title: 'Fact Sheet',
      desc: tc.kit.factDesc,
      format: 'PDF · 320 KB',
      href: '/press-kit/RPI-Fact-Sheet.pdf',
    },
    {
      icon: Type,
      title: 'Boilerplate Text',
      desc: tc.kit.boilerplateDesc,
      format: 'DOCX · 24 KB',
      href: '/press-kit/RPI-Boilerplate.docx',
    },
    {
      icon: Award,
      title: 'Media Coverage Archive',
      desc: tc.kit.archiveDesc,
      format: 'Online',
      href: '/press/archive',
    },
  ]

  return (
    <section
      id="press-kit"
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="press-kit-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.kit.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="press-kit-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.kit.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.kit.body}
          </p>
        </motion.div>

        <div className="mb-8 text-center">
          <Button asChild size="lg">
            <a href="/press-kit/RPI-Press-Kit-Full.zip">
              {tc.kit.downloadAll}
              <Download className="ml-2 h-4 w-4" aria-hidden />
            </a>
          </Button>
          <p className="text-muted-foreground mt-3 text-xs">
            {tc.kit.downloadAllSub}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KIT_ITEMS.map((k, i) => {
            const Icon = k.icon
            return (
              <motion.a
                key={k.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
                href={k.href}
                className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-6 transition"
              >
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                    {k.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {k.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Download className="text-[color:var(--ring)] h-3 w-3" aria-hidden />
                    <span className="text-muted-foreground">{k.format}</span>
                  </div>
                </div>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Press Contact
// ---------------------------------------------------------------------------

export function PressContact() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.press

  return (
    <section
      id="press-contact"
      className="bg-background py-20 md:py-24"
      aria-labelledby="press-contact-heading"
    >
      <div className="container mx-auto w-full max-w-4xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="border-border bg-card relative overflow-hidden rounded-3xl border p-10 md:p-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-60"
            style={{
              background:
                'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 18%, transparent), transparent)',
            }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {tc.contact.eyebrow}
                </span>
              </div>
              <h2
                id="press-contact-heading"
                className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
              >
                {tc.contact.heading}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl text-base">
                {tc.contact.body}
              </p>

              <ul className="text-muted-foreground mt-8 space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Mail className="text-[color:var(--ring)] h-4 w-4 shrink-0" aria-hidden />
                  <a
                    href="mailto:press@rumahpekerja.id"
                    className="text-foreground font-medium hover:underline"
                  >
                    press@rumahpekerja.id
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Newspaper className="text-[color:var(--ring)] h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <strong className="text-foreground font-medium">Maya Pratiwi</strong>{' '}
                    — VP Communications
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Send className="text-[color:var(--ring)] h-4 w-4 shrink-0" aria-hidden />
                  <span>{tc.contact.directLine}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="text-[color:var(--ring)] h-4 w-4 shrink-0" aria-hidden />
                  <span>{tc.contact.languages}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild size="lg">
                <a href="mailto:press@rumahpekerja.id?subject=Permintaan Wawancara">
                  <Mail className="mr-2 h-4 w-4" aria-hidden />
                  {tc.contact.emailBtn}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/press-kit/RPI-Press-Kit-Full.zip">
                  <Download className="mr-2 h-4 w-4" aria-hidden />
                  {tc.contact.kitBtn}
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
