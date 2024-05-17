'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, GraduationCap, Search, MapPin, Sparkles, BadgeCheck, Building2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { cn } from '@/lib/utils'

const HERO_IMG =
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80'

const STATS_DEFAULT = { jobs: '12K+', partners: '850+', talents: '240K' }

const TRUSTED_LOGOS = ['Telkom', 'Pertamina', 'BCA', 'Tokopedia', 'GoTo', 'Astra']

export interface HeroBannerProps {
  stats?: { jobs: string | number; partners: string | number; talents: string | number }
  className?: string
}

export function HeroBanner({ stats = STATS_DEFAULT, className }: HeroBannerProps) {
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
        'relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary to-[#061a30] text-primary-foreground',
        className,
      )}
    >
      {/* Background image with overlay */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={HERO_IMG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-[#061a30]/95" />
      </div>

      {/* Decorative radial accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 15%, color-mix(in oklab, var(--secondary) 60%, transparent) 0, transparent 35%), radial-gradient(circle at 85% 85%, color-mix(in oklab, var(--accent) 60%, transparent) 0, transparent 40%)',
        }}
      />

      {/* Floating shapes */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="pointer-events-none absolute right-[6%] top-[18%] -z-0 hidden h-24 w-24 rounded-2xl border border-secondary/30 bg-secondary/10 backdrop-blur md:block"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="pointer-events-none absolute left-[8%] bottom-[12%] -z-0 hidden h-16 w-16 rounded-full border border-accent/30 bg-accent/10 backdrop-blur md:block"
      />

      <div className="container relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:py-28 lg:py-32">
        {/* LEFT — copy + search + stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col justify-center"
        >
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t.hero.eyebrow}
          </span>

          <h1 className="font-heading text-4xl leading-[1.1] text-balance md:text-5xl lg:text-6xl">
            {t.hero.headline}{' '}
            <span className="bg-gradient-to-r from-secondary via-[#e8d18a] to-secondary bg-clip-text italic text-transparent">
              {t.hero.headlineAccent}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-primary-foreground/85 md:text-lg">
            {t.hero.body}
          </p>

          {/* Search bar */}
          <form
            onSubmit={onSearch}
            className="mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-primary-foreground/15 bg-background/95 p-2 shadow-2xl backdrop-blur md:flex-row md:items-center md:gap-0"
          >
            <div className="flex flex-1 items-center gap-2 px-3 text-foreground">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                aria-label={t.hero.searchPlaceholder}
                className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="flex flex-1 items-center gap-2 px-3 text-foreground md:max-w-[12rem]">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder={t.hero.locationPlaceholder}
                aria-label={t.hero.locationPlaceholder}
                className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <Button type="submit" size="lg" variant="secondary" className="md:rounded-xl">
              <Search className="h-4 w-4" />
              {t.hero.searchCta}
            </Button>
          </form>

          {/* CTAs (extra entry points) */}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-primary-foreground/80">
            <Button asChild size="md" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/jobs">
                {t.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="md"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/courses">
                <GraduationCap className="h-4 w-4" />
                {t.hero.ctaSecondary}
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">
                {t.hero.stats.jobs}
              </dt>
              <dd className="font-heading text-2xl text-secondary md:text-3xl">
                {String(stats.jobs)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">
                {t.hero.stats.partners}
              </dt>
              <dd className="font-heading text-2xl text-secondary md:text-3xl">
                {String(stats.partners)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">
                {t.hero.stats.talents}
              </dt>
              <dd className="font-heading text-2xl text-secondary md:text-3xl">
                {String(stats.talents)}
              </dd>
            </div>
          </dl>
        </motion.div>

        {/* RIGHT — illustrative collage */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="relative hidden items-center justify-center md:flex"
        >
          <div className="relative aspect-[4/5] w-full max-w-md">
            {/* Main portrait */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl border border-primary-foreground/15 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"
                alt="Profesional Indonesia"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
            </div>

            {/* Floating card 1 — Verified job */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -left-4 top-8 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 text-card-foreground shadow-xl backdrop-blur md:-left-10"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-secondary">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Senior Developer</div>
                <div className="text-sm font-semibold">Rp 18–25 Jt</div>
              </div>
            </motion.div>

            {/* Floating card 2 — Partner */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -right-4 bottom-12 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 text-card-foreground shadow-xl backdrop-blur md:-right-10"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Mitra Terverifikasi</div>
                <div className="text-sm font-semibold">850+ Perusahaan</div>
              </div>
            </motion.div>

            {/* Gold accent ring */}
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-3xl border border-secondary/30"
            />
          </div>
        </motion.div>
      </div>

      {/* Trusted-by row */}
      <div className="relative border-t border-primary-foreground/10 bg-primary/40 backdrop-blur-sm">
        <div className="container mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-6 py-6 md:flex-row md:justify-between">
          <span className="text-xs uppercase tracking-wider text-primary-foreground/60">
            {t.hero.trustedBy}
          </span>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-primary-foreground/70">
            {TRUSTED_LOGOS.map((logo) => (
              <li key={logo} className="font-heading tracking-wide">
                {logo}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default HeroBanner
