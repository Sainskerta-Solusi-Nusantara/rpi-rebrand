'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Code,
  Compass,
  Eye,
  GraduationCap,
  HandshakeIcon,
  Heart,
  HeartHandshake,
  LifeBuoy,
  Linkedin,
  MapPin,
  Megaphone,
  PenTool,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
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

export function TimHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="tim-hero-heading"
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
            Tim Kami
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="tim-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          120 orang. Satu{' '}
          <span className="text-[color:var(--ring)]">misi</span>.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Kami adalah engineer, designer, product manager, peneliti, dan
          marketer — tersebar di 6 kota — yang membangun infrastruktur kerja
          yang adil untuk Indonesia.
        </motion.p>

        <motion.dl
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {[
            { v: '120', l: 'Anggota tim' },
            { v: '8', l: 'Tim fungsional' },
            { v: '6', l: 'Kota di Indonesia' },
            { v: '4.8/5', l: 'Skor karyawan' },
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
// Leadership
// ---------------------------------------------------------------------------

type Leader = {
  name: string
  role: string
  bio: string
  initial: string
  color: string
  background: string
  linkedin: string
}

const LEADERSHIP: Leader[] = [
  {
    name: 'Arif Wibowo',
    role: 'Co-Founder & CEO',
    bio: 'Memimpin SSN sejak 2021 dengan misi membangun infrastruktur kerja yang adil untuk Indonesia. Bertanggung jawab atas strategi, fundraising, dan kemitraan strategis.',
    initial: 'AW',
    color: '#0A2540',
    background: 'Eks-VP Product Tokopedia · MBA Stanford GSB · S1 Teknik ITB',
    linkedin: 'arif-wibowo',
  },
  {
    name: 'Siti Nurhasanah',
    role: 'Co-Founder & CTO',
    bio: 'Memimpin engineering 38 orang yang menjalankan platform multi-tenant skala besar. Memprioritaskan reliability, security, dan kecepatan rilis.',
    initial: 'SN',
    color: '#635BFF',
    background: 'Eks-Staff Engineer Stripe · S2 Computer Science Carnegie Mellon · S1 IT Bandung',
    linkedin: 'siti-nurhasanah',
  },
  {
    name: 'Daniel Setiawan',
    role: 'Chief Operating Officer',
    bio: 'Mengelola operasi SSN di 6 kota dan kemitraan strategis nasional. Fokus pada eksekusi yang ketat dan pertumbuhan yang sehat.',
    initial: 'DS',
    color: '#10B981',
    background: 'Eks-Director Operations Gojek · MBA INSEAD · S1 Industrial Engineering UI',
    linkedin: 'daniel-setiawan',
  },
  {
    name: 'Maya Pratiwi',
    role: 'VP Communications',
    bio: 'Memimpin hubungan media, riset publik, dan brand. Sebelumnya jurnalis dan pemimpin redaksi sebelum pindah ke komunikasi korporasi.',
    initial: 'MP',
    color: '#EC4899',
    background: 'Eks-Head of Comms Gojek · Eks-Jurnalis Kompas · S2 Communications LSE',
    linkedin: 'maya-pratiwi',
  },
  {
    name: 'Rendra Wijaksana',
    role: 'VP Product',
    bio: 'Memimpin 9 product manager yang membentuk roadmap consumer app, partner dashboard, dan LMS. Penggemar craftsmanship dan eksperimen yang ketat.',
    initial: 'RW',
    color: '#F59E0B',
    background: 'Eks-Group PM Bukalapak · S2 HCI Carnegie Mellon · S1 Informatika UGM',
    linkedin: 'rendra-wijaksana',
  },
  {
    name: 'Anya Kusumawardhani',
    role: 'VP People',
    bio: 'Mengelola talent acquisition, learning & development, dan budaya untuk seluruh perusahaan. Penjaga standar hiring yang tinggi.',
    initial: 'AK',
    color: '#0EA5E9',
    background: 'Eks-Head of People Traveloka · Sertifikasi SHRM-SCP · S1 Psikologi UGM',
    linkedin: 'anya-kusumawardhani',
  },
]

export function TimLeadership() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="tim-leadership-heading"
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
              Tim Eksekutif
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="tim-leadership-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Yang memimpin SSN
          </h2>
          <p className="text-muted-foreground mt-3">
            Enam pemimpin dengan latar belakang yang beragam — eks-Stripe,
            Gojek, Tokopedia, dan Traveloka — disatukan oleh keyakinan bahwa
            kerja di Indonesia layak mendapat platform yang lebih baik.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LEADERSHIP.map((l, i) => (
            <motion.article
              key={l.name}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="border-border bg-card hover:border-[color:var(--ring)]/50 flex h-full flex-col rounded-2xl border p-6 transition"
            >
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="font-heading grid size-16 shrink-0 place-items-center rounded-full text-xl font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${l.color} 0%, color-mix(in oklab, ${l.color} 70%, black) 100%)`,
                  }}
                >
                  {l.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-foreground text-base font-semibold">
                    {l.name}
                  </h3>
                  <p className="text-[color:var(--ring)] mt-0.5 text-[10px] font-medium uppercase tracking-wider">
                    {l.role}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {l.bio}
              </p>
              <p className="border-border text-muted-foreground mt-4 border-t pt-4 text-xs leading-relaxed">
                <span className="text-foreground/70 font-medium">Latar belakang:</span>{' '}
                {l.background}
              </p>
              <a
                href={`https://linkedin.com/in/${l.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-[color:var(--ring)] mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium transition"
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden />
                LinkedIn
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

type Department = {
  icon: React.ComponentType<{ className?: string }>
  name: string
  size: number
  color: string
  lead: { name: string; role: string; initial: string }
  desc: string
}

const DEPARTMENTS: Department[] = [
  {
    icon: Code,
    name: 'Engineering',
    size: 38,
    color: '#635BFF',
    lead: { name: 'Siti Nurhasanah', role: 'CTO', initial: 'SN' },
    desc: 'Platform, web, mobile, dan SRE — menjalankan infrastruktur untuk 2.4 juta pengguna aktif.',
  },
  {
    icon: PenTool,
    name: 'Design',
    size: 8,
    color: '#EC4899',
    lead: { name: 'Citra Lestari', role: 'Head of Design', initial: 'CL' },
    desc: 'Product design dan brand design — membentuk pengalaman dari research hingga design system.',
  },
  {
    icon: Compass,
    name: 'Product',
    size: 9,
    color: '#0EA5E9',
    lead: { name: 'Rendra Wijaksana', role: 'VP Product', initial: 'RW' },
    desc: 'PM untuk talent app, partner dashboard, dan LMS — fokus pada outcome terukur dan eksperimen.',
  },
  {
    icon: Megaphone,
    name: 'Marketing',
    size: 12,
    color: '#F59E0B',
    lead: { name: 'Dewi Anggraini', role: 'Head of Marketing', initial: 'DA' },
    desc: 'Lifecycle, content, performance, dan brand — membangun mesin growth berkelanjutan.',
  },
  {
    icon: HandshakeIcon,
    name: 'Partnership',
    size: 14,
    color: '#10B981',
    lead: { name: 'Indra Kusuma', role: 'Head of Partnership', initial: 'IK' },
    desc: 'Account executive dan customer success — menumbuhkan portofolio 12.000+ mitra perekrut.',
  },
  {
    icon: LifeBuoy,
    name: 'Support',
    size: 18,
    color: '#EF4444',
    lead: { name: 'Hana Putri', role: 'Head of Support', initial: 'HP' },
    desc: 'Frontline untuk pengguna pencari kerja dan mitra — sumber utama insight produk.',
  },
  {
    icon: BookOpen,
    name: 'Academy',
    size: 10,
    color: '#8B5CF6',
    lead: { name: 'Eko Pratama', role: 'Head of Academy', initial: 'EP' },
    desc: 'Curriculum design dan instructor relations — mengoperasikan SSN Academy dengan 60+ kursus.',
  },
  {
    icon: TrendingUp,
    name: 'Operations',
    size: 11,
    color: '#06B6D4',
    lead: { name: 'Daniel Setiawan', role: 'COO', initial: 'DS' },
    desc: 'Data analytics, finance, legal, dan facilities — menjaga eksekusi yang tertib.',
  },
]

export function TimDepartments() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="tim-dept-heading"
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
              Tim Fungsional
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="tim-dept-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Delapan tim, satu organisme
          </h2>
          <p className="text-muted-foreground mt-3">
            Setiap tim memiliki scope yang jelas, lead yang bertanggung jawab,
            dan budaya kerja yang konsisten dengan principles perusahaan.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {DEPARTMENTS.map((d, i) => {
            const Icon = d.icon
            return (
              <motion.article
                key={d.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.03 * i }}
                className="border-border bg-card hover:border-[color:var(--ring)]/50 flex h-full gap-5 rounded-2xl border p-6 transition"
              >
                <span
                  aria-hidden
                  className="grid size-14 shrink-0 place-items-center rounded-2xl"
                  style={{
                    background: `color-mix(in oklab, ${d.color} 12%, transparent)`,
                    color: d.color,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-heading text-foreground text-lg font-semibold">
                      {d.name}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {d.size} orang
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {d.desc}
                  </p>
                  <div className="border-border text-muted-foreground mt-4 flex items-center gap-2.5 border-t pt-3 text-xs">
                    <span
                      aria-hidden
                      className="font-heading grid size-7 place-items-center rounded-full text-[10px] font-semibold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${d.color} 0%, color-mix(in oklab, ${d.color} 70%, black) 100%)`,
                      }}
                    >
                      {d.lead.initial}
                    </span>
                    <span>
                      Dipimpin{' '}
                      <strong className="text-foreground/80 font-medium">
                        {d.lead.name}
                      </strong>{' '}
                      · {d.lead.role}
                    </span>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Working Principles
// ---------------------------------------------------------------------------

const PRINCIPLES = [
  {
    icon: Target,
    title: 'Pekerja Indonesia first',
    desc: 'Setiap keputusan diuji dengan satu pertanyaan: apakah ini benar-benar membantu pencari kerja? Jika tidak, kami batalkan.',
  },
  {
    icon: Sparkles,
    title: 'Tunjukkan, jangan ceritakan',
    desc: 'Kami mengukur dari hasil, bukan jam atau slide deck. Ide kecil yang dikirim mengalahkan ide besar yang tertunda.',
  },
  {
    icon: ShieldCheck,
    title: 'Disagree and commit',
    desc: 'Setiap suara didengar. Setelah keputusan diambil, kita pergi bersama. Tidak ada politik koridor setelah meeting.',
  },
  {
    icon: Eye,
    title: 'Transparency by default',
    desc: 'Gaji range terbuka, OKR perusahaan publik internal, post-mortem dibagikan ke seluruh tim. Default kami: terbuka.',
  },
  {
    icon: Heart,
    title: 'Care for craft',
    desc: 'Kami merawat kode, dokumen, dan eksperimen. Kerapian bukan obsesi — kerapian adalah hormat kepada rekan dan masa depan kita sendiri.',
  },
  {
    icon: HeartHandshake,
    title: 'Trust, then verify',
    desc: 'Kami memberi kepercayaan di awal, dengan akuntabilitas yang jelas. Kerja remote, cuti, dan budget belajar — semua trust-based.',
  },
]

export function TimPrinciples() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="tim-principles-heading"
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
              Working Principles
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="tim-principles-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Cara kami bekerja
          </h2>
          <p className="text-muted-foreground mt-3">
            Enam prinsip yang dipraktikkan setiap hari — bukan poster di
            dinding, tetapi keputusan yang dibuat tiap minggu.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.04 * i }}
                className="border-border relative overflow-hidden rounded-2xl border p-6"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, color-mix(in oklab, var(--ring) 70%, transparent), transparent)',
                  }}
                />
                <Icon
                  className="text-[color:var(--ring)] mb-4 h-6 w-6"
                  aria-hidden
                />
                <h3 className="font-heading text-foreground text-base font-semibold">
                  {p.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {p.desc}
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
// Advisors & Investors
// ---------------------------------------------------------------------------

type Advisor = {
  name: string
  role: string
  initial: string
  color: string
}

const ADVISORS: Advisor[] = [
  { name: 'Willson Cuaca',     role: 'Managing Partner, East Ventures',  initial: 'WC', color: '#10B981' },
  { name: 'Patrick Walujo',    role: 'CEO, GoTo Group',                  initial: 'PW', color: '#0A2540' },
  { name: 'Rudiantara',        role: 'Eks-Menteri Komunikasi & Informatika', initial: 'R',  color: '#F59E0B' },
  { name: 'Adamas Belva',      role: 'Founder, Ruangguru',               initial: 'AB', color: '#EC4899' },
  { name: 'Najwa Shihab',      role: 'Founder, Narasi',                  initial: 'NS', color: '#0EA5E9' },
  { name: 'Dr. Berly Martawardaya', role: 'Direktur Riset, INDEF',       initial: 'BM', color: '#8B5CF6' },
]

export function TimAdvisors() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="tim-advisors-heading"
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
              Advisor & Board
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="tim-advisors-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Yang membimbing kami
          </h2>
          <p className="text-muted-foreground mt-3">
            Praktisi industri, pemimpin organisasi besar, dan peneliti yang
            membantu kami berpikir lebih jauh dari quarter berikutnya.
          </p>
        </motion.div>

        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {ADVISORS.map((a, i) => (
            <motion.li
              key={a.name}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.03 * i }}
              className="border-border bg-card flex items-center gap-4 rounded-xl border p-4"
            >
              <span
                aria-hidden
                className="font-heading grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${a.color} 0%, color-mix(in oklab, ${a.color} 70%, black) 100%)`,
                }}
              >
                {a.initial}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-heading text-foreground truncate text-sm font-semibold">
                  {a.name}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {a.role}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Open Roles CTA
