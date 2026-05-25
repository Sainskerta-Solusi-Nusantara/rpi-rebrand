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

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function LegalHero() {
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
          Kembali ke Tentang Kami
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
            Legal & Kepatuhan
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="legal-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Transparansi adalah{' '}
          <span className="text-[color:var(--ring)]">kewajiban</span>.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Semua informasi entitas hukum, kepatuhan regulasi, dokumen legal,
          dan kontak tim hukum kami — di satu halaman, terus diperbarui.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Terdaftar legal sejak 2021
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            ISO 27001 & SOC 2 Type II
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Patuh UU PDP & GDPR
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

const ENTITY_FACTS: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
  { icon: Building2, label: 'Nama Perusahaan', value: 'PT Rumah Pekerja Indonesia' },
  { icon: ScrollText, label: 'Bentuk Hukum', value: 'Perseroan Terbatas (Tertutup)' },
  { icon: Landmark, label: 'Akta Pendirian', value: 'No. 24, 17 Agustus 2021 — Notaris Rini Setiawati, S.H., M.Kn.' },
  { icon: Receipt, label: 'NPWP', value: '91.234.567.8-073.000' },
  { icon: FileText, label: 'NIB (OSS)', value: '8120020410012' },
  { icon: BadgeCheck, label: 'SIUP', value: 'No. 503/4521/PB/2021' },
  { icon: Gavel, label: 'TDP', value: '09.03.1.62.04521' },
  { icon: Globe, label: 'KBLI', value: '63122 (Portal Web/Platform Digital)' },
]

