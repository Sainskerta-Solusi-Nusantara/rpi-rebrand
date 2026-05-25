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

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function EnterpriseHero() {
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
            Solusi Enterprise
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="enterprise-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Perekrutan{' '}
          <span className="text-[color:var(--ring)]">berskala enterprise</span>
          {' '}untuk Indonesia.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Platform multi-tenant yang menyatukan grup usaha, BUMN, dan perusahaan
          terregulasi — dengan SSO, SLA 99.9%, residensi data lokal, dan tim
          sukses yang khusus untuk Anda.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="#enterprise-contact">
              Bicara dengan Tim Sales
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/RPI-Enterprise-Brochure.pdf" target="_blank" rel="noopener noreferrer">
              Unduh Brosur (PDF)
            </a>
          </Button>
        </motion.div>

        <motion.dl
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4"
        >
          {[
            { v: '99.9%', l: 'SLA uptime' },
            { v: '500K+', l: 'Pelamar/bulan' },
            { v: '< 4 jam', l: 'Respons dukungan' },
            { v: 'ISO 27001', l: 'Tersertifikasi' },
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
          Dipercaya oleh perusahaan terdepan Indonesia
        </motion.h2>

        <motion.ul
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
        >
          {TRUST.map((t) => (
            <li
              key={t.name}
              className="border-border bg-card flex items-center gap-2.5 rounded-xl border p-3"
              title={t.name}
            >
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold text-white"
                style={{ background: t.color }}
              >
                {t.initial}
              </span>
              <span className="text-foreground/85 truncate text-xs font-medium">
                {t.name}
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

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Keamanan tingkat bank',
    desc: 'Enkripsi end-to-end, kontrol akses berlapis, audit log lengkap, dan kepatuhan terhadap UU PDP serta standar internasional.',
    points: [
      'SSO via SAML 2.0 / OIDC',
      'SCIM auto-provisioning',
      'IP allow-list & device trust',
      'Audit log immutable 7 tahun',
    ],
  },
  {
    icon: Layers,
    title: 'Multi-tenant untuk grup usaha',
    desc: 'Satu kontrak induk, banyak anak perusahaan. Setiap entitas punya branding, kebijakan, dan tim sendiri — tetap dalam satu dashboard induk.',
    points: [
      'Hierarki tenant tak terbatas',
      'Branding per anak usaha',
      'Konsolidasi laporan grup',
      'Pemisahan data tegas (RLS)',
    ],
  },
  {
    icon: Gauge,
    title: 'Skala & performa',
    desc: 'Diuji untuk 500.000+ pelamar/bulan dan ribuan rekruter aktif. Auto-scaling, CDN regional Indonesia, dan replikasi lintas zona.',
    points: [
      'P95 latency < 200ms nasional',
      'Auto-scale tanpa intervensi',
      'CDN Jakarta + Singapura',
      'Disaster recovery RPO < 5 menit',
    ],
  },
  {
    icon: Award,
    title: 'Dedicated partnership',
    desc: 'Tim sukses yang khusus untuk Anda — Customer Success Manager, Solutions Engineer, dan jalur eskalasi langsung ke engineering.',
    points: [
      'Dedicated CSM bernama',
      'Solutions Engineer on-call',
      'Kuartalan Business Review',
      'Direct line ke VP Engineering',
    ],
  },
]

export function EnterpriseCapabilities() {
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
              Empat Pilar
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="enterprise-capabilities-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Dibangun untuk skala enterprise
          </h2>
          <p className="text-muted-foreground mt-3">
            Bukan paket &ldquo;Pro plus&rdquo; — arsitektur, kontrak, dan tim yang
            berbeda dari produk SaaS biasa.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {PILLARS.map((p, i) => {
            const Icon = p.icon
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

const COMPLIANCE = [
  { label: 'ISO 27001:2022', sub: 'Information Security' },
  { label: 'SOC 2 Type II',   sub: 'Annual audit' },
  { label: 'UU PDP',          sub: 'Pelindungan Data Pribadi' },
  { label: 'PCI DSS L1',      sub: 'Payment-grade security' },
  { label: 'OWASP ASVS L3',   sub: 'App security verified' },
  { label: 'BSSN-ready',      sub: 'Lokalisasi data' },
]

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'Enkripsi menyeluruh',
    desc: 'AES-256 saat data diam, TLS 1.3 saat transit, dan envelope encryption untuk PII sensitif.',
  },
  {
    icon: KeyRound,
    title: 'Manajemen identitas',
    desc: 'SSO SAML/OIDC, SCIM, MFA wajib, session management, dan device trust.',
  },
  {
    icon: Database,
    title: 'Residensi data Indonesia',
    desc: 'Seluruh data tersimpan di data center berlokasi di Indonesia dengan replikasi cross-zone.',
  },
  {
    icon: FileCheck,
    title: 'Audit log lengkap',
    desc: 'Setiap aksi tercatat dengan timestamp, IP, user, dan diff — diretensi 7 tahun tanpa modifikasi.',
  },
  {
    icon: Cloud,
    title: 'Opsi deployment',
    desc: 'Public cloud (default), single-tenant VPC, atau on-premise untuk industri terregulasi.',
  },
  {
    icon: Workflow,
    title: 'Incident response',
    desc: 'SLA notifikasi insiden 1 jam, post-mortem publik, dan kompensasi otomatis bila SLA terlewat.',
  },
]

export function EnterpriseSecurity() {
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
              Keamanan & Kepatuhan
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="enterprise-security-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Sertifikasi yang Anda butuhkan
          </h2>
          <p className="text-muted-foreground mt-3">
            Diperiksa oleh auditor independen setiap tahun. Dokumen tersedia
            untuk tim compliance Anda di bawah NDA.
          </p>
        </motion.div>

        {/* Compliance badges */}
        <ul className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COMPLIANCE.map((c, i) => (
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
          {SECURITY_FEATURES.map((f, i) => {
            const Icon = f.icon
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

type Phase = {
  range: string
  title: string
  bullets: string[]
  icon: React.ComponentType<{ className?: string }>
}

const PHASES: Phase[] = [
  {
    range: 'Minggu 1–2',
    title: 'Discovery & Architecture',
    icon: Network,
    bullets: [
      'Workshop dengan tim HR, IT, dan compliance Anda',
      'Pemetaan proses rekrutmen saat ini',
      'Desain arsitektur tenant & integrasi',
      'Penyusunan rencana migrasi data',
    ],
  },
  {
    range: 'Minggu 3–6',
    title: 'Konfigurasi & Integrasi',
    icon: ServerCog,
    bullets: [
      'Setup tenant induk + anak perusahaan',
      'Konfigurasi SSO, SCIM, dan policy keamanan',
      'Integrasi HRIS, payroll, ATS lama',
      'Branding & custom domain per entitas',
    ],
  },
  {
    range: 'Minggu 7–10',
    title: 'Migrasi & Pelatihan',
    icon: Users,
    bullets: [
      'Migrasi data historis (kandidat, lowongan, arsip)',
      'Pelatihan onsite untuk recruiter & admin',
      'UAT bersama tim Anda + sign-off',
      'Pelatihan train-the-trainer untuk skala internal',
    ],
  },
  {
    range: 'Minggu 11–12',
    title: 'Go-Live & Hypercare',
    icon: Sparkles,
    bullets: [
      'Soft launch dengan tim pilot',
      'Hypercare 30 hari — engineer on standby',
      'Review KPI minggu ke-2 dan ke-4',
      'Transisi ke dukungan reguler',
    ],
  },
]

export function EnterpriseImplementation() {
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
              Implementasi
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="enterprise-impl-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Dari kickoff sampai go-live dalam 90 hari
          </h2>
          <p className="text-muted-foreground mt-3">
            Metodologi yang sudah teruji di belasan grup usaha. Anda tahu apa
            yang terjadi tiap minggu — tanpa kejutan, tanpa scope creep.
          </p>
        </motion.div>

        <ol className="relative space-y-6">
          <span
            aria-hidden
            className="bg-border absolute left-[22px] top-2 bottom-2 w-px"
          />
          {PHASES.map((p, i) => {
            const Icon = p.icon
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
                Studi Kasus
              </span>
            </div>
            <h2
              id="enterprise-case-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Bagaimana grup usaha multi-industri
              <br />
              menyatukan 12 anak perusahaan
            </h2>
            <p className="text-muted-foreground mt-4">
              Sebuah konglomerat dengan 12 entitas — dari perbankan, telekomunikasi,
              hingga otomotif — sebelumnya menggunakan 6 sistem ATS berbeda. Dalam
              90 hari, mereka berpindah ke satu platform RPI dengan tenant terpisah
              per entitas, tetap mempertahankan branding dan kebijakan masing-masing.
            </p>

            <blockquote className="border-l-[color:var(--ring)] my-6 border-l-2 pl-5">
              <Quote className="text-[color:var(--ring)]/30 -ml-1 h-7 w-7" aria-hidden />
              <p className="text-foreground/90 font-heading mt-2 text-base italic md:text-lg">
                &ldquo;Yang membuat RPI berbeda bukan fitur — semua vendor punya
                fitur. Yang berbeda adalah cara mereka memahami kompleksitas
                grup kami dan tetap merilis dengan kualitas mingguan.&rdquo;
              </p>
              <footer className="text-muted-foreground mt-4 text-xs">
                <strong className="text-foreground font-medium">Rina Adriani</strong>{' '}
                — Group Head of Talent Acquisition, salah satu konglomerat top-10 Indonesia
              </footer>
            </blockquote>

            <Button asChild variant="outline">
              <a href="/case-studies/group-conglomerate">
                Baca studi kasus lengkap
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </a>
            </Button>
          </div>

          {/* Right: metric cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: '6 → 1',   l: 'Sistem ATS', sub: 'Konsolidasi penuh' },
              { v: '83%',     l: 'Hemat biaya lisensi', sub: 'Tahun pertama' },
              { v: '12 hari', l: 'Waktu hire rata-rata', sub: 'Dari 31 hari' },
              { v: '4.7/5',   l: 'NPS recruiter', sub: 'Survei internal' },
            ].map((m, i) => (
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

const COMPANY_SIZES = [
  '500 – 2.000 karyawan',
  '2.000 – 10.000 karyawan',
  '10.000 – 50.000 karyawan',
  '50.000+ karyawan',
]

const INDUSTRIES = [
  'Perbankan & Keuangan',
  'Telekomunikasi',
  'Energi & Sumber Daya',
  'Otomotif & Manufaktur',
  'Consumer Goods',
  'Pemerintah / BUMN',
  'Konglomerat',
  'Lainnya',
]

export function EnterpriseContact() {
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
                Bicara dengan Sales
              </span>
            </div>
            <h2
              id="enterprise-contact-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Mari bicara tentang skala Anda
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Tim Enterprise Sales kami akan menghubungi Anda dalam 1 hari kerja
              untuk demo terstruktur dan diskusi arsitektur — tanpa komitmen.
            </p>

            <ul className="border-border mt-8 space-y-4 border-t pt-8">
              {[
                { icon: BadgeCheck, t: 'Demo terstruktur sesuai industri Anda' },
                { icon: BadgeCheck, t: 'Akses dokumen keamanan & arsitektur' },
                { icon: BadgeCheck, t: 'Estimasi biaya & ROI yang jujur' },
                { icon: BadgeCheck, t: 'Tanpa komitmen, tanpa hard sell' },
              ].map((b) => {
                const Icon = b.icon
                return (
                  <li key={b.t} className="flex items-start gap-3">
                    <Icon
                      className="text-[color:var(--ring)] mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden
                    />
                    <span className="text-foreground/85 text-sm">{b.t}</span>
                  </li>
                )
              })}
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
                    Kantor Enterprise Sales
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Jakarta Selatan, Indonesia
                  </div>
                </div>
              </div>
              <div className="text-muted-foreground mt-4 grid grid-cols-1 gap-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  Menara Standard Chartered Lt. 21, Jakarta
                </span>
                <span className="inline-flex items-center gap-2">
                  <Send className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  enterprise@rumahpekerja.id
                </span>
                <span className="inline-flex items-center gap-2">
                  <Star className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  +62 21 5000 1010
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
              <Field label="Nama lengkap" htmlFor="ent-name" required>
                <Input id="ent-name" name="name" autoComplete="name" required />
              </Field>
              <Field label="Jabatan" htmlFor="ent-title" required>
                <Input
                  id="ent-title"
                  name="title"
                  placeholder="contoh: Head of Talent"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email kerja" htmlFor="ent-email" required>
                <Input
                  id="ent-email"
                  name="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label="Telepon" htmlFor="ent-phone">
                <Input
                  id="ent-phone"
                  name="phone"
                  type="tel"
                  placeholder="+62 ..."
                  autoComplete="tel"
                />
              </Field>
            </div>

            <Field label="Nama perusahaan" htmlFor="ent-company" required>
              <Input id="ent-company" name="company" required />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Ukuran perusahaan" htmlFor="ent-size" required>
                <select
                  id="ent-size"
                  name="size"
                  required
                  defaultValue=""
                  className="border-border bg-background text-foreground focus-visible:ring-ring/40 flex h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="" disabled>Pilih ukuran</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Industri" htmlFor="ent-industry" required>
                <select
                  id="ent-industry"
                  name="industry"
                  required
                  defaultValue=""
                  className="border-border bg-background text-foreground focus-visible:ring-ring/40 flex h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="" disabled>Pilih industri</option>
                  {INDUSTRIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Apa yang ingin Anda capai?" htmlFor="ent-message">
              <Textarea
                id="ent-message"
                name="message"
                rows={5}
                placeholder="Ceritakan situasi rekrutmen Anda saat ini, sistem yang sudah dipakai, dan apa yang ingin diubah…"
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
                Saya menyetujui{' '}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2"
                >
                  Kebijakan Privasi
                </a>{' '}
                dan pemrosesan data untuk keperluan korespondensi sales.
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full">
              Kirim Permintaan Demo
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
