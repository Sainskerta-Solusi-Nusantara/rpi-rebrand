'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bookmark,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface JobItem {
  id: string
  title: string
  slug?: string | null
  location?: string | null
  locationType?: string | null
  employmentType?: string | null
  salaryMin?: number | bigint | null
  salaryMax?: number | bigint | null
  salaryCurrency?: string | null
  publishedAt?: Date | string | null
  tenant?: { name?: string | null; slug?: string | null } | null
  category?: { name?: string | null; slug?: string | null } | null
}

export interface JobsCarouselProps {
  jobs?: JobItem[]
  className?: string
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-amber-400 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
] as const

const PLACEHOLDER_JOBS: JobItem[] = [
  {
    id: 'p1',
    title: 'Senior Software Engineer',
    slug: 'senior-software-engineer',
    location: 'Jakarta',
    locationType: 'On-site',
    employmentType: 'Full-time',
    salaryMin: 18_000_000,
    salaryMax: 25_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    tenant: { name: 'Telkom', slug: 'telkom' },
    category: { name: 'Teknologi', slug: 'teknologi' },
  },
  {
    id: 'p2',
    title: 'Product Designer',
    slug: 'product-designer',
    location: 'Bandung',
    locationType: 'Remote',
    employmentType: 'Remote',
    salaryMin: 12_000_000,
    salaryMax: 18_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    tenant: { name: 'Tokopedia', slug: 'tokopedia' },
    category: { name: 'Desain', slug: 'desain' },
  },
  {
    id: 'p3',
    title: 'Marketing Specialist',
    slug: 'marketing-specialist',
    location: 'Jakarta',
    locationType: 'Hybrid',
    employmentType: 'Hybrid',
    salaryMin: 8_000_000,
    salaryMax: 12_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    tenant: { name: 'BCA', slug: 'bca' },
    category: { name: 'Marketing', slug: 'marketing' },
  },
  {
    id: 'p4',
    title: 'Data Analyst',
    slug: 'data-analyst',
    location: 'Surabaya',
    locationType: 'On-site',
    employmentType: 'Full-time',
    salaryMin: 10_000_000,
    salaryMax: 15_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    tenant: { name: 'Pertamina', slug: 'pertamina' },
    category: { name: 'Data', slug: 'data' },
  },
  {
    id: 'p5',
    title: 'Customer Success Manager',
    slug: 'customer-success-manager',
    location: 'Jakarta',
    locationType: 'Remote',
    employmentType: 'Remote',
    salaryMin: 11_000_000,
    salaryMax: 16_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    tenant: { name: 'GoTo', slug: 'goto' },
    category: { name: 'Operasional', slug: 'operasional' },
  },
  {
    id: 'p6',
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    location: 'Bekasi',
    locationType: 'Hybrid',
    employmentType: 'Hybrid',
    salaryMin: 15_000_000,
    salaryMax: 22_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    tenant: { name: 'Astra', slug: 'astra' },
    category: { name: 'Teknologi', slug: 'teknologi' },
  },
]

function toNumber(value: number | bigint | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'bigint') return Number(value)
  return value
}

function formatRupiahRange(
  min: number | bigint | null | undefined,
  max: number | bigint | null | undefined
): string | null {
  const lo = toNumber(min)
  const hi = toNumber(max)
  if (lo === null && hi === null) return null

  const toShort = (n: number) => {
    if (n >= 1_000_000_000) {
      const v = n / 1_000_000_000
      return `${Number.isInteger(v) ? v : v.toFixed(1)} M`
    }
    if (n >= 1_000_000) {
      const v = n / 1_000_000
      return `${Number.isInteger(v) ? v : v.toFixed(1)} Jt`
    }
    if (n >= 1_000) {
      const v = n / 1_000
      return `${Number.isInteger(v) ? v : v.toFixed(1)} Rb`
    }
    return `${n}`
  }

  if (lo !== null && hi !== null) {
    if (lo >= 1_000_000 && hi >= 1_000_000) {
      const loV = lo / 1_000_000
      const hiV = hi / 1_000_000
      const loStr = Number.isInteger(loV) ? `${loV}` : loV.toFixed(1)
      const hiStr = Number.isInteger(hiV) ? `${hiV}` : hiV.toFixed(1)
      return `Rp ${loStr}-${hiStr} Jt`
    }
    return `Rp ${toShort(lo)} - ${toShort(hi)}`
  }
  const single = (lo ?? hi) as number
  return `Rp ${toShort(single)}`
}

