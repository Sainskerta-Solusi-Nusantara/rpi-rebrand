'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  Headphones,
  Minus,
  PlugZap,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

type Billing = 'monthly' | 'yearly'

// ---------------------------------------------------------------------------
// Shared billing state (lifted via context so Hero toggle drives Plans)
// ---------------------------------------------------------------------------

const BillingContext = React.createContext<{
  billing: Billing
  setBilling: (b: Billing) => void
}>({
  billing: 'monthly',
  setBilling: () => {},
})

function PricingProvider({ children }: { children: React.ReactNode }) {
  const [billing, setBilling] = React.useState<Billing>('yearly')
  return (
    <BillingContext.Provider value={{ billing, setBilling }}>
      {children}
    </BillingContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hero (with billing toggle)
// ---------------------------------------------------------------------------

export function PricingHero() {
  return (
    <PricingProvider>
      <PricingHeroInner />
    </PricingProvider>
  )
}

function PricingHeroInner() {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.hero
  const { billing, setBilling } = React.useContext(BillingContext)
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="pricing-hero-heading"
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

      <div className="container mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
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
          id="pricing-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {s.headingStart}{' '}
          <span className="text-[color:var(--ring)]">{s.headingHighlight}</span>.
          <br />
          {s.headingLine2}
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          {s.body}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex items-center justify-center"
        >
          <BillingToggle billing={billing} onChange={setBilling} />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {s.badge1}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            {s.badge2}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {s.badge3}
          </span>
        </motion.div>
      </div>

      <PlansGrid />
    </section>
  )
}

function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing
  onChange: (b: Billing) => void
}) {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.hero
  return (
    <div
      role="tablist"
      aria-label={s.billingAriaLabel}
      className="border-border bg-card relative inline-flex items-center rounded-full border p-1 shadow-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={billing === 'monthly'}
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-5 py-2 text-sm font-medium transition',
          billing === 'monthly'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {s.billingMonthly}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={billing === 'yearly'}
        onClick={() => onChange('yearly')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition',
          billing === 'yearly'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {s.billingYearly}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
            billing === 'yearly'
              ? 'bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
              : 'bg-[color:var(--ring)]/15 text-[color:var(--ring)]',
          )}
        >
          {s.billingSavings}
        </span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Plans Grid (rendered inside hero so toggle drives prices)
// ---------------------------------------------------------------------------

type Plan = {
  id: 'free' | 'pro' | 'business' | 'enterprise'
  name: string
  tagline: string
  monthly: number | 'custom'
  yearly: number | 'custom'
  cta: string
  href: string
  highlight?: boolean
  badge?: string
  features: string[]
  icon: React.ComponentType<{ className?: string }>
}

function usePlans(): Plan[] {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.plans
  return [
    {
      id: 'free',
      name: s.freeName,
      tagline: s.freeTagline,
      monthly: 0,
      yearly: 0,
      cta: s.freeCta,
      href: '/register?plan=free',
      icon: Zap,
      features: [s.free1, s.free2, s.free3, s.free4, s.free5, s.free6],
    },
    {
      id: 'pro',
      name: s.proName,
      tagline: s.proTagline,
      monthly: 1_490_000,
      yearly: 1_192_000,
      cta: s.proCta,
      href: '/register?plan=pro',
      icon: Star,
      features: [s.pro1, s.pro2, s.pro3, s.pro4, s.pro5, s.pro6, s.pro7, s.pro8],
    },
    {
      id: 'business',
      name: s.businessName,
      tagline: s.businessTagline,
      monthly: 4_990_000,
      yearly: 3_992_000,
      cta: s.businessCta,
      href: '/register?plan=business',
      icon: Sparkles,
      highlight: true,
      badge: s.businessBadge,
      features: [s.business1, s.business2, s.business3, s.business4, s.business5, s.business6, s.business7, s.business8, s.business9],
    },
    {
      id: 'enterprise',
      name: s.enterpriseName,
      tagline: s.enterpriseTagline,
      monthly: 'custom',
      yearly: 'custom',
      cta: s.enterpriseCta,
      href: '/contact?topic=enterprise',
      icon: Server,
      features: [s.enterprise1, s.enterprise2, s.enterprise3, s.enterprise4, s.enterprise5, s.enterprise6, s.enterprise7, s.enterprise8, s.enterprise9],
    },
  ]
}

function PlansGrid() {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.hero
  const { billing } = React.useContext(BillingContext)
  const PLANS = usePlans()
  return (
    <div className="container mx-auto w-full max-w-7xl px-6 pb-20 md:pb-24">
      <div className="grid gap-5 lg:grid-cols-4">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.05 * i }}
          >
            <PlanCard plan={p} billing={billing} />
          </motion.div>
        ))}
      </div>

      <p className="text-muted-foreground mt-8 text-center text-xs">
        {s.vatNote}
      </p>
    </div>
  )
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.plans
  const Icon = plan.icon
  const price = billing === 'monthly' ? plan.monthly : plan.yearly
  const isCustom = price === 'custom'
  const isFree = price === 0

  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-2xl border p-6 transition',
        plan.highlight
          ? 'border-[color:var(--ring)] bg-card shadow-lg shadow-[color:var(--ring)]/10'
          : 'border-border bg-card hover:border-[color:var(--ring)]/50',
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow">
            <Sparkles className="h-3 w-3" aria-hidden />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'grid size-10 place-items-center rounded-xl border',
            plan.highlight
              ? 'border-[color:var(--ring)]/40 bg-[color:var(--ring)]/10 text-[color:var(--ring)]'
              : 'border-border bg-muted text-foreground/70',
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-heading text-foreground text-lg font-semibold">
            {plan.name}
          </h3>
          <p className="text-muted-foreground text-xs">{plan.tagline}</p>
        </div>
      </div>

      <div className="mt-6">
        {isCustom ? (
          <div>
            <div className="font-heading text-foreground text-3xl font-semibold tracking-tight">
              {s.priceCustom}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {s.priceCustomNote}
            </p>
          </div>
        ) : isFree ? (
          <div>
            <div className="font-heading text-foreground text-4xl font-semibold tracking-tight">
              Rp 0
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{s.priceForever}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground text-sm">Rp</span>
              <span className="font-heading text-foreground text-4xl font-semibold tracking-tight">
                {(price as number).toLocaleString('id-ID')}
              </span>
              <span className="text-muted-foreground text-sm">{s.pricePerMonth}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {billing === 'yearly'
                ? s.priceBilledYearly.replace('{amount}', ((price as number) * 12).toLocaleString('id-ID'))
                : s.priceBilledMonthly}
            </p>
          </div>
        )}
      </div>

      <Button
        asChild
        size="lg"
        variant={plan.highlight ? 'default' : 'outline'}
        className="mt-6 w-full"
      >
        <a href={plan.href}>
          {plan.cta}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </a>
      </Button>

      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                plan.highlight ? 'text-[color:var(--ring)]' : 'text-foreground/60',
              )}
              aria-hidden
            />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Compare Table
