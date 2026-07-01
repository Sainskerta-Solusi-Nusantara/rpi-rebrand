'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { AnimatedCounter } from '@/components/atoms/animated-counter'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { cn } from '@/lib/utils'

const TRUSTED_LOGOS = ['Telkom', 'Pertamina', 'BCA', 'Astra', 'GoTo', 'Tokopedia']

const FALLBACK_STATS = {
  talents: 240000,
  jobs: 12000,
  partners: 850,
  courses: 500,
}

export interface HeroBannerProps {
  stats?: {
    talents: number
    jobs: number
    partners: number
    courses: number
  }
  className?: string
}

export function HeroBanner({ stats = FALLBACK_STATS, className }: HeroBannerProps) {
  const { t } = useI18n()
  const [q, setQ] = React.useState('')
  const [loc, setLoc] = React.useState('')

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (loc) params.set('location', loc)
    window.location.href = `/jobs${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-background text-foreground',
        className,
      )}
    >
      {/* Horizontal grid lines — adapts to mode via var(--border) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)',
          backgroundSize: '100% 96px',
        }}
      />
      {/* Drifting aurora wash — gold (bottom-right) + purple accent (top-left) */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-50"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 70% 55% at 90% 100%, color-mix(in oklab, var(--ring) 18%, transparent), transparent 60%)',
            'radial-gradient(ellipse 55% 45% at 10% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 60%)',
          ].join(', '),
        }}
      />
      {/* Floating orbs — soft depth, one gold one purple */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float absolute -right-24 top-1/3 h-[26rem] w-[26rem] rounded-full bg-[color:var(--ring)] opacity-[0.12] blur-3xl dark:opacity-25" />
        <div className="animate-float absolute -left-28 -top-20 h-[24rem] w-[24rem] rounded-full bg-[color:var(--accent)] opacity-[0.09] blur-3xl [animation-delay:-3.5s] dark:opacity-20" />
      </div>

      <div className="container relative mx-auto w-full max-w-6xl px-6 py-10 md:py-14 lg:py-16">
        {/* 1. STATS strip — protagonist */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8 border-b border-border/60 pb-8 md:mb-10 md:pb-10"
        >
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.hero.eyebrow}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 md:gap-x-12">
            <Stat label={t.hero.stats.talents} value={stats.talents} />
            <Stat label={t.hero.stats.jobs} value={stats.jobs} />
            <Stat label={t.hero.stats.partners} value={stats.partners} />
            <Stat label={t.hero.stats.courses} value={stats.courses} />
          </dl>
        </motion.div>

        {/* 2. HEADLINE block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl lg:text-6xl">
            {t.hero.headlineLine1}
            <br />
            <span className="text-gradient-gold">{t.hero.headlineLine2}</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground text-pretty md:text-lg">
            {t.hero.body}
          </p>

          {/* Search form */}
          <form
            onSubmit={onSearch}
            className="mt-6 flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-[0_8px_32px_-12px_color-mix(in_oklab,var(--foreground)_14%,transparent)] dark:shadow-[0_10px_32px_-10px_color-mix(in_oklab,var(--background)_85%,transparent),0_0_0_1px_color-mix(in_oklab,var(--ring)_10%,transparent)] md:flex-row md:items-center md:gap-0"
          >
            <div className="flex flex-1 items-center gap-2 px-3 text-foreground">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                aria-label={t.hero.searchPlaceholder}
                className="h-12 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <div aria-hidden className="hidden h-8 w-px bg-border md:block" />
            <div className="flex flex-1 items-center gap-2 px-3 text-foreground md:max-w-[14rem]">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder={t.hero.locationPlaceholder}
                aria-label={t.hero.locationPlaceholder}
                className="h-12 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <Button type="submit" size="lg" variant="default" className="md:rounded-xl">
              <Search className="h-4 w-4" />
              {t.hero.searchCta}
            </Button>
          </form>

          {/* Secondary CTAs */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <Link
              href="/jobs"
              className="group inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-[color:var(--ring)]"
            >
              {t.hero.ctaPrimary}
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <span aria-hidden className="h-4 w-px bg-border" />
            <Link
              href="/mitra"
              className="group inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-[color:var(--ring)]"
            >
              <Building2 aria-hidden className="h-4 w-4" />
              {t.hero.ctaSecondary}
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </motion.div>

        {/* 3. TRUSTED-BY */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 border-t border-border/60 pt-6 md:mt-12 md:pt-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.hero.trustedBy}
            </span>
            <span aria-hidden className="h-px flex-1 bg-border/60" />
          </div>
          {/* Seamless marquee: two identical tracks each translating -100% of
              their own width. Pauses on hover. */}
          <div className="group mask-fade-x relative flex overflow-hidden">
            {[0, 1].map((track) => (
              <ul
                key={track}
                aria-hidden={track === 1}
                className="marquee flex w-max shrink-0 items-center gap-x-10 pr-10 group-hover:[animation-play-state:paused]"
              >
                {TRUSTED_LOGOS.map((logo) => (
                  <li
                    key={logo}
                    className="font-heading whitespace-nowrap text-base font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground md:text-lg"
                  >
                    {logo}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-heading text-4xl font-semibold tracking-tight tabular-nums text-foreground md:text-5xl lg:text-6xl">
        <AnimatedCounter value={value} duration={1.6} />
      </dd>
      <dt className="mt-2 text-sm text-muted-foreground md:text-base">{label}</dt>
    </div>
  )
}

export default HeroBanner