export function LegalEntity() {
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
              Entitas Hukum
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="legal-entity-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Siapa kami secara hukum
          </h2>
          <p className="text-muted-foreground mt-3">
            PT Rumah Pekerja Indonesia adalah perusahaan terdaftar di
            Indonesia, terverifikasi OSS, dan tunduk pada hukum perdata dan
            ketenagakerjaan RI.
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
                <MapPin className="inline h-3.5 w-3.5" aria-hidden /> Alamat Hukum
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
                <Globe className="inline h-3.5 w-3.5" aria-hidden /> Domain Resmi
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <span className="text-foreground font-medium">
                    rumahpekerja.id
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    — domain utama
                  </span>
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    rpi.co.id
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    — domain alternatif
                  </span>
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    rumahpekerjaindonesia.com
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    — domain redirect
                  </span>
                </li>
              </ul>
              <p className="text-muted-foreground border-border mt-4 border-t pt-3 text-xs">
                Email atau komunikasi yang mengaku-aku dari RPI tetapi tidak
                berasal dari domain di atas <strong>bukan</strong> komunikasi
                resmi.
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

const STANDARDS: Standard[] = [
  {
    acronym: 'ISO 27001:2022',
    full: 'Information Security Management Systems',
    status: 'aktif',
    desc: 'Sistem manajemen keamanan informasi tersertifikasi. Audit ulang setiap 12 bulan.',
    auditor: 'BSI Group · sertifikat aktif hingga Q3 2027',
  },
  {
    acronym: 'SOC 2 Type II',
    full: 'Service Organization Control 2',
    status: 'aktif',
    desc: 'Kontrol keamanan, ketersediaan, integritas pemrosesan, kerahasiaan, dan privasi.',
    auditor: 'Deloitte · laporan terbaru: Februari 2026',
  },
  {
    acronym: 'UU PDP',
    full: 'Pelindungan Data Pribadi (UU No. 27/2022)',
    status: 'aktif',
    desc: 'Patuh penuh terhadap UU Pelindungan Data Pribadi Indonesia. DPO tersedia untuk pertanyaan subject.',
  },
  {
    acronym: 'GDPR',
    full: 'General Data Protection Regulation (EU)',
    status: 'aktif',
    desc: 'Untuk pengguna dari Uni Eropa: hak akses, koreksi, penghapusan, dan portabilitas data.',
  },
  {
    acronym: 'PCI DSS L1',
    full: 'Payment Card Industry Data Security Standard',
    status: 'aktif',
    desc: 'Untuk pemrosesan pembayaran mitra dan layanan premium. Validasi setiap 12 bulan.',
  },
  {
    acronym: 'OWASP ASVS L3',
    full: 'Application Security Verification Standard',
    status: 'aktif',
    desc: 'Standar verifikasi keamanan aplikasi level tertinggi untuk aplikasi yang menangani data sensitif.',
  },
  {
    acronym: 'BSSN-ready',
    full: 'Badan Siber dan Sandi Negara — Lokalisasi Data',
    status: 'aktif',
    desc: 'Seluruh data pengguna Indonesia disimpan di data center berlokasi di wilayah RI.',
  },
  {
    acronym: 'ISO 27701',
    full: 'Privacy Information Management',
    status: 'persiapan',
    desc: 'Ekstensi ISO 27001 untuk manajemen informasi privasi. Target sertifikasi Q4 2026.',
  },
]

export function LegalCompliance() {
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
              Kepatuhan Regulasi
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="legal-compliance-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Standar yang kami patuhi
          </h2>
          <p className="text-muted-foreground mt-3">
            Diaudit oleh pihak ketiga independen setiap tahun. Laporan tersedia
            untuk tim compliance Anda atas permintaan, di bawah NDA.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {STANDARDS.map((s, i) => (
            <motion.article
              key={s.acronym}
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
                      {s.acronym}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {s.full}
                  </p>
                </div>
                <span
                  className={
                    s.status === 'aktif'
                      ? 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600'
                      : 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600'
                  }
                >
                  <span
                    aria-hidden
                    className={
                      s.status === 'aktif'
                        ? 'size-1.5 rounded-full bg-emerald-500'
                        : 'size-1.5 rounded-full bg-amber-500'
                    }
                  />
                  {s.status === 'aktif' ? 'Aktif' : 'Persiapan'}
                </span>
              </div>
              <p className="text-foreground/85 mt-4 text-sm leading-relaxed">
                {s.desc}
              </p>
              {s.auditor && (
                <p className="border-border text-muted-foreground mt-4 border-t pt-3 text-xs">
                  <span className="text-foreground/70 font-medium">Auditor:</span>{' '}
                  {s.auditor}
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

const DOCS: LegalDoc[] = [
  {
    icon: ScrollText,
    title: 'Syarat & Ketentuan',
    desc: 'Aturan penggunaan platform untuk pencari kerja dan pengguna umum.',
    lastUpdated: 'Diperbarui 1 Mei 2026',
    href: '/terms',
  },
  {
    icon: Lock,
    title: 'Kebijakan Privasi',
    desc: 'Bagaimana kami mengumpulkan, memproses, menyimpan, dan melindungi data Anda.',
    lastUpdated: 'Diperbarui 1 Mei 2026',
    href: '/privacy',
  },
  {
    icon: Cookie,
    title: 'Kebijakan Cookie',
    desc: 'Jenis cookie yang kami gunakan dan cara mengontrolnya di perangkat Anda.',
    lastUpdated: 'Diperbarui 1 Mei 2026',
    href: '/cookies',
  },
  {
    icon: FileText,
    title: 'Acceptable Use Policy',
    desc: 'Perilaku yang diizinkan dan dilarang di platform, untuk pengguna dan mitra.',
    lastUpdated: 'Diperbarui 14 April 2026',
    href: '/legal/aup',
  },
  {
    icon: Shield,
    title: 'Data Processing Addendum',
    desc: 'DPA standar untuk mitra perekrut tier Business dan Enterprise (GDPR & UU PDP).',
    lastUpdated: 'Diperbarui 14 April 2026',
    href: '/legal/dpa',
  },
  {
    icon: BadgeCheck,
    title: 'Service Level Agreement',
    desc: 'Jaminan uptime, respons insiden, dan kompensasi otomatis untuk paket Enterprise.',
    lastUpdated: 'Diperbarui 14 April 2026',
    href: '/legal/sla',
  },
  {
    icon: Newspaper,
    title: 'Master Subscription Agreement',
    desc: 'Kontrak induk untuk pelanggan Business dan Enterprise, termasuk lampiran teknis.',
    lastUpdated: 'Diperbarui 1 Maret 2026',
    href: '/legal/msa',
  },
  {
    icon: Receipt,
    title: 'Pajak & Penagihan',
    desc: 'Informasi PPN 11%, format faktur pajak, dan kebijakan refund.',
    lastUpdated: 'Diperbarui 1 Maret 2026',
    href: '/legal/billing',
  },
]

export function LegalDocuments() {
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
              Dokumen Legal
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="legal-docs-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Kontrak & kebijakan
          </h2>
          <p className="text-muted-foreground mt-3">
            Semua dokumen ditulis dalam Bahasa Indonesia, dengan versi Inggris
            tersedia untuk dokumen B2B. Riwayat perubahan dipertahankan dan
            dapat diakses atas permintaan.
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
              Hak Kekayaan Intelektual
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="legal-ip-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Merek dagang & hak cipta
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="border-border bg-card rounded-2xl border p-6">
            <Copyright
              className="text-[color:var(--ring)] h-6 w-6"
              aria-hidden
            />
            <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
              Hak Cipta
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              © 2021–2026 PT Rumah Pekerja Indonesia. Semua hak dilindungi.
              Konten platform, kode sumber, materi pelatihan, dan publikasi
              riset dilindungi UU Hak Cipta No. 28/2014.
            </p>
            <p className="text-muted-foreground/80 mt-3 text-xs">
              Untuk permintaan izin penggunaan ulang, hubungi tim legal di
              bawah.
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <BadgeCheck
              className="text-[color:var(--ring)] h-6 w-6"
              aria-hidden
            />
            <h3 className="font-heading text-foreground mt-4 text-base font-semibold">
              Merek Dagang Terdaftar
            </h3>
            <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
              <li>
                <strong className="text-foreground font-medium">
                  Rumah Pekerja Indonesia®
                </strong>{' '}
                · DJKI No. IDM000789012
              </li>
              <li>
                <strong className="text-foreground font-medium">RPI®</strong>{' '}
                · DJKI No. IDM000789015
              </li>
              <li>
                <strong className="text-foreground font-medium">
                  RPI Academy™
                </strong>{' '}
                · pending registrasi
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
              Penggunaan Brand & Logo
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Jurnalis, mitra, dan pengguna dipersilakan menggunakan logo dan
              nama RPI untuk peliputan, integrasi resmi, atau halaman case
              study, sesuai dengan brand guidelines kami.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <a href="/press-kit/RPI-Brand-Guidelines.pdf">
                  Brand Guidelines PDF
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/press-kit/RPI-Logo-Pack.zip">
                  Logo Pack ZIP
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

const DISCLOSURES: DisclosureItem[] = [
  {
    icon: Bug,
    title: 'Vulnerability Disclosure Program',
    desc: 'Temuan kerentanan keamanan dapat dilaporkan via security@. Bounty hingga USD 10K untuk kerentanan kritis.',
    cta: { label: 'security@rumahpekerja.id', href: 'mailto:security@rumahpekerja.id' },
  },
  {
    icon: AlertTriangle,
    title: 'Laporan Insiden Keamanan',
    desc: 'Notifikasi insiden publik dipublikasikan di status.rumahpekerja.id, plus laporan post-mortem dalam 5 hari kerja.',
    cta: { label: 'status.rumahpekerja.id', href: 'https://status.rumahpekerja.id' },
  },
  {
    icon: FileText,
    title: 'Laporan Transparansi Tahunan',
    desc: 'Statistik permintaan data dari penegak hukum, takedown notice, dan moderasi konten — dipublikasikan setiap Maret.',
    cta: { label: 'Lihat Laporan 2025', href: '/legal/transparency-2025' },
  },
  {
    icon: Newspaper,
    title: 'Audit Bias AI',
    desc: 'Sistem matching AI kami diaudit independen setiap 6 bulan untuk bias gender, usia, dan asal sekolah.',
    cta: { label: 'Audit Bias 2026', href: '/legal/bias-audit-2026' },
  },
]

export function LegalDisclosure() {
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
              Disclosure & Laporan
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="legal-disclosure-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Komitmen transparansi
          </h2>
          <p className="text-muted-foreground mt-3">
            Kami mempublikasikan laporan rutin tentang insiden, audit, dan
            permintaan data — karena akuntabilitas tidak boleh hanya saat
            ditanya.
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

const LEGAL_CONTACTS = [
  {
    label: 'Pertanyaan Umum Hukum',
    email: 'legal@rumahpekerja.id',
    desc: 'Untuk pertanyaan kontrak, lisensi, atau kemitraan hukum.',
  },
  {
    label: 'Privasi & Data Subject',
    email: 'privacy@rumahpekerja.id',
    desc: 'Akses, koreksi, atau penghapusan data pribadi Anda. DPO membalas dalam 30 hari kerja sesuai UU PDP.',
  },
  {
    label: 'Permintaan Penegak Hukum',
    email: 'lawenforcement@rumahpekerja.id',
    desc: 'Subpoena dan permintaan resmi dari penegak hukum dengan dokumentasi lengkap.',
  },
  {
    label: 'Keamanan',
    email: 'security@rumahpekerja.id',
    desc: 'Laporan kerentanan dan insiden keamanan. PGP key tersedia atas permintaan.',
  },
]

export function LegalContact() {
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
                Tim Hukum
              </span>
            </div>
            <h2
              id="legal-contact-heading"
              className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Hubungi tim hukum kami
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-base">
              Tim legal RPI dipimpin oleh in-house counsel dengan dukungan
              kantor hukum independen untuk litigasi atau penanganan kasus
              kompleks. Respons rata-rata 2 hari kerja.
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
                Untuk subpoena atau dokumen pengadilan resmi, kirim ke alamat
                hukum di atas, perhatian: <em>Legal Department</em>.
              </span>
              <Button asChild variant="outline" size="sm">
                <a href="mailto:legal@rumahpekerja.id">
                  Email Tim Legal
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
