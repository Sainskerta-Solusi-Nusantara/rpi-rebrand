'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Bug,
  Cookie,
  Copyright,
  ExternalLink,
  FileText,
  Gavel,
  Globe,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Newspaper,
  Receipt,
  ScrollText,
  Shield,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function LegalHero() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.hero
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="legal-hero-heading"
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

      <div className="container mx-auto w-full max-w-5xl px-6 pt-10 md:pt-14">
        <Link
          href="/tentang"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {s.backLink}
        </Link>
      </div>

      <div className="container mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
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
          id="legal-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {s.headingStart}{' '}
          <span className="text-[color:var(--ring)]">{s.headingHighlight}</span>.
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
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {s.badge3}
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

export function LegalEntity() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.entity

  const ENTITY_FACTS: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: Building2, label: s.factLabel1, value: 'PT Rumah Pekerja Indonesia' },
    { icon: ScrollText, label: s.factLabel2, value: 'Perseroan Terbatas (Tertutup)' },
    { icon: Landmark, label: s.factLabel3, value: 'No. 24, 17 Agustus 2021 — Notaris Rini Setiawati, S.H., M.Kn.' },
    { icon: Receipt, label: s.factLabel4, value: '91.234.567.8-073.000' },
    { icon: FileText, label: s.factLabel5, value: '8120020410012' },
    { icon: BadgeCheck, label: s.factLabel6, value: 'No. 503/4521/PB/2021' },
    { icon: Gavel, label: s.factLabel7, value: '09.03.1.62.04521' },
    { icon: Globe, label: s.factLabel8, value: '63122 (Portal Web/Platform Digital)' },
  ]

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="legal-entity-heading"
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
            id="legal-entity-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {s.body}
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Facts list */}
          <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <ul className="divide-border divide-y">
              {ENTITY_FACTS.map((f) => {
                const Icon = f.icon
                return (
                  <li
                    key={f.label}
                    className="grid grid-cols-[auto_1fr] gap-4 px-6 py-4"
                  >
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                        {f.label}
                      </dt>
                      <dd className="font-heading text-foreground mt-0.5 text-sm font-semibold tabular-nums">
                        {f.value}
                      </dd>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Office address card */}
          <div className="space-y-5">
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                <MapPin className="inline h-3.5 w-3.5" aria-hidden /> {s.labelAddress}
              </div>
              <address className="text-foreground/85 mt-3 not-italic text-sm leading-relaxed">
                <strong className="text-foreground font-semibold">
                  PT Rumah Pekerja Indonesia
                </strong>
                <br />
                Menara Standard Chartered, Lantai 21
                <br />
                Jl. Prof. Dr. Satrio No. 164
                <br />
                Karet Semanggi, Setiabudi
                <br />
                Jakarta Selatan 12930, Indonesia
              </address>
            </div>

            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                <Globe className="inline h-3.5 w-3.5" aria-hidden /> {s.labelDomain}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <span className="text-foreground font-medium">
                    rumahpekerja.id
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {s.domainMainSuffix}
                  </span>
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    rpi.co.id
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {s.domainAltSuffix}
                  </span>
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    rumahpekerjaindonesia.com
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {s.domainRedirectSuffix}
                  </span>
                </li>
              </ul>
              <p className="text-muted-foreground border-border mt-4 border-t pt-3 text-xs">
                {s.domainWarning} <strong>{s.domainWarningStrong}</strong>{' '}
                {s.domainWarningEnd}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

type Standard = {
  acronym: string
  full: string
  status: 'aktif' | 'persiapan'
  desc: string
  auditor?: string
  href?: string
}

export function LegalCompliance() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.compliance

  const STANDARDS: Standard[] = [
    {
      acronym: 'ISO 27001:2022',
      full: 'Information Security Management Systems',
      status: 'aktif',
      desc: s.std1Desc,
      auditor: 'BSI Group · sertifikat aktif hingga Q3 2027',
    },
    {
      acronym: 'SOC 2 Type II',
      full: 'Service Organization Control 2',
      status: 'aktif',
      desc: s.std2Desc,
      auditor: 'Deloitte · laporan terbaru: Februari 2026',
    },
    {
      acronym: 'UU PDP',
      full: 'Pelindungan Data Pribadi (UU No. 27/2022)',
      status: 'aktif',
      desc: s.std3Desc,
    },
    {
      acronym: 'GDPR',
      full: 'General Data Protection Regulation (EU)',
      status: 'aktif',
      desc: s.std4Desc,
    },
    {
      acronym: 'PCI DSS L1',
      full: 'Payment Card Industry Data Security Standard',
      status: 'aktif',
      desc: s.std5Desc,
    },
    {
      acronym: 'OWASP ASVS L3',
      full: 'Application Security Verification Standard',
      status: 'aktif',
      desc: s.std6Desc,
    },
    {
      acronym: 'BSSN-ready',
      full: 'Badan Siber dan Sandi Negara — Lokalisasi Data',
      status: 'aktif',
      desc: s.std7Desc,
    },
    {
      acronym: 'ISO 27701',
      full: 'Privacy Information Management',
      status: 'persiapan',
      desc: s.std8Desc,
    },
  ]

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="legal-compliance-heading"
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
            id="legal-compliance-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {s.body}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {STANDARDS.map((std, i) => (
            <motion.article
              key={std.acronym}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.03 * i }}
              className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      className="text-[color:var(--ring)] h-5 w-5 shrink-0"
                      aria-hidden
                    />
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {std.acronym}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {std.full}
                  </p>
                </div>
                <span
                  className={
                    std.status === 'aktif'
                      ? 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600'
                      : 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600'
                  }
                >
                  <span
                    aria-hidden
                    className={
                      std.status === 'aktif'
                        ? 'size-1.5 rounded-full bg-emerald-500'
                        : 'size-1.5 rounded-full bg-amber-500'
                    }
                  />
                  {std.status === 'aktif' ? s.statusActive : s.statusPrep}
                </span>
              </div>
              <p className="text-foreground/85 mt-4 text-sm leading-relaxed">
                {std.desc}
              </p>
              {std.auditor && (
                <p className="border-border text-muted-foreground mt-4 border-t pt-3 text-xs">
                  <span className="text-foreground/70 font-medium">{s.auditorLabel}</span>{' '}
                  {std.auditor}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

type LegalDoc = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  lastUpdated: string
  href: string
  external?: boolean
}

export function LegalDocuments() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.documents

  const DOCS: LegalDoc[] = [
    {
      icon: ScrollText,
      title: s.doc1Title,
      desc: s.doc1Desc,
      lastUpdated: s.doc1Updated,
      href: '/terms',
    },
    {
      icon: Lock,
      title: s.doc2Title,
      desc: s.doc2Desc,
      lastUpdated: s.doc2Updated,
      href: '/privacy',
    },
    {
      icon: Cookie,
      title: s.doc3Title,
      desc: s.doc3Desc,
      lastUpdated: s.doc3Updated,
      href: '/cookies',
    },
    {
      icon: FileText,
      title: 'Acceptable Use Policy',
      desc: s.doc4Desc,
      lastUpdated: s.doc4Updated,
      href: '/legal/aup',
    },
    {
      icon: Shield,
      title: 'Data Processing Addendum',
      desc: s.doc5Desc,
      lastUpdated: s.doc5Updated,
      href: '/legal/dpa',
    },
    {
      icon: BadgeCheck,
      title: 'Service Level Agreement',
      desc: s.doc6Desc,
      lastUpdated: s.doc6Updated,
      href: '/legal/sla',
    },
    {
      icon: Newspaper,
      title: 'Master Subscription Agreement',
      desc: s.doc7Desc,
      lastUpdated: s.doc7Updated,
      href: '/legal/msa',
    },
    {
      icon: Receipt,
      title: s.doc8Title,
      desc: s.doc8Desc,
      lastUpdated: s.doc8Updated,
      href: '/legal/billing',
    },
  ]

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="legal-docs-heading"
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
            id="legal-docs-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {s.body}
          </p>
        </motion.div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {DOCS.map((d, i) => {
            const Icon = d.icon
            return (
              <motion.li
                key={d.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
              >
                <a
                  href={d.href}
                  className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-5 transition"
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-sm font-semibold transition sm:text-base">
                        {d.title}
                      </h3>
                      <ArrowRight
                        className="text-muted-foreground group-hover:text-[color:var(--ring)] h-3.5 w-3.5 shrink-0 transition"
                        aria-hidden
                      />
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {d.desc}
                    </p>
                    <p className="text-muted-foreground/80 mt-3 text-[10px] uppercase tracking-wider">
                      {d.lastUpdated}
                    </p>
                  </div>
                </a>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// IP / Trademark
// ---------------------------------------------------------------------------

export function LegalIP() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.ip
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="legal-ip-heading"
    >
      <div className="container mx-auto w-full max-w-5xl px-6">
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
            id="legal-ip-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="border-border bg-card rounded-2xl border p-6">
            <Copyright
              className="text-[color:var(--ring)] h-6 w-6"
              aria-hidden
            />
            <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
              {s.copyrightTitle}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {s.copyrightBody}
            </p>
            <p className="text-muted-foreground/80 mt-3 text-xs">
              {s.copyrightNote}
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <BadgeCheck
              className="text-[color:var(--ring)] h-6 w-6"
              aria-hidden
            />
            <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
              {s.trademarkTitle}
            </h3>
            <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
              <li>
                <strong className="text-foreground font-medium">
                  Rumah Pekerja Indonesia&reg;
                </strong>{' '}
                &middot; DJKI No. IDM000789012
              </li>
              <li>
                <strong className="text-foreground font-medium">RPI&reg;</strong>{' '}
                &middot; DJKI No. IDM000789015
              </li>
              <li>
                <strong className="text-foreground font-medium">
                  RPI Academy&trade;
                </strong>{' '}
                &middot; {s.trademarkPending}
              </li>
            </ul>
            <p className="text-muted-foreground/80 mt-4 text-xs">
              Logo, identitas visual, dan tagline adalah properti PT Rumah
              Pekerja Indonesia.
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6 md:col-span-2">
            <Building2
              className="text-[color:var(--ring)] h-6 w-6"
              aria-hidden
            />
            <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
              {s.brandTitle}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {s.brandBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <a href="/press-kit/RPI-Brand-Guidelines.pdf">
                  {s.ctaBrandGuidelines}
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/press-kit/RPI-Logo-Pack.zip">
                  {s.ctaLogoPack}
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Disclosure & Reports
// ---------------------------------------------------------------------------

type DisclosureItem = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  cta: { label: string; href: string }
}

export function LegalDisclosure() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.disclosure

  const DISCLOSURES: DisclosureItem[] = [
    {
      icon: Bug,
      title: 'Vulnerability Disclosure Program',
      desc: s.disc1Desc,
      cta: { label: 'security@rumahpekerja.id', href: 'mailto:security@rumahpekerja.id' },
    },
    {
      icon: AlertTriangle,
      title: 'Laporan Insiden Keamanan',
      desc: s.disc2Desc,
      cta: { label: 'status.rumahpekerja.id', href: 'https://status.rumahpekerja.id' },
    },
    {
      icon: FileText,
      title: 'Laporan Transparansi Tahunan',
      desc: s.disc3Desc,
      cta: { label: s.disc3Cta, href: '/legal/transparency-2025' },
    },
    {
      icon: Newspaper,
      title: 'Audit Bias AI',
      desc: s.disc4Desc,
      cta: { label: s.disc4Cta, href: '/legal/bias-audit-2026' },
    },
  ]

  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="legal-disclosure-heading"
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
            id="legal-disclosure-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {s.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {s.body}
          </p>
        </motion.div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {DISCLOSURES.map((d, i) => {
            const Icon = d.icon
            const isExternal = d.cta.href.startsWith('http') || d.cta.href.startsWith('mailto')
            return (
              <motion.li
                key={d.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
                className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
              >
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
                  {d.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {d.desc}
                </p>
                <a
                  href={d.cta.href}
                  {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex w-fit items-center gap-1 text-sm font-medium transition"
                >
                  {d.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export function LegalContact() {
  const { t } = useI18n()
  const s = t.formsMarketing2.legal.contact

  const LEGAL_CONTACTS = [
    {
      label: s.contact1Label,
      email: 'legal@rumahpekerja.id',
      desc: s.contact1Desc,
    },
    {
      label: s.contact2Label,
      email: 'privacy@rumahpekerja.id',
      desc: s.contact2Desc,
    },
    {
      label: s.contact3Label,
      email: 'lawenforcement@rumahpekerja.id',
      desc: s.contact3Desc,
    },
    {
      label: s.contact4Label,
      email: 'security@rumahpekerja.id',
      desc: s.contact4Desc,
    },
  ]

  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="legal-contact-heading"
    >
      <div className="container mx-auto w-full max-w-4xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="border-border bg-card relative overflow-hidden rounded-3xl border p-10 md:p-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-60"
            style={{
              background:
                'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 18%, transparent), transparent)',
            }}
          />

          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {s.eyebrow}
              </span>
            </div>
            <h2
              id="legal-contact-heading"
              className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {s.heading}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-base">
              {s.body}
            </p>

            <ul className="border-border mt-8 divide-border divide-y border-y">
              {LEGAL_CONTACTS.map((c) => (
                <li
                  key={c.email}
                  className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6"
                >
                  <div className="min-w-0">
                    <div className="font-heading text-foreground text-sm font-semibold">
                      {c.label}
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {c.desc}
                    </p>
                  </div>
                  <a
                    href={`mailto:${c.email}`}
                    className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-2 text-sm font-medium transition"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {c.email}
                  </a>
                </li>
              ))}
            </ul>

            <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-between gap-4 text-xs">
              <span>
                {s.subpoenaNote} <em>Legal Department</em>.
              </span>
              <Button asChild variant="outline" size="sm">
                <a href="mailto:legal@rumahpekerja.id">
                  {s.ctaEmail}
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
