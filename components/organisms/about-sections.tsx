'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Building2,
  Compass,
  Eye,
  Heart,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { AnimatedCounter } from '@/components/atoms/animated-counter'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function AboutHero() {
  const { t } = useI18n()
  const s = t.formsMarketing2.about.hero
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="about-hero-heading"
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
            {s.eyebrow}
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="about-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {s.heading}{' '}
          <span className="text-[color:var(--ring)]">{s.headingHighlight}</span>.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-center text-base text-muted-foreground md:text-lg"
        >
          {s.body}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="/register">
              {s.ctaWorker}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/mitra">
              <Building2 className="h-4 w-4" aria-hidden />
              {s.ctaMitra}
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Mission
// ---------------------------------------------------------------------------

export function AboutMission() {
  const { t } = useI18n()
  const s = t.formsMarketing2.about.mission
  const tags = [s.tag1, s.tag2, s.tag3, s.tag4]
  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="about-mission-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {s.eyebrow}
              </span>
            </div>
            <motion.h2
              id="about-mission-heading"
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="font-heading text-balance text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
            >
              {s.heading}
            </motion.h2>
          </div>

          <div className="md:col-span-7 md:pt-2">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              <p>
                {s.body1Start}{' '}
                <span className="text-foreground">{s.body1Terlihat}</span>{s.body1Comma1}{' '}
                <span className="text-foreground">{s.body1Terampil}</span>{s.body1Comma2}{' '}
                <span className="text-foreground">{s.body1Sejahtera}</span>{s.body1End}
              </p>
              <p>
                {s.body2}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Journey (placeholder milestones)
// ---------------------------------------------------------------------------

interface Milestone {
  year: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export function AboutJourney() {
  const { t } = useI18n()
  const s = t.formsMarketing2.about.journey

  const MILESTONES: Milestone[] = [
    {
      year: '2023',
      title: s.milestone1Title,
      description: s.milestone1Desc,
      icon: Sparkles,
    },
    {
      year: '2024',
      title: s.milestone2Title,
      description: s.milestone2Desc,
      icon: Rocket,
    },
    {
      year: '2025',
      title: s.milestone3Title,
      description: s.milestone3Desc,
      icon: TrendingUp,
    },
    {
      year: '2026',
      title: s.milestone4Title,
      description: s.milestone4Desc,
      icon: Award,
    },
  ]

  return (
    <section
      className="bg-muted/30 py-16 md:py-24"
      aria-labelledby="about-journey-heading"
    >
      <div className="container mx-auto w-full max-w-5xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {s.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <motion.h2
            id="about-journey-heading"
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </motion.h2>
        </div>

        <ol className="relative mx-auto max-w-2xl border-l border-border pl-8 md:pl-12">
          {MILESTONES.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.li
                key={m.year}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative pb-12 last:pb-0"
              >
                <span
                  aria-hidden
                  className="absolute -left-[2.1rem] top-0 grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-[color:var(--ring)] shadow-sm md:-left-[3.1rem]"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--ring)]">
                  {m.year}
                </div>
                <h3 className="font-heading mt-2 text-xl font-semibold text-foreground md:text-2xl">
                  {m.title}
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  {m.description}
                </p>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

interface Value {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export function AboutValues() {
  const { t } = useI18n()
  const s = t.formsMarketing2.about.values

  const VALUES: Value[] = [
    {
      icon: ShieldCheck,
      title: s.value1Title,
      description: s.value1Desc,
    },
    {
      icon: Eye,
      title: s.value2Title,
      description: s.value2Desc,
    },
    {
      icon: Heart,
      title: s.value3Title,
      description: s.value3Desc,
    },
    {
      icon: Compass,
      title: s.value4Title,
      description: s.value4Desc,
    },
  ]

  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="about-values-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {s.eyebrow}
            </span>
          </div>
          <motion.h2
            id="about-values-heading"
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          {VALUES.map((v, i) => {
            const Icon = v.icon
            return (
              <motion.article
                key={v.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[color:var(--ring)] md:p-8"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[color:color-mix(in_oklab,var(--ring)_12%,transparent)] text-[color:var(--ring)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-heading mt-5 text-lg font-semibold text-foreground md:text-xl">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  {v.description}
                </p>
              </motion.article>
            )
          })}
        </div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/tentang/values">
              {s.cta}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Impact (stats with narrative)
// ---------------------------------------------------------------------------

export interface AboutImpactProps {
  jobsCount: number
  usersCount: number
  tenantsCount: number
  coursesCount: number
}

export function AboutImpact({
  jobsCount,
  usersCount,
  tenantsCount,
  coursesCount,
}: AboutImpactProps) {
  const { t } = useI18n()
  const s = t.formsMarketing2.about.impact

  const items = [
    {
      value: usersCount,
      label: s.label1,
      context: s.context1,
    },
    {
      value: jobsCount,
      label: s.label2,
      context: s.context2,
    },
    {
      value: tenantsCount,
      label: s.label3,
      context: s.context3,
    },
    {
      value: coursesCount,
      label: s.label4,
      context: s.context4,
    },
  ]

  return (
    <section
      className="relative isolate overflow-hidden bg-muted/30 py-16 md:py-24"
      aria-labelledby="about-impact-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {s.eyebrow}
            </span>
          </div>
          <motion.h2
            id="about-impact-heading"
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="font-heading text-4xl font-semibold tabular-nums text-foreground md:text-5xl">
                <AnimatedCounter value={it.value} />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {it.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {it.context}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Team (placeholder avatars)
// ---------------------------------------------------------------------------

interface TeamMember {
  role: string
  focus: string
}

export function AboutTeam() {
  const { t } = useI18n()
  const s = t.formsMarketing2.about.team

  const TEAM: TeamMember[] = [
    { role: s.member1Role, focus: s.member1Focus },
    { role: s.member2Role, focus: s.member2Focus },
    { role: s.member3Role, focus: s.member3Focus },
    { role: s.member4Role, focus: s.member4Focus },
  ]

  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="about-team-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {s.eyebrow}
            </span>
          </div>
          <motion.h2
            id="about-team-heading"
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </motion.h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            {s.body}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {TEAM.map((m, i) => (
            <motion.article
              key={m.role}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                'rounded-2xl border border-border bg-card p-6 text-center',
                'transition-colors hover:border-[color:var(--ring)]',
              )}
            >
              <Avatar size="xl" className="mx-auto">
                <User className="h-7 w-7 text-muted-foreground" aria-hidden />
              </Avatar>
              <h3 className="font-heading mt-4 text-base font-semibold text-foreground md:text-lg">
                {m.role}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                {m.focus}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/tentang/tim">
              {s.ctaTeam}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tentang/karier">
              {s.ctaKarier}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/tentang/legal">
              {s.ctaLegal}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
