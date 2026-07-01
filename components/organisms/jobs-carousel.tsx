'use client'

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

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

export interface JobsCategory {
  id: string
  name: string
  slug: string
  _count?: { jobs?: number }
}

export interface JobsCarouselProps {
  jobs?: JobItem[]
  categories?: JobsCategory[]
  className?: string
}

const PLACEHOLDER_JOBS: JobItem[] = [
  {
    id: 'p1',
    title: 'Senior Software Engineer',
    slug: 'senior-software-engineer',
    location: 'Jakarta',
    locationType: 'WFH',
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
    location: 'Remote',
    locationType: 'Remote',
    employmentType: 'Full-time',
    salaryMin: 12_000_000,
    salaryMax: 18_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    tenant: { name: 'GoTo', slug: 'goto' },
    category: { name: 'Desain', slug: 'desain' },
  },
  {
    id: 'p3',
    title: 'Product Manager',
    slug: 'product-manager',
    location: 'Jakarta',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 22_000_000,
    salaryMax: 30_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(),
    tenant: { name: 'Bibit', slug: 'bibit' },
    category: { name: 'Produk', slug: 'produk' },
  },
  {
    id: 'p4',
    title: 'Data Engineer',
    slug: 'data-engineer',
    location: 'Bandung',
    locationType: 'On-site',
    employmentType: 'Full-time',
    salaryMin: 15_000_000,
    salaryMax: 22_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    tenant: { name: 'Tokopedia', slug: 'tokopedia' },
    category: { name: 'Data', slug: 'data' },
  },
  {
    id: 'p5',
    title: 'Marketing Lead',
    slug: 'marketing-lead',
    location: 'Jakarta',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 14_000_000,
    salaryMax: 20_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    tenant: { name: 'BCA', slug: 'bca' },
    category: { name: 'Marketing', slug: 'marketing' },
  },
  {
    id: 'p6',
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    location: 'Bekasi',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 15_000_000,
    salaryMax: 22_000_000,
    salaryCurrency: 'IDR',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    tenant: { name: 'Astra', slug: 'astra' },
    category: { name: 'Teknologi', slug: 'teknologi' },
  },
]

const FALLBACK_CATEGORIES: JobsCategory[] = [
  { id: 'c-tech', name: 'Teknologi', slug: 'teknologi' },
  { id: 'c-mkt', name: 'Marketing', slug: 'marketing' },
  { id: 'c-sales', name: 'Sales', slug: 'sales' },
  { id: 'c-design', name: 'Desain', slug: 'desain' },
  { id: 'c-finance', name: 'Keuangan', slug: 'keuangan' },
  { id: 'c-hr', name: 'HR', slug: 'hr' },
  { id: 'c-ops', name: 'Operasional', slug: 'operasional' },
  { id: 'c-fresh', name: 'Fresh Graduate', slug: 'fresh-graduate' },
]

function toNumber(value: number | bigint | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'bigint') return Number(value)
  return value
}

function formatSalaryShort(
  min: number | bigint | null | undefined,
  max: number | bigint | null | undefined,
): string | null {
  const lo = toNumber(min)
  const hi = toNumber(max)
  if (lo === null && hi === null) return null

  const toJt = (n: number) => {
    const v = n / 1_000_000
    return Number.isInteger(v) ? `${v}` : v.toFixed(1)
  }

  if (lo !== null && hi !== null && lo >= 1_000_000 && hi >= 1_000_000) {
    return `Rp ${toJt(lo)}-${toJt(hi)} Jt`
  }
  const single = (lo ?? hi) as number
  return `Rp ${toJt(single)} Jt`
}

type CarouselStrings = {
  relativeNew: string
  relativeHours: string
  relativeDays: string
  relativeWeeks: string
}

function relativeTime(date: Date | string | null | undefined, strings: CarouselStrings): string {
  if (!date) return strings.relativeNew
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return strings.relativeNew

  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)

  if (min < 60) return strings.relativeNew
  if (hr < 24) return strings.relativeHours.replace('{hr}', String(hr))
  if (day < 7) return strings.relativeDays.replace('{day}', String(day))
  return strings.relativeWeeks.replace('{week}', String(Math.floor(day / 7)))
}

export function JobsCarousel({ jobs, categories, className }: JobsCarouselProps) {
  const { t } = useI18n()
  const tc = t.formsTables.jobsCarousel

  const data = jobs && jobs.length > 0 ? jobs : PLACEHOLDER_JOBS
  const cats =
    categories && categories.length > 0
      ? categories.slice(0, 8)
      : FALLBACK_CATEGORIES
  const scrollerRef = React.useRef<HTMLDivElement | null>(null)

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className={cn('bg-background py-16 md:py-20', className)}>
      <div className="container mx-auto w-full max-w-6xl px-6">
        {/* Eyebrow + heading + CTA */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {tc.eyebrow}
          </span>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {tc.heading}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-[color:var(--ring)]"
            >
              {tc.viewAll}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Sebelumnya"
                onClick={() => scrollBy(-360)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-[color:var(--ring)] hover:text-[color:var(--ring)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={() => scrollBy(360)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-[color:var(--ring)] hover:text-[color:var(--ring)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category chips strip */}
        <div className="mb-8 -mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max items-center gap-2">
            {cats.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/jobs?category=${c.slug}`}
                  className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-[color:var(--ring)] hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cards carousel */}
        <div
          ref={scrollerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [&::-webkit-scrollbar]:hidden"
        >
          {data.map((job, i) => {
            const tenantName = job.tenant?.name ?? 'RPI'
            const href = `/jobs/${job.slug || job.id}`
            const salary = formatSalaryShort(job.salaryMin, job.salaryMax)

            return (
              <motion.article
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: 'easeOut' }}
                className="card-lift group relative w-[300px] shrink-0 snap-start rounded-2xl border border-border bg-card p-5 hover:border-[color:var(--ring)] md:w-[320px]"
              >
                <Link
                  href={href as Route}
                  className="absolute inset-0 z-10"
                  aria-label={job.title}
                />

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:color-mix(in_oklab,var(--ring)_14%,transparent)] px-2.5 py-1 text-xs font-medium text-[color:var(--ring)]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                  {job.category?.name ? (
                    <span className="text-xs text-muted-foreground">{job.category.name}</span>
                  ) : null}
                </div>

                <h3 className="font-heading mt-4 line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                  {job.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{tenantName}</p>

                <dl className="mt-4 space-y-1.5 text-sm">
                  {job.location ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      <span>
                        {job.location}
                        {job.locationType ? ` · ${job.locationType}` : ''}
                      </span>
                    </div>
                  ) : null}
                  {job.employmentType ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" aria-hidden />
                      <span>{job.employmentType}</span>
                    </div>
                  ) : null}
                </dl>

                {salary ? (
                  <p className="font-heading mt-4 text-lg font-semibold text-[color:var(--ring)]">
                    {salary}
                  </p>
                ) : null}

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {relativeTime(job.publishedAt, tc)}
                  </span>
                  <span className="relative z-20 inline-flex items-center gap-1 font-medium text-foreground transition-colors group-hover:text-[color:var(--ring)]">
                    {tc.viewDetail}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
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
