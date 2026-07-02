'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Bell,
  Heart,
  Send,
  Apple,
  Play,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface AppPromoProps {
  className?: string
}

const miniJobs: Array<{ title: string; company: string; tag: string }> = [
  { title: 'Frontend Engineer', company: 'PT Maju Digital', tag: 'Remote' },
  { title: 'UI/UX Designer', company: 'Kreasi Studio', tag: 'Hybrid' },
  { title: 'Data Analyst', company: 'Data Cerdas', tag: 'Onsite' },
]

export function AppPromo(props: AppPromoProps): JSX.Element {
  const { className } = props
  const { t } = useI18n()
  const ta = t.formsMarketing.appPromo

  return (
    <section
      aria-labelledby="app-promo-heading"
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-brand-ink via-brand-ink to-[#061a30] py-20 text-brand-ink-foreground md:py-28',
        className,
      )}
    >
      {/* Decorative radial gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,theme(colors.secondary.DEFAULT)/0.25,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,theme(colors.accent.DEFAULT)/0.25,transparent_70%)] blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-72 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,theme(colors.secondary.DEFAULT)/0.15,transparent_70%)] blur-3xl" />
      </div>

      <div className="container relative mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center md:gap-8">
        {/* LEFT */}
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-ink-foreground/20 bg-brand-ink-foreground/10 px-3 py-1 text-xs font-medium text-brand-ink-foreground backdrop-blur">
            <Smartphone className="h-3.5 w-3.5 text-brand-gold" aria-hidden="true" />
            {ta.badge}
          </span>

          <h2
            id="app-promo-heading"
            className="mt-4 font-heading text-3xl font-bold tracking-tight text-brand-ink-foreground md:text-5xl"
          >
            {ta.heading}
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-ink-foreground/80 md:text-lg">
            {ta.body}
          </p>

          <ul className="mt-8 space-y-3">
            {ta.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm md:text-base"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-gold"
                  aria-hidden="true"
                />
                <span className="text-brand-ink-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Download buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#"
              aria-label={ta.ariaAppStore}
              className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-3 text-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Apple className="h-7 w-7" aria-hidden="true" />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {ta.downloadAppStore}
                </span>
                <span className="text-base font-semibold">App Store</span>
              </span>
            </a>

            <a
              href="#"
              aria-label={ta.ariaGooglePlay}
              className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-3 text-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Play className="h-7 w-7" aria-hidden="true" />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {ta.downloadGooglePlay}
                </span>
                <span className="text-base font-semibold">Google Play</span>
              </span>
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-brand-ink-foreground/70">
            <span className="font-semibold text-brand-gold">
              <span aria-hidden="true">★</span> {ta.rating}
            </span>
            <span aria-hidden="true">•</span>
            <span>{ta.reviews}</span>
            <span aria-hidden="true">•</span>
            <span>{ta.downloads}</span>
          </div>
        </div>

        {/* RIGHT: Phone mockup */}
        <div className="relative mx-auto flex h-[28rem] w-full max-w-md items-center justify-center md:h-[34rem]">
          {/* Back phone */}
          <motion.div
            initial={{ y: 0, rotate: -8 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ rotate: '-8deg' }}
            className="absolute right-1/2 top-4 translate-x-[10%] scale-90 opacity-90"
            aria-hidden="true"
          >
            <PhoneMockup variant="back" ta={ta} />
          </motion.div>

          {/* Front phone */}
          <motion.div
            initial={{ y: 0, rotate: 4 }}
            animate={{ y: [0, -14, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.6,
            }}
            style={{ rotate: '4deg' }}
            className="relative z-10"
          >
            <PhoneMockup variant="front" ta={ta} />
          </motion.div>

          {/* Floating chip: interview */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute top-8 -left-2 z-20 rounded-full bg-brand-gold px-3 py-1.5 text-xs font-medium text-[#0a2540] shadow-xl md:-left-4"
          >
            {ta.chipInterview}
          </motion.div>

          {/* Floating chip: applied */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute bottom-12 -right-2 z-20 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow-xl md:-right-4"
          >
            <Send className="h-3 w-3" aria-hidden="true" />
            {ta.chipApplied}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

interface AppPromoStrings {
  mockupGreeting: string
  mockupUser: string
  mockupNotifTitle: string
  mockupNotifBody: string
  mockupSearch: string
  mockupSection: string
  mockupSeeAll: string
  mockupNavHome: string
  mockupNavSearch: string
  mockupNavCourse: string
  mockupNavProfile: string
}

interface PhoneMockupProps {
  variant: 'front' | 'back'
  ta: AppPromoStrings
}

function PhoneMockup({ variant, ta }: PhoneMockupProps): JSX.Element {
  const isFront = variant === 'front'
  return (
    <div
      className={cn(
        'relative aspect-[9/19] overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/40 bg-black shadow-2xl dark:border-foreground/20',
        isFront ? 'w-48 md:w-56' : 'w-44 md:w-52',
      )}
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-1 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

      {/* Screen */}
      <div className="absolute inset-0 flex flex-col bg-background">
        {/* Status bar spacer */}
        <div className="h-7 w-full bg-background" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground">{ta.mockupGreeting}</span>
            <span className="text-sm font-semibold text-foreground">
              {ta.mockupUser}
            </span>
          </div>
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Bell className="h-4 w-4 text-foreground" aria-hidden="true" />
            </div>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" />
          </div>
        </div>

        {/* Floating notification toast */}
        {isFront && (
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-md">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold/20">
              <Bell className="h-3.5 w-3.5 text-brand-gold" aria-hidden="true" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold text-foreground">
                {ta.mockupNotifTitle}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {ta.mockupNotifBody}
              </span>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{ta.mockupSearch}</span>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[10px] font-semibold text-foreground">
            {ta.mockupSection}
          </span>
          <span className="text-[9px] text-brand-ink">{ta.mockupSeeAll}</span>
        </div>

        {/* Mini job cards */}
        <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
          {miniJobs.map((job) => (
            <div
              key={job.title}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand-ink/10">
                <div className="h-4 w-4 rounded bg-brand-ink/40" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[10px] font-semibold text-foreground">
                  {job.title}
                </span>
                <span className="truncate text-[9px] text-muted-foreground">
                  {job.company}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Heart className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                <span className="rounded-full bg-brand-gold/20 px-1.5 py-0.5 text-[8px] font-medium text-brand-gold">
                  {job.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="flex h-12 items-center justify-around border-t border-border bg-card px-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-brand-ink" />
            <span className="text-[8px] text-brand-ink">{ta.mockupNavHome}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-muted-foreground/40" />
            <span className="text-[8px] text-muted-foreground">{ta.mockupNavSearch}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-muted-foreground/40" />
            <span className="text-[8px] text-muted-foreground">{ta.mockupNavCourse}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
            <span className="text-[8px] text-muted-foreground">{ta.mockupNavProfile}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppPromo
