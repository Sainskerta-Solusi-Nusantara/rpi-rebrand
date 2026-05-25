'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Download,
  Filter,
  Mail,
  Newspaper,
  Search,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  PRESS_CATEGORIES,
  PRESS_CATEGORY_COLOR,
  PRESS_RELEASES,
  type PressCategory,
  type PressRelease,
} from '@/lib/press-data'
import { cn } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

type CategoryFilter = (typeof PRESS_CATEGORIES)[number]

function yearOf(dateIso: string): number {
  return new Date(dateIso).getFullYear()
}

function getYears(releases: PressRelease[]): number[] {
  const years = new Set(releases.map((r) => yearOf(r.dateIso)))
  return Array.from(years).sort((a, b) => b - a)
}

function groupByYear(releases: PressRelease[]): Map<number, PressRelease[]> {
  const map = new Map<number, PressRelease[]>()
  for (const r of releases) {
    const y = yearOf(r.dateIso)
    const list = map.get(y) ?? []
    list.push(r)
    map.set(y, list)
  }
  for (const [y, list] of map) {
    list.sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
    map.set(y, list)
  }
  return map
}

export default function PressArchivePage() {
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<CategoryFilter>('Semua')
  const [year, setYear] = React.useState<number | 'all'>('all')

  const allYears = React.useMemo(() => getYears(PRESS_RELEASES), [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRESS_RELEASES.filter((r) => {
      if (category !== 'Semua' && r.category !== category) return false
      if (year !== 'all' && yearOf(r.dateIso) !== year) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [query, category, year])

  const grouped = React.useMemo(() => groupByYear(filtered), [filtered])
  const groupedYears = Array.from(grouped.keys()).sort((a, b) => b - a)

  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = { Semua: PRESS_RELEASES.length }
    for (const cat of PRESS_CATEGORIES) {
      if (cat === 'Semua') continue
      map[cat] = PRESS_RELEASES.filter((r) => r.category === cat).length
    }
    return map
  }, [])

  const isFiltered = query.trim() || category !== 'Semua' || year !== 'all'

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
            href="/press"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke press room
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-4 flex items-center gap-3"
          >
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Arsip Press
            </span>
          </motion.div>
          <motion.h1
            id="archive-heading"
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl lg:text-5xl"
          >
            Arsip lengkap siaran pers
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground mt-4 max-w-2xl text-base md:text-lg"
          >
            Cari dan akses semua{' '}
            <strong className="text-foreground font-medium">
              {PRESS_RELEASES.length} siaran pers
            </strong>{' '}
            Rumah Pekerja Indonesia. Untuk wawancara atau permintaan kustom,
            hubungi tim media kami.
          </motion.p>
        </div>
      </section>

      {/* Filter & list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            {/* Main column */}
            <div className="min-w-0">
              {/* Filter bar */}
              <div className="border-border bg-card mb-8 rounded-2xl border p-5">
                {/* Search */}
                <div className="border-border bg-background focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 transition">
                  <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari judul, ringkasan, atau topik…"
                    className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
                    aria-label="Cari siaran pers"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-muted-foreground hover:text-foreground text-xs"
                      aria-label="Hapus pencarian"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>

                {/* Category chips */}
                <div className="border-border mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                    <Filter className="h-3 w-3" aria-hidden />
                    Kategori
                  </span>
                  {PRESS_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition',
                        category === c
                          ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {c}
                      <span
                        className={
                          category === c
                            ? 'opacity-70'
                            : 'text-muted-foreground/60'
                        }
                      >
                        {categoryCounts[c] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Year tabs */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                    <Calendar className="h-3 w-3" aria-hidden />
                    Tahun
                  </span>
                  <button
                    type="button"
                    onClick={() => setYear('all')}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      year === 'all'
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Semua
                  </button>
                  {allYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition',
                        year === y
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result count */}
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-foreground text-lg font-semibold">
                  {filtered.length} hasil
                  {isFiltered && (
                    <span className="text-muted-foreground text-sm font-normal">
                      {' '}dari {PRESS_RELEASES.length} siaran
                    </span>
                  )}
                </h2>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setCategory('Semua')
                      setYear('all')
                    }}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
                  >
                    <ArrowLeft className="h-3 w-3" aria-hidden />
                    Reset filter
                  </button>
                )}
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="border-border bg-card rounded-2xl border p-12 text-center">
                  <Search className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
                  <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
                    Tidak ada siaran pers yang cocok
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Coba ubah kata kunci atau pilih kategori lain.
                  </p>
                </div>
              )}

              {/* Grouped list */}
              {groupedYears.map((y) => {
                const list = grouped.get(y)!
                return (
                  <section key={y} className="mb-10" aria-label={`Tahun ${y}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
                        {y}
                      </h3>
                      <span className="bg-border h-px flex-1" aria-hidden />
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">
                        {list.length} {list.length === 1 ? 'siaran' : 'siaran'}
                      </span>
                    </div>
                    <ol className="border-border bg-card divide-border overflow-hidden rounded-2xl border">
                      {list.map((r) => (
                        <li
                          key={r.slug}
                          className="border-border [&:not(:last-child)]:border-b"
                        >
                          <ReleaseRow release={r} />
                        </li>
                      ))}
                    </ol>
                  </section>
                )
              })}
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
              {/* Stats */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Arsip
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <StatLine label="Total siaran" value={PRESS_RELEASES.length.toString()} />
                  <StatLine label="Tahun aktif" value={allYears.length.toString()} />
                  <StatLine
                    label="Kategori"
                    value={(PRESS_CATEGORIES.length - 1).toString()}
                  />
                  <StatLine label="Sejak" value={Math.min(...allYears).toString()} />
                </dl>
              </div>

              {/* Categories overview */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Per Kategori
                </div>
                <ul className="mt-4 space-y-2">
                  {PRESS_CATEGORIES.filter((c) => c !== 'Semua').map((c) => {
                    const color = PRESS_CATEGORY_COLOR[c as PressCategory]
                    const count = categoryCounts[c] ?? 0
                    return (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={() => setCategory(c)}
                          className="hover:bg-muted/30 flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ background: color }}
                            />
                            <span className="text-foreground/85">{c}</span>
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {count}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Media contact */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Tim Media
                </div>
                <p className="text-foreground/85 mt-3 text-sm leading-relaxed">
                  Untuk wawancara, riset, atau permintaan kustom — tim
                  komunikasi membalas dalam 4 jam kerja.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <a
                    href="mailto:press@rumahpekerja.id"
                    className="text-foreground hover:text-[color:var(--ring)] inline-flex items-center gap-2 font-medium transition"
                  >
                    <Mail className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                    press@rumahpekerja.id
                  </a>
                </div>
                <Button asChild size="sm" className="mt-5 w-full">
                  <Link href="/press#press-contact">Hubungi Tim Media</Link>
                </Button>
              </div>

              {/* Press kit */}
              <div className="border-[color:var(--ring)]/30 bg-[color:var(--ring)]/5 rounded-2xl border p-6">
                <div className="text-[color:var(--ring)] inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                  <Newspaper className="h-3 w-3" aria-hidden /> Press Kit
                </div>
                <p className="text-foreground/85 mt-3 text-sm leading-relaxed">
                  Logo pack, brand guidelines, foto eksekutif, fact sheet — semuanya
                  dalam satu unduhan.
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <a href="/press-kit/RPI-Press-Kit-Full.zip">
                    <Download className="mr-2 h-3.5 w-3.5" aria-hidden />
                    Unduh (58 MB)
                  </a>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

function ReleaseRow({ release }: { release: PressRelease }) {
  const color = PRESS_CATEGORY_COLOR[release.category]
  return (
    <Link
      href={`/press/${release.slug}`}
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
          {release.category}
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {release.date}
        </span>
      </div>
      <div className="min-w-0">
        <h4 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold leading-snug transition sm:text-lg">
          {release.title}
        </h4>
        <p className="text-muted-foreground line-clamp-2 mt-2 text-sm leading-relaxed">
          {release.excerpt}
        </p>
      </div>
      <span className="text-foreground/80 group-hover:text-[color:var(--ring)] hidden shrink-0 items-center gap-1 self-start pt-1 text-sm font-medium transition sm:inline-flex">
        Baca
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  )
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-heading text-foreground text-base font-semibold">
        {value}
      </dd>
    </div>
  )
}
