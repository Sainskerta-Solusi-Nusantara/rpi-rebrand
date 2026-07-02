'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Cloud,
  Database,
  FileCheck,
  Gauge,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  Network,
  Quote,
  Send,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Workflow,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function EnterpriseHero() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.hero

  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="enterprise-hero-heading"
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
            {tl.eyebrow}
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="enterprise-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {tl.headlinePart1}{' '}
          <span className="text-[color:var(--ring)]">{tl.headlineHighlight}</span>
          {' '}{tl.headlinePart2}
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          {tl.body}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="#enterprise-contact">
              {tl.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/SSN-Enterprise-Brochure.pdf" target="_blank" rel="noopener noreferrer">
              {tl.ctaSecondary}
            </a>
          </Button>
        </motion.div>

        <motion.dl
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4"
        >
          {tl.stats.map((s) => (
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
// Trust Logos
// ---------------------------------------------------------------------------

const TRUST = [
  { name: 'Telkom Indonesia',  initial: 'T', color: '#E60000' },
  { name: 'Bank Mandiri',      initial: 'M', color: '#003D7A' },
  { name: 'Pertamina',         initial: 'P', color: '#D32F2F' },
  { name: 'BCA',               initial: 'B', color: '#0060AF' },
  { name: 'Astra International', initial: 'A', color: '#003DA5' },
  { name: 'Garuda Indonesia',  initial: 'G', color: '#005F9E' },
  { name: 'PLN',               initial: 'P', color: '#FBB040' },
  { name: 'Sinar Mas Group',   initial: 'S', color: '#F58025' },
]

export function EnterpriseTrust() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.trust

  return (
    <section
      className="bg-muted/30 py-14 md:py-16"
      aria-labelledby="enterprise-trust-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.5 }}
          id="enterprise-trust-heading"
          className="text-muted-foreground text-center text-xs font-medium uppercase tracking-[0.2em]"
        >
          {tl.heading}
        </motion.h2>

        <motion.ul
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
        >
          {TRUST.map((item) => (
            <li
              key={item.name}
              className="border-border bg-card flex items-center gap-2.5 rounded-xl border p-3"
              title={item.name}
            >
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold text-white"
                style={{ background: item.color }}
              >
                {item.initial}
              </span>
              <span className="text-foreground/85 truncate text-xs font-medium">
                {item.name}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Capabilities (4 pillars + detail)
// ---------------------------------------------------------------------------

const PILLAR_ICONS = [ShieldCheck, Layers, Gauge, Award]

export function EnterpriseCapabilities() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.capabilities

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="enterprise-capabilities-heading"
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
              {tl.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="enterprise-capabilities-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tl.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tl.body}
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {tl.pillars.map((p, i) => {
            const Icon = PILLAR_ICONS[i]!
            return (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-7"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full opacity-50"
                  style={{
                    background:
                      'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 16%, transparent), transparent)',
                  }}
                />

                <span
                  aria-hidden
                  className="mb-5 grid size-12 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-6 w-6" />
                </span>

                <h3 className="font-heading text-foreground text-xl font-semibold">
                  {p.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {p.desc}
                </p>

                <ul className="border-border mt-5 grid grid-cols-1 gap-2 border-t pt-5 text-sm sm:grid-cols-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <BadgeCheck
                        className="text-[color:var(--ring)] mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="text-foreground/85">{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Security & Compliance
// ---------------------------------------------------------------------------

const SECURITY_ICONS = [Lock, KeyRound, Database, FileCheck, Cloud, Workflow]

export function EnterpriseSecurity() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.security

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="enterprise-security-heading"
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
              {tl.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="enterprise-security-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tl.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tl.body}
          </p>
        </motion.div>

        {/* Compliance badges */}
        <ul className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tl.compliance.map((c, i) => (
            <motion.li
              key={c.label}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.03 * i }}
              className="border-border bg-card flex flex-col items-center rounded-xl border p-4 text-center"
            >
              <ShieldCheck className="text-[color:var(--ring)] mb-2 h-6 w-6" aria-hidden />
              <span className="font-heading text-foreground text-xs font-semibold sm:text-sm">
                {c.label}
              </span>
              <span className="text-muted-foreground mt-0.5 text-[10px] uppercase tracking-wider">
                {c.sub}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Security feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tl.features.map((f, i) => {
            const Icon = SECURITY_ICONS[i]!
            return (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
                className="border-border bg-card rounded-xl border p-5"
              >
                <Icon className="text-[color:var(--ring)] h-5 w-5" aria-hidden />
                <h3 className="font-heading text-foreground mt-3 text-sm font-semibold">
                  {f.title}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                  {f.desc}
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
// Implementation Roadmap
// ---------------------------------------------------------------------------

const PHASE_ICONS = [Network, ServerCog, Users, Sparkles]

export function EnterpriseImplementation() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.implementation

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="enterprise-impl-heading"
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
              {tl.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="enterprise-impl-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tl.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tl.body}
          </p>
        </motion.div>

        <ol className="relative space-y-6">
          <span
            aria-hidden
            className="bg-border absolute left-[22px] top-2 bottom-2 w-px"
          />
          {tl.phases.map((p, i) => {
            const Icon = PHASE_ICONS[i]!
            return (
              <motion.li
                key={p.title}
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
                <div className="border-border bg-card flex-1 rounded-xl border p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {p.title}
                    </h3>
                    <span className="text-[color:var(--ring)] text-xs font-semibold uppercase tracking-wider">
                      {p.range}
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <BadgeCheck
                          className="text-[color:var(--ring)] mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden
                        />
                        <span className="text-foreground/85">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Case Study
// ---------------------------------------------------------------------------

export function EnterpriseCaseStudy() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.caseStudy

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="enterprise-case-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        >
          {/* Left: copy */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {tl.eyebrow}
              </span>
            </div>
            <h2
              id="enterprise-case-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {tl.heading.replace('{count}', '12')}
            </h2>
            <p className="text-muted-foreground mt-4">
              {tl.body.replace('{count}', '12').replace('{atsSystems}', '6')}
            </p>

            <blockquote className="border-l-[color:var(--ring)] my-6 border-l-2 pl-5">
              <Quote className="text-[color:var(--ring)]/30 -ml-1 h-7 w-7" aria-hidden />
              <p className="text-foreground/90 font-heading mt-2 text-base italic md:text-lg">
                &ldquo;{tl.quote}&rdquo;
              </p>
              <footer className="text-muted-foreground mt-4 text-xs">
                <strong className="text-foreground font-medium">{tl.quoteAttribution}</strong>{' '}
                &mdash; {tl.quoteRole}
              </footer>
            </blockquote>

            <Button asChild variant="outline">
              <a href="/case-studies/group-conglomerate">
                {tl.ctaReadMore}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </a>
            </Button>
          </div>

          {/* Right: metric cards */}
          <div className="grid grid-cols-2 gap-4">
            {tl.metrics.map((m, i) => (
              <motion.div
                key={m.l}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="border-border bg-card flex flex-col rounded-2xl border p-6"
              >
                <span className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                  {m.v}
                </span>
                <span className="text-foreground/85 mt-2 text-sm font-medium">
                  {m.l}
                </span>
                <span className="text-muted-foreground mt-1 text-xs">
                  {m.sub}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Contact (Enterprise Sales)
// ---------------------------------------------------------------------------

export function EnterpriseContact() {
  const { t } = useI18n()
  const tl = t.formsEnterprise.contact

  return (
    <section
      id="enterprise-contact"
      className="bg-background py-20 md:py-24"
      aria-labelledby="enterprise-contact-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: pitch */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {tl.eyebrow}
              </span>
            </div>
            <h2
              id="enterprise-contact-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {tl.heading}
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              {tl.body}
            </p>

            <ul className="border-border mt-8 space-y-4 border-t pt-8">
              {tl.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <BadgeCheck
                    className="text-[color:var(--ring)] mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden
                  />
                  <span className="text-foreground/85 text-sm">{b}</span>
                </li>
              ))}
            </ul>

            <div className="border-border bg-card mt-10 rounded-2xl border p-6">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-heading text-foreground text-sm font-semibold">
                    {tl.officeLabel}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {tl.officeCity}
                  </div>
                </div>
              </div>
              <div className="text-muted-foreground mt-4 grid grid-cols-1 gap-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  {tl.officeAddress}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Send className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  {tl.officeEmail}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Star className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  {tl.officePhone}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.form
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="border-border bg-card space-y-5 rounded-2xl border p-7"
            onSubmit={(e) => {
              e.preventDefault()
              // TEMPORARY DUMMY — wire to enterprise sales lead pipeline.
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={tl.form.fullNameLabel} htmlFor="ent-name" required>
                <Input id="ent-name" name="name" autoComplete="name" required />
              </Field>
              <Field label={tl.form.jobTitleLabel} htmlFor="ent-title" required>
                <Input
                  id="ent-title"
                  name="title"
                  placeholder={tl.form.jobTitlePlaceholder}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={tl.form.workEmailLabel} htmlFor="ent-email" required>
                <Input
                  id="ent-email"
                  name="email"
                  type="email"
                  placeholder={tl.form.workEmailPlaceholder}
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label={tl.form.phoneLabel} htmlFor="ent-phone">
                <Input
                  id="ent-phone"
                  name="phone"
                  type="tel"
                  placeholder={tl.form.phonePlaceholder}
                  autoComplete="tel"
                />
              </Field>
            </div>

            <Field label={tl.form.companyNameLabel} htmlFor="ent-company" required>
              <Input id="ent-company" name="company" required />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={tl.form.companySizeLabel} htmlFor="ent-size" required>
                <select
                  id="ent-size"
                  name="size"
                  required
                  defaultValue=""
                  className="border-border bg-background text-foreground focus-visible:ring-ring/40 flex h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="" disabled>{tl.form.companySizePlaceholder}</option>
                  {tl.companySizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label={tl.form.industryLabel} htmlFor="ent-industry" required>
                <select
                  id="ent-industry"
                  name="industry"
                  required
                  defaultValue=""
                  className="border-border bg-background text-foreground focus-visible:ring-ring/40 flex h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="" disabled>{tl.form.industryPlaceholder}</option>
                  {tl.industries.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={tl.form.messageLabel} htmlFor="ent-message">
              <Textarea
                id="ent-message"
                name="message"
                rows={5}
                placeholder={tl.form.messagePlaceholder}
              />
            </Field>

            <label className="text-muted-foreground flex items-start gap-3 text-xs">
              <input
                type="checkbox"
                name="consent"
                required
                className="border-border text-[color:var(--ring)] mt-0.5 h-4 w-4 rounded border"
              />
              <span>
                {tl.form.consentPrefix}{' '}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2"
                >
                  {tl.form.consentPrivacyLink}
                </a>{' '}
                {tl.form.consentSuffix}
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full">
              {tl.form.submitLabel}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-foreground/90 text-sm">
        {label}
        {required && <span className="text-[color:var(--destructive)] ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
