'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  Code,
  Compass,
  Globe2,
  GraduationCap,
  HandshakeIcon,
  Heart,
  HeartHandshake,
  Laptop,
  LifeBuoy,
  Lightbulb,
  MapPin,
  Megaphone,
  MessageCircle,
  PartyPopper,
  PenTool,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import CareersHeaderChips from '@/components/molecules/careers-header-chips'
import CareersSortPills from '@/components/molecules/careers-sort-pills'
import { cn } from '@/lib/utils'
import { CAREER_OPENINGS as OPENINGS } from '@/lib/careers-data'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export type CareersHeroProps = {
  /** Total number of currently open positions. */
  openingCount: number
}

export function CareersHero({ openingCount }: CareersHeroProps) {
  const { t } = useI18n()
  const tc = t.formsPublicSections.careers

  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="careers-hero-heading"
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

      <div className="container mx-auto w-full max-w-5xl px-6 py-20 md:py-28 lg:py-32">
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
          id="careers-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Bangun masa depan{' '}
          <span className="text-[color:var(--ring)]">{tc.hero.headingHighlight}</span>{' '}
          di Indonesia.
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
            <Link href="#openings">
              {tc.hero.ctaOpenings}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#life">
              {tc.hero.ctaLife}
            </Link>
          </Button>
        </motion.div>

        <motion.dl
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {[
            { v: '120+', l: tc.hero.statTeam },
            { v: '6', l: tc.hero.statCities },
            { v: String(openingCount), l: tc.hero.statOpenings },
            { v: '4.8/5', l: tc.hero.statScore },
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
// Why RPI
// ---------------------------------------------------------------------------

export function CareersWhy() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.careers

  const WHY = [
    {
      icon: Target,
      title: tc.why.impactTitle,
      desc: tc.why.impactDesc,
    },
    {
      icon: Rocket,
      title: tc.why.growTitle,
      desc: tc.why.growDesc,
    },
    {
      icon: Users,
      title: tc.why.teamTitle,
      desc: tc.why.teamDesc,
    },
    {
      icon: Heart,
      title: tc.why.missionTitle,
      desc: tc.why.missionDesc,
    },
  ]

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="careers-why-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.why.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-why-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.why.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.why.body}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => {
            const Icon = w.icon
            return (
              <motion.div
                key={w.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
              >
                <span
                  aria-hidden
                  className="mb-4 grid size-11 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-foreground text-lg font-semibold">
                  {w.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {w.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Life at RPI — Benefits & Culture
// ---------------------------------------------------------------------------

export function CareersLife() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.careers

  const BENEFITS = [
    { icon: Globe2,         title: tc.life.benefitRemoteTitle,   desc: tc.life.benefitRemoteDesc },
    { icon: HeartHandshake, title: tc.life.benefitHealthTitle,   desc: tc.life.benefitHealthDesc },
    { icon: GraduationCap,  title: tc.life.benefitLearnTitle,    desc: tc.life.benefitLearnDesc },
    { icon: CalendarCheck,  title: tc.life.benefitLeaveTitle,    desc: tc.life.benefitLeaveDesc },
    { icon: Award,          title: tc.life.benefitEquityTitle,   desc: tc.life.benefitEquityDesc },
    { icon: Laptop,         title: tc.life.benefitSetupTitle,    desc: tc.life.benefitSetupDesc },
    { icon: LifeBuoy,       title: tc.life.benefitParentalTitle, desc: tc.life.benefitParentalDesc },
    { icon: PartyPopper,    title: tc.life.benefitOffsiteTitle,  desc: tc.life.benefitOffsiteDesc },
  ]

  const CULTURE = [
    {
      icon: Lightbulb,
      title: tc.life.cultureShowTitle,
      desc: tc.life.cultureShowDesc,
    },
    {
      icon: ShieldCheck,
      title: tc.life.cultureDiscussTitle,
      desc: tc.life.cultureDiscussDesc,
    },
    {
      icon: Sparkles,
      title: tc.life.cultureFirstTitle,
      desc: tc.life.cultureFirstDesc,
    },
  ]

  return (
    <section
      id="life"
      className="bg-background py-20 md:py-24"
      aria-labelledby="careers-life-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.life.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-life-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.life.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.life.body}
          </p>
        </motion.div>

        {/* Culture pillars */}
        <div className="grid gap-6 lg:grid-cols-3">
          {CULTURE.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border relative overflow-hidden rounded-2xl border p-7"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, color-mix(in oklab, var(--ring) 70%, transparent), transparent)',
                  }}
                />
                <Icon className="text-[color:var(--ring)] mb-4 h-6 w-6" aria-hidden />
                <h3 className="font-heading text-foreground text-lg font-semibold">
                  {c.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {c.desc}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Benefits grid */}
        <div className="mt-16">
          <h3 className="font-heading text-foreground mb-6 text-center text-xl font-semibold">
            {tc.life.benefitsHeading}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: 0.03 * i }}
                  className="border-border bg-card rounded-xl border p-5"
                >
                  <Icon className="text-[color:var(--ring)] h-5 w-5" aria-hidden />
                  <div className="font-heading text-foreground mt-3 text-sm font-semibold">
                    {b.title}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {b.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

const TEAMS = [
  { icon: Code,         name: 'Engineering', size: 38, color: '#635BFF' },
  { icon: PenTool,      name: 'Design',      size: 8,  color: '#EC4899' },
  { icon: Compass,      name: 'Product',     size: 9,  color: '#0EA5E9' },
  { icon: Megaphone,    name: 'Marketing',   size: 12, color: '#F59E0B' },
  { icon: HandshakeIcon,name: 'Partnership', size: 14, color: '#10B981' },
  { icon: LifeBuoy,     name: 'Support',     size: 18, color: '#EF4444' },
  { icon: BookOpen,     name: 'Academy',     size: 10, color: '#8B5CF6' },
  { icon: TrendingUp,   name: 'Operations',  size: 11, color: '#06B6D4' },
]

export type CareersTeamsProps = {
  /** Map of team name to { open opening count, prebuilt filter href }. */
  openings: Record<string, { count: number; href: string }>
}

export function CareersTeams({ openings }: CareersTeamsProps) {
  const { t } = useI18n()
  const tc = t.formsPublicSections.careers

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="careers-teams-heading"
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
              {tc.teams.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-teams-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.teams.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.teams.body}
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEAMS.map((team, i) => {
            const Icon = team.icon
            const teamOpenings = openings[team.name]
            const openCount = teamOpenings?.count ?? 0
            return (
              <motion.div
                key={team.name}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
                className="border-border bg-card hover:border-[color:var(--ring)] flex items-center gap-4 rounded-xl border p-5 transition"
              >
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklab, ${team.color} 12%, transparent)`,
                    color: team.color,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-foreground text-sm font-semibold">
                    {team.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {tc.teams.memberCount.replace('{size}', String(team.size))}
                  </div>
                  {openCount > 0 && teamOpenings && (
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={teamOpenings.href as any}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition"
                      style={{ color: team.color }}
                    >
                      {tc.teams.openCount.replace('{count}', String(openCount))}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Open Positions
// ---------------------------------------------------------------------------

import type { CareerOpening } from '@/lib/careers-data'

export type CareersOpeningsProps = {
  openings: CareerOpening[]
  totalCount: number
  activeTeam?: string
  activeTypes: CareerOpening['type'][]
  activeLevels: CareerOpening['level'][]
  activeLocation?: string
  activeQuery?: string
  activeSort: string
  teams: { name: string; count: number; href: string }[]
  types: { value: CareerOpening['type']; count: number; href: string }[]
  levels: { value: CareerOpening['level']; count: number; href: string }[]
  locations: { name: string; slug: string; count: number; href: string }[]
  sortOptions: { value: string; label: string; href: string; active: boolean }[]
  headerChips: { label: string; clearHref: string }[]
  /** Special href for the "Semua" team chip (clears team filter). */
  allTeamsHref: string
  /** Special href for the "Semua" location chip (clears location filter). */
  allLocationsHref: string
  /** Href that clears every filter, jumping back to /careers#openings. */
  clearAllHref: string
  hasAnyFilter: boolean
}

export function CareersOpenings(props: CareersOpeningsProps) {
  const { t } = useI18n()
  const tc = t.formsPublicSections.careers

  const {
    openings,
    totalCount,
    activeTeam,
    activeTypes,
    activeLevels,
    activeLocation,
    activeQuery,
    activeSort,
    teams,
    types,
    levels,
    locations,
    sortOptions,
    headerChips,
    allTeamsHref,
    allLocationsHref,
    clearAllHref,
    hasAnyFilter,
  } = props
  const filteredCount = openings.length

  return (
    <section
      id="openings"
      className="bg-background py-20 md:py-24"
      aria-labelledby="careers-openings-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.openings.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-openings-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {hasAnyFilter
              ? tc.openings.headingFiltered
                  .replace('{filtered}', String(filteredCount))
                  .replace('{total}', String(totalCount))
              : tc.openings.headingAll.replace('{total}', String(totalCount))}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.openings.body}
          </p>
        </motion.div>

        {/* Search form */}
        <form
          method="get"
          action="/careers"
          className="mx-auto mb-6 max-w-xl"
        >
          <div className="border-border bg-card focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition">
            <Briefcase className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery ?? ''}
              placeholder={tc.openings.searchPlaceholder}
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label={tc.openings.searchLabel}
            />
            <button
              type="submit"
              className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
            >
              {tc.openings.searchBtn}
            </button>
          </div>
          {/* Preserve filters on submit */}
          {activeTeam && <input type="hidden" name="team" value={activeTeam} />}
          {activeTypes.length > 0 && (
            <input type="hidden" name="type" value={activeTypes.join(',')} />
          )}
          {activeLevels.length > 0 && (
            <input type="hidden" name="level" value={activeLevels.join(',')} />
          )}
          {activeLocation && (
            <input type="hidden" name="location" value={activeLocation} />
          )}
          {activeSort !== 'newest' && (
            <input type="hidden" name="sort" value={activeSort} />
          )}
        </form>

        {/* Active filter chip strip */}
        <div className="mx-auto mb-4 max-w-3xl">
          <div className="flex justify-center">
            <CareersHeaderChips chips={headerChips} clearAllHref={clearAllHref} />
          </div>
        </div>

        {/* Team chips */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={allTeamsHref as any}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              !activeTeam
                ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
            aria-current={!activeTeam ? 'true' : undefined}
          >
            {tc.openings.allTeams}
          </Link>
          {teams.map((team) => {
            const active = activeTeam === team.name
            return (
              <Link
                key={team.name}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={team.href as any}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
                aria-current={active ? 'true' : undefined}
              >
                {team.name}
                <span className={active ? 'ml-1.5 opacity-80' : 'ml-1.5 opacity-60'}>
                  {team.count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Location chips */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={allLocationsHref as any}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              !activeLocation
                ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
            aria-current={!activeLocation ? 'true' : undefined}
          >
            {tc.openings.allLocations}
          </Link>
          {locations.map((loc) => {
            const active = activeLocation === loc.name
            return (
              <Link
                key={loc.slug}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={loc.href as any}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
                aria-current={active ? 'true' : undefined}
              >
                <MapPin className="mr-1 inline h-3 w-3" aria-hidden />
                {loc.name}
                <span className={active ? 'ml-1.5 opacity-80' : 'ml-1.5 opacity-60'}>
                  {loc.count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Type + Level chips */}
        <div className="mx-auto mb-6 grid max-w-3xl gap-3 sm:grid-cols-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-[10px] font-medium uppercase tracking-wider">
              {tc.openings.typeLabel}
            </span>
            {types.map((type) => {
              const active = activeTypes.includes(type.value)
              return (
                <Link
                  key={type.value}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={type.href as any}
                  className={
                    active
                      ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] rounded-full border px-2.5 py-1 text-[11px] font-medium transition'
                      : 'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] rounded-full border px-2.5 py-1 text-[11px] transition'
                  }
                  aria-current={active ? 'true' : undefined}
                >
                  {type.value}
                  <span className="ml-1 opacity-60">{type.count}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-[10px] font-medium uppercase tracking-wider">
              {tc.openings.levelLabel}
            </span>
            {levels.map((level) => {
              const active = activeLevels.includes(level.value)
              return (
                <Link
                  key={level.value}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={level.href as any}
                  className={
                    active
                      ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] rounded-full border px-2.5 py-1 text-[11px] font-medium transition'
                      : 'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] rounded-full border px-2.5 py-1 text-[11px] transition'
                  }
                  aria-current={active ? 'true' : undefined}
                >
                  {level.value}
                  <span className="ml-1 opacity-60">{level.count}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Sort pills */}
        <div className="mb-6 flex justify-center">
          <CareersSortPills options={sortOptions} />
        </div>

        {openings.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border p-10 text-center">
            <h3 className="font-heading text-foreground text-base font-semibold">
              {tc.openings.emptyHeading}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {tc.openings.emptyBody}
            </p>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={clearAllHref as any}
              className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
            >
              {tc.openings.clearFilter}
            </Link>
          </div>
        ) : (
          <ul className="border-border divide-border bg-card divide-y overflow-hidden rounded-2xl border">
            {openings.map((o) => (
              <li key={o.title}>
                <Link
                  href={`/careers/${o.slug}`}
                  className="group hover:bg-muted/40 flex flex-col gap-3 px-5 py-5 transition sm:flex-row sm:items-center sm:justify-between sm:px-7"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition sm:text-lg">
                        {o.title}
                      </h3>
                      <Badge variant="secondary" size="sm">
                        {o.level}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" aria-hidden />
                        {o.team}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {o.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" aria-hidden />
                        {o.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-foreground/80 group-hover:text-[color:var(--ring)] inline-flex shrink-0 items-center gap-1 text-sm font-medium transition">
                    {tc.openings.viewDetail}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="border-border bg-muted/20 mt-8 rounded-2xl border p-7 text-center">
          <h3 className="font-heading text-foreground text-lg font-semibold">
            {tc.openings.cta.heading}
          </h3>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
            {tc.openings.cta.body}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <a href="mailto:careers@rumahpekerja.id">
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              careers@rumahpekerja.id
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Hiring Process
// ---------------------------------------------------------------------------

export function CareersProcess() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.careers

  const STEPS = [
    {
      icon: ClipboardList,
      title: tc.process.step1Title,
      duration: tc.process.step1Duration,
      desc: tc.process.step1Desc,
    },
    {
      icon: MessageCircle,
      title: tc.process.step2Title,
      duration: tc.process.step2Duration,
      desc: tc.process.step2Desc,
    },
    {
      icon: Code,
      title: tc.process.step3Title,
      duration: tc.process.step3Duration,
      desc: tc.process.step3Desc,
    },
    {
      icon: Users,
      title: tc.process.step4Title,
      duration: tc.process.step4Duration,
      desc: tc.process.step4Desc,
    },
    {
      icon: HandshakeIcon,
      title: tc.process.step5Title,
      duration: tc.process.step5Duration,
      desc: tc.process.step5Desc,
    },
  ]

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="careers-process-heading"
    >
      <div className="container mx-auto w-full max-w-5xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tc.process.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-process-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.process.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.process.body}
          </p>
        </motion.div>

        <ol className="relative space-y-6">
          <span
            aria-hidden
            className="bg-border absolute left-[22px] top-2 bottom-2 w-px"
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.li
                key={s.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="relative flex gap-5"
              >
                <span
                  aria-hidden
                  className="bg-background border-[color:var(--ring)] text-[color:var(--ring)] relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="border-border bg-card flex-1 rounded-xl border p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {i + 1}. {s.title}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      ⏱ {s.duration}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