// ---------------------------------------------------------------------------

export function TimOpenRoles() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="tim-open-heading"
    >
      <div className="container mx-auto w-full max-w-5xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="border-border bg-card relative overflow-hidden rounded-3xl border p-10 md:p-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-60"
            style={{
              background:
                'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 18%, transparent), transparent)',
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Mau bergabung?
                </span>
              </div>
              <h2
                id="tim-open-heading"
                className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl"
              >
                Kami membuka 15 posisi.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl text-base">
                Engineering, Product, Design, Marketing, Partnership — semua
                tim sedang scaling. Lihat detail peran, gaji range, dan tim
                yang akan Anda kerjakan.
              </p>

              <ul className="mt-7 space-y-2 text-sm">
                {[
                  { label: 'Gaji kompetitif + equity untuk semua', icon: Sparkles },
                  { label: 'Hybrid 2-3 hari atau full-remote', icon: MapPin },
                  { label: 'Anggaran belajar Rp 12 juta/tahun', icon: GraduationCap },
                  { label: 'Proses 2-4 minggu, transparan', icon: Award },
                ].map((b) => {
                  const Icon = b.icon
                  return (
                    <li
                      key={b.label}
                      className="text-foreground/85 flex items-center gap-2.5"
                    >
                      <Icon
                        className="text-[color:var(--ring)] h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span>{b.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg">
                <Link href="/careers">
                  <Briefcase className="mr-2 h-4 w-4" aria-hidden />
                  Lihat Posisi
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:careers@pekerja.sainskerta.net">
                  <Users className="mr-2 h-4 w-4" aria-hidden />
                  Hubungi Recruiter
                </a>
              </Button>
            </div>
          </div>

          {/* Bottom quote */}
          <div className="border-border relative mt-10 border-t pt-8">
            <Quote className="text-[color:var(--ring)]/30 -ml-1 h-7 w-7" aria-hidden />
            <p className="text-foreground/90 font-heading mt-2 max-w-3xl text-base italic leading-relaxed md:text-lg">
              &ldquo;Kami merekrut pelan dengan standar tinggi — tapi sekali Anda
              di dalam, Anda dapat kepercayaan penuh untuk membuat dampak.
              Bukan kebalikannya.&rdquo;
            </p>
            <footer className="text-muted-foreground mt-3 text-xs">
              — Anya Kusumawardhani, VP People SSN
            </footer>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
