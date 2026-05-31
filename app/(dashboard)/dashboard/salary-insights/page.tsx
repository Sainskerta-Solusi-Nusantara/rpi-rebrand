import Link from 'next/link'
import { ChevronLeft, Filter, MapPin, TrendingUp, Wallet } from 'lucide-react'
import type { ExperienceLevel } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  getSalaryStatsByCategory,
  type SalaryStats,
} from '@/lib/salary/queries'

export const metadata = { title: 'Wawasan Gaji — Dasbor' }

const idrFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function fmt(v: number | null): string {
  if (v == null) return '—'
  return idrFmt.format(v)
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'EXECUTIVE',
]

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry',
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

const LEVEL_TONE: Record<ExperienceLevel, string> = {
  ENTRY: 'bg-sky-500',
  JUNIOR: 'bg-indigo-500',
  MID: 'bg-violet-500',
  SENIOR: 'bg-amber-500',
  LEAD: 'bg-orange-500',
  EXECUTIVE: 'bg-emerald-500',
}

type Bucket = {
  label: string
  min: number
  max: number | null // null = open-ended (>=)
  count: number
}

function makeHistogram(stats: SalaryStats): Bucket[] {
  const buckets: Bucket[] = [
    { label: '< 10jt', min: 0, max: 10_000_000, count: 0 },
    { label: '10–20jt', min: 10_000_000, max: 20_000_000, count: 0 },
    { label: '20–30jt', min: 20_000_000, max: 30_000_000, count: 0 },
    { label: '30–50jt', min: 30_000_000, max: 50_000_000, count: 0 },
    { label: '50jt+', min: 50_000_000, max: null, count: 0 },
  ]
  // We don't have raw data points in SalaryStats, so distribute from byLevel
  // medians weighted by count. That's the best we can do without re-querying.
  // Approximate: each level contributes its `count` to the bucket containing
  // its median.
  for (const lvl of stats.byLevel) {
    if (lvl.median == null) continue
    for (const b of buckets) {
      if (b.max == null) {
        if (lvl.median >= b.min) {
          b.count += lvl.count
          break
        }
      } else if (lvl.median >= b.min && lvl.median < b.max) {
        b.count += lvl.count
        break
      }
    }
  }
  return buckets
}

