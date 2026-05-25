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
  X,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { cn } from '@/lib/utils'

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
            Harga & Paket
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="pricing-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Harga yang{' '}
          <span className="text-[color:var(--ring)]">transparan</span>.
          <br />
          Tanpa kejutan di akhir bulan.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Mulai gratis selama Anda butuh. Naik ke paket berbayar saat tim
          rekrutmen Anda tumbuh — pembatalan dalam satu klik, tanpa kontrak
          mengikat.
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
            Aman & terenkripsi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Tanpa biaya setup
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Batalkan kapan saja
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
  return (
    <div
      role="tablist"
      aria-label="Periode penagihan"
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
        Bulanan
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
        Tahunan
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
            billing === 'yearly'
              ? 'bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
              : 'bg-[color:var(--ring)]/15 text-[color:var(--ring)]',
          )}
        >
          HEMAT 20%
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

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    tagline: 'Untuk mencoba & UMKM kecil',
    monthly: 0,
    yearly: 0,
    cta: 'Mulai Gratis',
    href: '/register?plan=free',
    icon: Zap,
    features: [
      '1 lowongan aktif',
      'Hingga 50 pelamar per bulan',
      'Subdomain RPI (kerja.rumahpekerja.id)',
      'ATS Kanban dasar',
      '1 anggota tim',
      'Dukungan email (3 hari kerja)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Untuk tim rekrutmen yang tumbuh',
    monthly: 1_490_000,
    yearly: 1_192_000,
    cta: 'Mulai Trial 14 Hari',
    href: '/register?plan=pro',
    icon: Star,
    features: [
      '10 lowongan aktif',
      'Hingga 1.000 pelamar per bulan',
      'Custom subdomain (karir.perusahaan.com)',
      'Branding logo & warna',
      'ATS Kanban + automasi dasar',
      '5 anggota tim',
      'Dukungan email & chat (1 hari kerja)',
      'Akses Talent Pool RPI',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Pilihan paling populer',
    monthly: 4_990_000,
    yearly: 3_992_000,
    cta: 'Mulai Trial 14 Hari',
    href: '/register?plan=business',
    icon: Sparkles,
    highlight: true,
    badge: 'Paling Populer',
    features: [
      'Lowongan tak terbatas',
      'Hingga 10.000 pelamar per bulan',
      'Custom domain & full branding',
      'ATS lengkap + automasi lanjutan',
      'Tim tak terbatas + role-based access',
      'Integrasi LinkedIn, JobStreet, Email',
      'Dashboard analytics & laporan kustom',
      'Dukungan prioritas (4 jam respons)',
      'Akses Premium Talent Pool',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Untuk perusahaan & grup',
    monthly: 'custom',
    yearly: 'custom',
    cta: 'Hubungi Sales',
    href: '/contact?topic=enterprise',
    icon: Server,
    features: [
      'Semua fitur Business, plus:',
      'SSO (SAML / OIDC) & SCIM provisioning',
      'SLA 99.9% dengan kredit otomatis',
      'Dedicated Customer Success Manager',
      'On-premise atau private cloud opsi',
      'Kontrak khusus & SOW kustom',
      'Pelatihan onboarding di tempat',
      'Multi-tenant untuk grup usaha',
      'Integrasi API tanpa batas',
    ],
  },
]

function PlansGrid() {
  const { billing } = React.useContext(BillingContext)
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
        Harga belum termasuk PPN 11%. Pembayaran dengan kartu kredit, transfer
        bank, atau virtual account.
      </p>
    </div>
  )
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
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
              Kustom
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Sesuai skala & kebutuhan
            </p>
          </div>
        ) : isFree ? (
          <div>
            <div className="font-heading text-foreground text-4xl font-semibold tracking-tight">
              Rp 0
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Selamanya</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground text-sm">Rp</span>
              <span className="font-heading text-foreground text-4xl font-semibold tracking-tight">
                {(price as number).toLocaleString('id-ID')}
              </span>
              <span className="text-muted-foreground text-sm">/bulan</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {billing === 'yearly'
                ? `Ditagih tahunan · Rp ${((price as number) * 12).toLocaleString('id-ID')}/tahun`
                : 'Ditagih bulanan'}
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
        <Link href={plan.href}>
          {plan.cta}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
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

const COMPARE: FeatureGroup[] = [
  {
    title: 'Lowongan & Pelamar',
    rows: [
      { label: 'Lowongan aktif',          values: ['1', '10', 'Unlimited', 'Unlimited'] },
      { label: 'Pelamar / bulan',          values: ['50', '1.000', '10.000', 'Unlimited'] },
      { label: 'Distribusi multi-channel', values: [false, true, true, true] },
      { label: 'Lowongan rahasia',         values: [false, false, true, true] },
    ],
  },
  {
    title: 'Branding & Domain',
    rows: [
      { label: 'Subdomain RPI',     values: [true, true, true, true] },
      { label: 'Custom subdomain',  values: [false, true, true, true] },
      { label: 'Custom domain',     values: [false, false, true, true] },
      { label: 'Tema & warna',      values: [false, true, true, true] },
      { label: 'White-label penuh', values: [false, false, false, true] },
    ],
  },
  {
    title: 'ATS & Kolaborasi',
    rows: [
      { label: 'ATS Kanban',                  values: ['Dasar', 'Standar', 'Lengkap', 'Lengkap'] },
      { label: 'Anggota tim',                 values: ['1', '5', 'Unlimited', 'Unlimited'] },
      { label: 'Role-based access',           values: [false, false, true, true] },
      { label: 'Automasi alur kerja',         values: [false, 'Dasar', 'Lanjutan', 'Lanjutan'] },
      { label: 'Catatan & rating internal',   values: [true, true, true, true] },
    ],
  },
  {
    title: 'Integrasi & API',
    rows: [
      { label: 'Integrasi LinkedIn / JobStreet', values: [false, true, true, true] },
      { label: 'API publik',                     values: [false, false, true, true] },
      { label: 'Webhook',                        values: [false, false, true, true] },
      { label: 'SSO (SAML/OIDC)',                values: [false, false, false, true] },
      { label: 'SCIM provisioning',              values: [false, false, false, true] },
    ],
  },
  {
    title: 'Analytics & Dukungan',
    rows: [
      { label: 'Dashboard analytics',       values: [false, 'Dasar', 'Lanjutan', 'Lanjutan'] },
      { label: 'Laporan kustom',            values: [false, false, true, true] },
      { label: 'Dukungan',                  values: ['Email', 'Email + Chat', 'Prioritas', 'Dedicated CSM'] },
      { label: 'SLA',                       values: [false, false, false, '99.9%'] },
      { label: 'Onboarding di tempat',      values: [false, false, false, true] },
    ],
  },
]

export function PricingCompare() {
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
              Bandingkan Fitur
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="pricing-compare-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Apa saja yang Anda dapatkan
          </h2>
          <p className="text-muted-foreground mt-3">
            Perbandingan lengkap setiap paket. Klik kelompok untuk membuka detail.
          </p>
        </motion.div>

        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          {/* Header */}
          <div className="border-border bg-muted/40 grid grid-cols-[1.6fr_repeat(4,1fr)] border-b">
            <div className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fitur
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
            <span>{open ? 'Sembunyikan' : 'Tampilkan'} perbandingan lengkap</span>
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
                          <CellValue v={v} />
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

function CellValue({ v }: { v: Cell }) {
  if (v === true) {
    return (
      <Check
        className="text-[color:var(--ring)] h-4 w-4"
        aria-label="Termasuk"
      />
    )
  }
  if (v === false) {
    return (
      <Minus
        className="text-muted-foreground/40 h-4 w-4"
        aria-label="Tidak termasuk"
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

const ADDONS: Addon[] = [
  {
    icon: BarChart3,
    title: 'RPI Academy untuk Tenant',
    price: 'Rp 990.000 /bulan',
    desc: 'Kursus & jalur belajar internal untuk pelamar dan karyawan tenant Anda — sertifikat terverifikasi RPI.',
  },
  {
    icon: PlugZap,
    title: 'Integrasi Kustom',
    price: 'Mulai Rp 5.000.000',
    desc: 'Integrasi satu kali dengan HRIS, payroll, ATS lama, atau sistem internal Anda. Dilakukan tim teknis RPI.',
  },
  {
    icon: Headphones,
    title: 'Premium Support',
    price: 'Rp 2.490.000 /bulan',
    desc: 'Respons 1 jam, on-call engineer untuk insiden P0/P1, dan kuartalan business review dengan tim sukses.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit Keamanan',
    price: 'Rp 15.000.000 /tahun',
    desc: 'Penetrasi tahunan, laporan SOC 2-readiness, dan kebijakan keamanan kustom untuk industri terregulasi.',
  },
]

export function PricingAddons() {
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
              Add-on
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="pricing-addons-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Bangun paket sesuai kebutuhan
          </h2>
          <p className="text-muted-foreground mt-3">
            Tambah modul yang Anda perlukan tanpa harus naik tingkat ke paket
            yang lebih besar.
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

const FAQ_ITEMS = [
  {
    q: 'Bisakah saya pindah paket kapan saja?',
    a: 'Tentu. Upgrade berlaku langsung dengan prorata, downgrade berlaku di siklus penagihan berikutnya. Tidak ada penalti atau biaya tersembunyi.',
  },
  {
    q: 'Apakah ada periode trial?',
    a: 'Paket Pro dan Business memiliki trial 14 hari tanpa kartu kredit. Anda akan dapat email pengingat 3 hari sebelum trial berakhir.',
  },
  {
    q: 'Bagaimana cara pembayaran?',
    a: 'Kami menerima kartu kredit (Visa, Mastercard, JCB), transfer bank, dan virtual account dari semua bank di Indonesia. Untuk Enterprise tersedia juga invoice 30 hari.',
  },
  {
    q: 'Apakah harga sudah termasuk PPN?',
    a: 'Belum. Semua harga di atas belum termasuk PPN 11% sesuai regulasi pemerintah. Faktur pajak otomatis dikirim setiap pembayaran.',
  },
  {
    q: 'Apa yang terjadi jika kuota pelamar terlewati?',
    a: 'Kami tidak akan menonaktifkan lowongan Anda. Anda akan mendapat notifikasi dan opsi membeli paket tambahan, atau upgrade ke tingkat berikutnya.',
  },
  {
    q: 'Apakah data lowongan saya aman jika berhenti berlangganan?',
    a: 'Ya. Data Anda disimpan selama 90 hari setelah pembatalan. Anda bisa export lengkap (CSV/JSON) kapan saja dari dashboard.',
  },
  {
    q: 'Saya pencari kerja — apakah ini juga berbayar?',
    a: 'Tidak. Semua fitur untuk pencari kerja 100% gratis dan akan selalu gratis. Halaman ini khusus untuk perusahaan & mitra perekrut.',
  },
  {
    q: 'Apakah ada diskon untuk startup, nirlaba, atau pendidikan?',
    a: 'Ya. Kami punya program khusus: startup tahap awal (50% off 1 tahun), yayasan/nirlaba (gratis Business), dan institusi pendidikan (paket khusus). Hubungi sales.',
  },
]

export function PricingFAQ() {
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
              Pertanyaan tentang Harga
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="pricing-faq-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Yang sering ditanyakan
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