// ---------------------------------------------------------------------------

type Cell = string | boolean

type FeatureRow = {
  label: string
  values: [Cell, Cell, Cell, Cell] // free, pro, business, enterprise
}

type FeatureGroup = {
  title: string
  rows: FeatureRow[]
}

function useCompare(): FeatureGroup[] {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.compare
  return [
    {
      title: s.group1,
      rows: [
        { label: s.rowActiveJobs,    values: ['1', '10', s.cellUnlimited, s.cellUnlimited] },
        { label: s.rowApplicants,    values: ['50', '1.000', '10.000', s.cellUnlimited] },
        { label: s.rowMultiChannel,  values: [false, true, true, true] },
        { label: s.rowPrivate,       values: [false, false, true, true] },
      ],
    },
    {
      title: s.group2,
      rows: [
        { label: s.rowSubdomainRpi,   values: [true, true, true, true] },
        { label: s.rowCustomSubdomain, values: [false, true, true, true] },
        { label: s.rowCustomDomain,   values: [false, false, true, true] },
        { label: s.rowTheme,          values: [false, true, true, true] },
        { label: s.rowWhiteLabel,     values: [false, false, false, true] },
      ],
    },
    {
      title: s.group3,
      rows: [
        { label: s.rowAts,        values: [s.cellBasic, s.cellStandard, s.cellFull, s.cellFull] },
        { label: s.rowMembers,    values: ['1', '5', s.cellUnlimited, s.cellUnlimited] },
        { label: s.rowRbac,       values: [false, false, true, true] },
        { label: s.rowAutomation, values: [false, s.cellBasic, s.cellAdvanced, s.cellAdvanced] },
        { label: s.rowNotes,      values: [true, true, true, true] },
      ],
    },
    {
      title: s.group4,
      rows: [
        { label: s.rowLinkedIn, values: [false, true, true, true] },
        { label: s.rowApi,      values: [false, false, true, true] },
        { label: s.rowWebhook,  values: [false, false, true, true] },
        { label: s.rowSso,      values: [false, false, false, true] },
        { label: s.rowScim,     values: [false, false, false, true] },
      ],
    },
    {
      title: s.group5,
      rows: [
        { label: s.rowAnalytics,     values: [false, s.cellBasic, s.cellAdvanced, s.cellAdvanced] },
        { label: s.rowCustomReport,  values: [false, false, true, true] },
        { label: s.rowSupport,       values: [s.cellEmail, s.cellEmailChat, s.cellPriority, s.cellDedicatedCsm] },
        { label: s.rowSla,           values: [false, false, false, '99.9%'] },
        { label: s.rowOnboarding,    values: [false, false, false, true] },
      ],
    },
  ]
}

