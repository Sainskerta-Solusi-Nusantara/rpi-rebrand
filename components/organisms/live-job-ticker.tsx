'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Radio, MapPin, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LiveJobTickerEntry {
  id: string
  title: string
  slug?: string | null
  location?: string | null
  tenant?: { name?: string | null } | null
  publishedAt?: Date | string | null
}

export interface LiveJobTickerProps {
  jobs?: LiveJobTickerEntry[]
  className?: string
}

const FALLBACK_JOBS: Array<{
  id: string
  title: string
  slug: string
  location: string
  tenant: { name: string }
  minutesAgo: number
}> = [
  { id: 'lj-1', title: 'Senior Software Engineer', slug: 'senior-software-engineer-telkom', location: 'Jakarta', tenant: { name: 'Telkom Indonesia' }, minutesAgo: 2 },
  { id: 'lj-2', title: 'Risk Analyst', slug: 'risk-analyst-bca', location: 'Jakarta', tenant: { name: 'Bank BCA' }, minutesAgo: 5 },
  { id: 'lj-3', title: 'Product Designer', slug: 'product-designer-tokopedia', location: 'Bandung', tenant: { name: 'Tokopedia' }, minutesAgo: 8 },
  { id: 'lj-4', title: 'Data Engineer', slug: 'data-engineer-pertamina', location: 'Surabaya', tenant: { name: 'Pertamina' }, minutesAgo: 12 },
  { id: 'lj-5', title: 'DevOps Lead', slug: 'devops-lead-astra', location: 'Bekasi', tenant: { name: 'Astra International' }, minutesAgo: 15 },
  { id: 'lj-6', title: 'Customer Success Manager', slug: 'customer-success-goto', location: 'Jakarta', tenant: { name: 'GoTo' }, minutesAgo: 20 },
  { id: 'lj-7', title: 'Brand Manager', slug: 'brand-manager-unilever', location: 'Jakarta', tenant: { name: 'Unilever' }, minutesAgo: 25 },
  { id: 'lj-8', title: 'Backend Developer', slug: 'backend-developer-mandiri', location: 'Jakarta', tenant: { name: 'Mandiri' }, minutesAgo: 30 },
  { id: 'lj-9', title: 'Quality Engineer', slug: 'quality-engineer-indofood', location: 'Tangerang', tenant: { name: 'Indofood' }, minutesAgo: 35 },
  { id: 'lj-10', title: 'Marketing Lead', slug: 'marketing-lead-shopee', location: 'Jakarta', tenant: { name: 'Shopee' }, minutesAgo: 42 },
]

function formatRelativeIndonesian(input?: Date | string | null, fallbackMinutes?: number): string {
  if (typeof fallbackMinutes === 'number' && !input) {
    if (fallbackMinutes < 1) return 'baru saja'
    if (fallbackMinutes < 60) return `${fallbackMinutes} menit lalu`
    const h = Math.floor(fallbackMinutes / 60)
    if (h < 24) return `${h} jam lalu`
    const d = Math.floor(h / 24)
    return `${d} hari lalu`
  }
  if (!input) return 'baru saja'
  const date = typeof input === 'string' ? new Date(input) : input
  const diffMs = Date.now() - date.getTime()
  const mins = Math.max(0, Math.floor(diffMs / 60000))
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

interface NormalizedEntry {
  id: string
  title: string
  slug: string | null
  location: string | null
  companyName: string
  relativeTime: string
}

export function LiveJobTicker({ jobs, className }: LiveJobTickerProps) {
  const [paused, setPaused] = React.useState(false)

  const normalized: NormalizedEntry[] = React.useMemo(() => {
    if (jobs && jobs.length > 0) {
      return jobs.map((j) => ({
        id: j.id,
        title: j.title,
        slug: j.slug ?? null,
        location: j.location ?? null,
        companyName: j.tenant?.name ?? 'Perusahaan Terverifikasi',
        relativeTime: formatRelativeIndonesian(j.publishedAt ?? null),
      }))
    }
    return FALLBACK_JOBS.map((f) => ({
      id: f.id,
      title: f.title,
      slug: f.slug,
      location: f.location,
      companyName: f.tenant.name,
      relativeTime: formatRelativeIndonesian(null, f.minutesAgo),
    }))
  }, [jobs])

  const renderEntries = (keyPrefix: string) =>
    normalized.map((entry, idx) => {
      const inner = (
        <>
          <span className="h-1 w-1 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
          <span className="font-semibold text-foreground">{entry.companyName}</span>
          <span className="text-muted-foreground">menambahkan posisi</span>
          <span className="font-medium text-indigo-600 dark:text-indigo-300">{entry.title}</span>
          {entry.location ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {entry.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {entry.relativeTime}
          </span>
        </>
      )

      const className = 'inline-flex items-center gap-2 px-4 text-sm whitespace-nowrap transition-colors'

      return entry.slug ? (
        <Link
          key={`${keyPrefix}-${entry.id}-${idx}`}
          href={`/jobs/${entry.slug}`}
          className={cn(className, 'hover:text-indigo-700 dark:hover:text-indigo-200')}
        >
          {inner}
        </Link>
      ) : (
        <span key={`${keyPrefix}-${entry.id}-${idx}`} className={className}>
          {inner}
        </span>
      )
    })

  return (
    <div
      className={cn(
        'flex items-center gap-4 w-full rounded-full border border-border/60 bg-gradient-to-r from-card/95 via-card/90 to-card/95 px-4 py-2 shadow-lg shadow-indigo-950/5 backdrop-blur',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Lowongan terbaru sedang diposting"
    >
      {/* Live badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="rounded-full bg-red-500/15 text-red-600 dark:text-red-400 px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-2 shrink-0">
          <span className="relative inline-flex h-2 w-2 items-center justify-center" aria-hidden>
            <motion.span
              className="absolute h-2 w-2 rounded-full bg-red-500"
              animate={{ scale: [1, 1.9, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity }}
            />
            <span className="relative h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </span>
          <Radio className="h-3.5 w-3.5" aria-hidden />
          LIVE
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Update</span>
          <span className="text-[11px] font-medium text-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" aria-hidden />
            real-time
          </span>
        </div>
      </div>

      {/* Marquee track */}
      <div
        className="relative flex-1 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)',
        }}
      >
        <motion.div
          className="flex w-max items-center"
          animate={{ x: paused ? undefined : ['0%', '-50%'] }}
          transition={{
            duration: 30,
            ease: 'linear',
            repeat: Infinity,
          }}
          style={paused ? { animationPlayState: 'paused' } : undefined}
        >
          <div className="flex items-center">{renderEntries('a')}</div>
          <div className="flex items-center" aria-hidden>
            {renderEntries('b')}
          </div>
        </motion.div>

        {/* Edge fade overlays (fallback when mask not supported) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-card to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent"
          aria-hidden
        />
      </div>
    </div>
  )
}

export default LiveJobTicker