function relativeTimeId(date: Date | string | null | undefined): string {
  if (!date) return 'Baru saja'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return 'Baru saja'

  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const week = Math.floor(day / 7)
  const month = Math.floor(day / 30)

  if (sec < 60) return 'Baru saja'
  if (min < 60) return `${min} menit lalu`
  if (hr < 24) return `${hr} jam lalu`
  if (day < 7) return `${day} hari lalu`
  if (week < 4) return `${week} minggu lalu`
  if (month < 12) return `${month} bulan lalu`
  return `${Math.floor(day / 365)} tahun lalu`
}

function avatarUrl(name: string | null | undefined): string {
  const display = (name && name.trim()) || 'RPI'
  return `https://ui-avatars.com/api/?background=0A2540&color=C9A961&bold=true&name=${encodeURIComponent(
    display
  )}`
}

export function JobsCarousel({ jobs, className }: JobsCarouselProps) {
  const data = jobs && jobs.length > 0 ? jobs : PLACEHOLDER_JOBS
  const scrollerRef = React.useRef<HTMLDivElement | null>(null)

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className={cn('bg-background py-16 md:py-24', className)}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              Lowongan Pilihan
            </span>
            <h2 className="font-heading mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Lowongan Terbaru untuk Kamu
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Temukan peluang karir terbaik dari perusahaan ternama di Indonesia,
              dikurasi khusus sesuai keahlian dan minat kamu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-secondary"
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Sebelumnya"
                onClick={() => scrollBy(-360)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-secondary hover:text-secondary hover:shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={() => scrollBy(360)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-secondary hover:text-secondary hover:shadow-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [&::-webkit-scrollbar]:hidden"
        >
          {data.map((job, i) => {
            const gradient = GRADIENTS[i % GRADIENTS.length]
            const tenantName = job.tenant?.name ?? 'RPI'
            const href = `/jobs/${job.slug || job.id}`
            const salary = formatRupiahRange(job.salaryMin, job.salaryMax)

            return (
              <motion.article
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                className="group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:w-[340px]"
              >
                {/* Top gradient strip */}
                <div
                  className={cn(
                    'relative h-24 bg-gradient-to-br transition-all duration-300 group-hover:brightness-110',
                    gradient
                  )}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                  <div className="absolute right-4 top-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
                      <Building2 className="h-3 w-3" />
                      {job.locationType || 'On-site'}
                    </span>
                  </div>
                </div>

                {/* Logo */}
                <div className="relative -mt-7 ml-5 h-14 w-14 overflow-hidden rounded-xl border-4 border-card bg-card shadow-md">
                  <Image
                    src={avatarUrl(tenantName)}
                    alt={tenantName}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Body */}
                <div className="p-5 pt-2">
                  {job.category?.name ? (
                    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {job.category.name}
                    </span>
                  ) : null}

                  <h3 className="font-heading mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground">
                    {job.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="truncate">{tenantName}</span>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-secondary" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {job.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    ) : null}
                    {job.employmentType ? (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.employmentType}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {relativeTimeId(job.publishedAt)}
                    </span>
                  </div>

                  {salary ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-md bg-secondary/15 px-2.5 py-1 text-sm font-medium text-secondary">
                        {salary}
                      </span>
                    </div>
                  ) : null}

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <button
                      type="button"
                      aria-label="Simpan lowongan"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <Link
                      href={href}
                      className="group/link inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-secondary"
                    >
                      Lihat Detail
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default JobsCarousel