export function PricingCompare() {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.compare
  const PLANS = usePlans()
  const COMPARE = useCompare()
  const [open, setOpen] = React.useState(false)
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="pricing-compare-heading"
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
              {s.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="pricing-compare-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {s.body}
          </p>
        </motion.div>

        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          {/* Header */}
          <div className="border-border bg-muted/40 grid grid-cols-[1.6fr_repeat(4,1fr)] border-b">
            <div className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {s.colFeature}
            </div>
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'px-3 py-4 text-center text-xs font-semibold uppercase tracking-wider',
                  p.highlight
                    ? 'text-[color:var(--ring)]'
                    : 'text-muted-foreground',
                )}
              >
                {p.name}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="hover:bg-muted/40 border-border flex w-full items-center justify-between gap-4 border-b px-5 py-3 text-left text-sm font-medium transition lg:hidden"
            aria-expanded={open}
          >
            <span>{s.showHide.replace('{action}', open ? s.hide : s.show)}</span>
            <ChevronDown
              className={cn('h-4 w-4 transition', open && 'rotate-180')}
              aria-hidden
            />
          </button>

          <div className={cn('divide-border divide-y', !open && 'hidden lg:block')}>
            {COMPARE.map((group) => (
              <div key={group.title}>
                <div className="bg-muted/20 px-5 py-3">
                  <h3 className="font-heading text-foreground text-sm font-semibold uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
                <div className="divide-border divide-y">
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1.6fr_repeat(4,1fr)] items-center"
                    >
                      <div className="text-foreground/85 px-5 py-3.5 text-sm">
                        {row.label}
                      </div>
                      {row.values.map((v, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center justify-center px-3 py-3.5 text-sm',
                            idx === 2 && 'bg-[color:var(--ring)]/[0.04]',
                          )}
                        >
                          <CellValue v={v} ariaIncluded={s.ariaIncluded} ariaNotIncluded={s.ariaNotIncluded} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CellValue({ v, ariaIncluded, ariaNotIncluded }: { v: Cell; ariaIncluded: string; ariaNotIncluded: string }) {
  if (v === true) {
    return (
      <Check
        className="text-[color:var(--ring)] h-4 w-4"
        aria-label={ariaIncluded}
      />
    )
  }
  if (v === false) {
    return (
      <Minus
        className="text-muted-foreground/40 h-4 w-4"
        aria-label={ariaNotIncluded}
      />
    )
  }
  return <span className="text-foreground/85 text-xs font-medium">{v}</span>
}

// ---------------------------------------------------------------------------
// Add-ons
// ---------------------------------------------------------------------------

type Addon = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  price: string
  desc: string
}

export function PricingAddons() {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.addons

  const ADDONS: Addon[] = [
    { icon: BarChart3, title: s.addon1Title, price: s.addon1Price, desc: s.addon1Desc },
    { icon: PlugZap, title: s.addon2Title, price: s.addon2Price, desc: s.addon2Desc },
    { icon: Headphones, title: s.addon3Title, price: s.addon3Price, desc: s.addon3Desc },
    { icon: ShieldCheck, title: s.addon4Title, price: s.addon4Price, desc: s.addon4Desc },
  ]

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="pricing-addons-heading"
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
              {s.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="pricing-addons-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {s.body}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ADDONS.map((a, i) => {
            const Icon = a.icon
            return (
              <motion.div
                key={a.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border bg-card hover:border-[color:var(--ring)]/50 flex items-start gap-5 rounded-2xl border p-6 transition"
              >
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {a.title}
                    </h3>
                    <span className="text-[color:var(--ring)] text-xs font-semibold">
                      {a.price}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {a.desc}
                  </p>
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
// Pricing FAQ
// ---------------------------------------------------------------------------

export function PricingFAQ() {
  const { t } = useI18n()
  const s = t.formsMarketing2.pricing.faq

  const FAQ_ITEMS = [
    { q: s.q1, a: s.a1 },
    { q: s.q2, a: s.a2 },
    { q: s.q3, a: s.a3 },
    { q: s.q4, a: s.a4 },
    { q: s.q5, a: s.a5 },
    { q: s.q6, a: s.a6 },
    { q: s.q7, a: s.a7 },
    { q: s.q8, a: s.a8 },
  ]

  const [open, setOpen] = React.useState<number | null>(0)
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="pricing-faq-heading"
    >
      <div className="container mx-auto w-full max-w-3xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {s.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="pricing-faq-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
        </motion.div>

        <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="hover:bg-muted/30 flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition sm:px-6"
                >
                  <span className="font-heading text-foreground text-sm font-semibold sm:text-base">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'text-muted-foreground mt-0.5 h-4 w-4 shrink-0 transition',
                      isOpen && 'rotate-180 text-[color:var(--ring)]',
                    )}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="text-muted-foreground px-5 pb-5 text-sm leading-relaxed sm:px-6">
                    {item.a}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