export default async function SalaryInsightsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await requireAuth('/dashboard/salary-insights')

  const categorySlug =
    typeof searchParams.category === 'string' && searchParams.category
      ? searchParams.category
      : undefined
  const expLevelRaw =
    typeof searchParams.level === 'string' ? searchParams.level : ''
  const experienceLevel = EXPERIENCE_LEVELS.includes(
    expLevelRaw as ExperienceLevel,
  )
    ? (expLevelRaw as ExperienceLevel)
    : undefined
  const location =
    typeof searchParams.location === 'string' && searchParams.location.trim()
      ? searchParams.location.trim()
      : undefined

  const [categories, stats] = await Promise.all([
    prisma.jobCategory
      .findMany({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        select: { slug: true, name: true },
      })
      .catch(() => []),
    getSalaryStatsByCategory({
      categorySlug,
      experienceLevel,
      location,
    }),
  ])

  const histogram = makeHistogram(stats)
  const histMax = Math.max(1, ...histogram.map((b) => b.count))
  const levelMax = Math.max(
    1,
    ...stats.byLevel.map((l) => l.median ?? 0),
  )

  const filterLabel =
    [
      categorySlug
        ? categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug
        : null,
      experienceLevel ? LEVEL_LABEL[experienceLevel] : null,
      location,
    ]
      .filter(Boolean)
      .join(' · ') || 'Semua lowongan'

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke dasbor
        </Link>
      </div>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[hsl(220,50%,14%)] text-white">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl">
              Wawasan Gaji
            </h1>
            <p className="text-muted-foreground text-sm">
              Estimasi gaji bulanan lintas tenant — agregat data publik
            </p>
          </div>
        </div>
      </header>

      {/* Filter form */}
      <section
        aria-label="Filter"
        className="border-border bg-card rounded-2xl border p-5"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filter
        </div>
        <form
          method="get"
          action="/dashboard/salary-insights"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground font-medium">Kategori</span>
            <select
              name="category"
              defaultValue={categorySlug ?? ''}
              className="border-border bg-background rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground font-medium">
              Tingkat pengalaman
            </span>
            <select
              name="level"
              defaultValue={experienceLevel ?? ''}
              className="border-border bg-background rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Semua level</option>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {LEVEL_LABEL[lvl]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground font-medium">Lokasi</span>
            <input
              type="text"
              name="location"
              defaultValue={location ?? ''}
              placeholder="cth. Jakarta"
              className="border-border bg-background rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Terapkan
            </button>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/salary-insights' as any}
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {/* Hero KPI */}
      <section
        aria-label="Ringkasan gaji"
        className="grid gap-4 md:grid-cols-3"
      >
        <div className="border-border bg-card rounded-2xl border p-5 md:col-span-1">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span>Gaji median</span>
          </div>
          <div className="font-heading mt-2 text-3xl tabular-nums">
            {fmt(stats.median)}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {filterLabel}
          </div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="text-muted-foreground text-xs">
            Rentang umum (P25–P75)
          </div>
          <div className="font-heading mt-2 text-lg tabular-nums">
            {fmt(stats.p25)} – {fmt(stats.p75)}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            Min {fmt(stats.min)} · Maks {fmt(stats.max)}
          </div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="text-muted-foreground text-xs">Ukuran sampel</div>
          <div className="font-heading mt-2 text-lg tabular-nums">
            {stats.count.toLocaleString('id-ID')} lowongan
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {stats.sampleSize > stats.count
              ? `${stats.sampleSize.toLocaleString('id-ID')} total cocok filter`
              : 'Semua data masuk perhitungan'}
          </div>
        </div>
      </section>

      {/* Breakdown by experience level */}
      <section
        aria-label="Median per tingkat pengalaman"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4">
          <h2 className="font-heading text-lg">Median per tingkat pengalaman</h2>
          <p className="text-muted-foreground text-xs">
            Estimasi gaji median bulanan untuk setiap level
          </p>
        </div>
        {stats.byLevel.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada data gaji untuk filter ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {EXPERIENCE_LEVELS.map((lvl) => {
              const row = stats.byLevel.find((r) => r.level === lvl)
              if (!row) return null
              const pct =
                row.median != null && levelMax > 0
                  ? Math.max(2, (row.median / levelMax) * 100)
                  : 0
              return (
                <li key={lvl}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{LEVEL_LABEL[lvl]}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {fmt(row.median)} · {row.count.toLocaleString('id-ID')}{' '}
                      lowongan
                    </span>
                  </div>
                  <div
                    className="bg-muted h-3 w-full overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={row.median ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={levelMax}
                    aria-label={`Median ${LEVEL_LABEL[lvl]}`}
                  >
                    <div
                      className={`${LEVEL_TONE[lvl]} h-full rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {row.p25 != null && row.p75 != null ? (
                    <div className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                      P25 {fmt(row.p25)} · P75 {fmt(row.p75)}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Distribution histogram */}
      <section
        aria-label="Distribusi rentang gaji"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4">
          <h2 className="font-heading text-lg">Distribusi rentang gaji</h2>
          <p className="text-muted-foreground text-xs">
            Sebaran perkiraan jumlah lowongan per rentang
          </p>
        </div>
        {stats.count === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada data gaji untuk filter ini.
          </p>
        ) : (
          <div className="space-y-3">
            <svg
              viewBox="0 0 500 160"
              preserveAspectRatio="none"
              className="text-primary block h-40 w-full"
              role="img"
              aria-label="Histogram distribusi gaji"
            >
              {histogram.map((b, i) => {
                const barWidth = 500 / histogram.length
                const x = i * barWidth + 6
                const w = barWidth - 12
                const h = histMax > 0 ? (b.count / histMax) * 140 : 0
                const y = 150 - h
                return (
                  <g key={b.label}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="currentColor"
                      fillOpacity={0.85}
                      rx={3}
                    />
                  </g>
                )
              })}
            </svg>
            <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
              {histogram.map((b) => (
                <div key={b.label}>
                  <div className="text-foreground font-medium">{b.label}</div>
                  <div className="text-muted-foreground tabular-nums">
                    {b.count.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Breakdown by location */}
      <section
        aria-label="Top lokasi"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4">
          <h2 className="font-heading text-lg">Top 10 lokasi</h2>
          <p className="text-muted-foreground text-xs">
            Lokasi dengan lowongan terbanyak — median gaji bulanan
          </p>
        </div>
        {stats.byLocation.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada data lokasi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Lokasi</th>
                  <th className="py-2 pr-3 font-medium text-right">
                    Lowongan
                  </th>
                  <th className="py-2 font-medium text-right">Median</th>
                </tr>
              </thead>
              <tbody>
                {stats.byLocation.map((row) => (
                  <tr
                    key={row.location}
                    className="border-border/60 border-b last:border-b-0"
                  >
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          className="text-muted-foreground h-3 w-3"
                          aria-hidden="true"
                        />
                        {row.location}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {row.count.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {fmt(row.median)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Breakdown by category (when no category filter) */}
      {!categorySlug && stats.byCategory.length > 0 ? (
        <section
          aria-label="Top kategori"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4">
            <h2 className="font-heading text-lg">Top 10 kategori</h2>
            <p className="text-muted-foreground text-xs">
              Kategori paling sering muncul — median gaji bulanan
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Kategori</th>
                  <th className="py-2 pr-3 font-medium text-right">
                    Lowongan
                  </th>
                  <th className="py-2 font-medium text-right">Median</th>
                </tr>
              </thead>
              <tbody>
                {stats.byCategory.map((row) => (
                  <tr
                    key={row.category}
                    className="border-border/60 border-b last:border-b-0"
                  >
                    <td className="py-2 pr-3 font-medium">{row.category}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {row.count.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {fmt(row.median)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Sumber: data dari {stats.sampleSize.toLocaleString('id-ID')} lowongan
        PUBLISHED yang cocok filter. Estimasi disusun dari titik tengah
        rentang gaji setiap lowongan. Maksimum 5.000 lowongan terbaru per
        kueri.
      </p>
    </div>
  )
}
