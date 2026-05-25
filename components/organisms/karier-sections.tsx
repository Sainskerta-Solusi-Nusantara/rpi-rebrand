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
  Coffee,
  Compass,
  Heart,
  Laptop,
  Map,
  MessageCircle,
  Quote,
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

export function KarierHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="karier-hero-heading"
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
            Karier di RPI
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="karier-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Kerjakan{' '}
          <span className="text-[color:var(--ring)]">yang berarti</span>.
          <br />
          Untuk Indonesia.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Membangun platform yang mempertemukan jutaan pencari kerja dengan
          ribuan perusahaan adalah pekerjaan yang serius. Kami merekrut pelan,
          dengan standar tinggi, lalu memberi kepercayaan penuh.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="/careers">
              <Briefcase className="mr-2 h-4 w-4" aria-hidden />
              Lihat 15 Posisi Terbuka
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tentang/tim">
              Bertemu Tim Kami
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Mission Alignment
// ---------------------------------------------------------------------------

const MISSION_POINTS = [
  {
    icon: Target,
    title: 'Dampak konkret, terukur',
    desc: 'Tiap fitur yang Anda kirim akan menyentuh jutaan pengguna nyata. Tidak ada "pekerjaan untuk demo" — semua dirilis dan diukur.',
  },
  {
    icon: Heart,
    title: 'Untuk Indonesia, dari Indonesia',
    desc: 'Berbeda dengan platform global yang melokalisasi, RPI dibangun dari konteks lokal. Empati ini terlihat di tiap detail produk.',
  },
  {
    icon: Users,
    title: 'Tim yang Anda hormati',
    desc: 'Eks-engineer Stripe, designer Tokopedia, ops Gojek, riset INDEF. Mereka memilih bergabung karena misi, bukan paket gaji.',
  },
  {
    icon: TrendingUp,
    title: 'Pertumbuhan cepat',
    desc: 'Pertumbuhan karier internal rata-rata 1,8× lebih cepat dari industri — dengan akuntabilitas yang jelas dan jalur yang nyata.',
  },
]

export function KarierMission() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="karier-mission-heading"
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
              Mengapa Kami
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="karier-mission-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Empat alasan profesional terbaik memilih kami
          </h2>
          <p className="text-muted-foreground mt-3">
            Bukan ping-pong table dan stock options. Yang kami tawarkan: kerja
            yang penting, tim yang kuat, dan kepercayaan untuk membuat dampak.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2">
          {MISSION_POINTS.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.article
                key={p.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border bg-card relative flex h-full overflow-hidden rounded-2xl border p-7"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full opacity-50"
                  style={{
                    background:
                      'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 16%, transparent), transparent)',
                  }}
                />
                <div className="relative flex flex-col">
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
// Day in the Life
// ---------------------------------------------------------------------------

type DaySlot = {
  time: string
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}

const DAY_SLOTS: DaySlot[] = [
  {
    time: '09.00',
    title: 'Stand-up tim, 15 menit',
    desc: 'Singkat dan async-friendly. Kami menulis update di chat sebelum, supaya meeting hanya untuk hal yang butuh diskusi nyata.',
    icon: Coffee,
  },
  {
    time: '10.00',
    title: 'Deep work block',
    desc: 'Dua jam tanpa interupsi. Notifikasi dimatikan, meeting non-darurat ditolak. Ini di mana kerja sebenarnya terjadi.',
    icon: Laptop,
  },
  {
    time: '13.00',
    title: 'Makan siang bersama',
    desc: 'Tim hybrid bertemu di kantor 2-3 hari/minggu. Hari kerja kantor selalu ada makan siang berkumpul — tanpa agenda, opsional.',
    icon: Heart,
  },
  {
    time: '14.00',
    title: '1-on-1 atau review',
    desc: 'Setiap minggu Anda punya 30 menit dengan manajer. Topik dipilih Anda, bukan manajer — agendanya yang Anda butuhkan.',
    icon: MessageCircle,
  },
  {
    time: '15.30',
    title: 'Collaboration window',
    desc: 'Periode untuk meeting cross-team, review desain, pair programming. Kami protect deep work, tapi juga butuh sinkronisasi.',
    icon: Users,
  },
  {
    time: '17.00',
    title: 'Tutup hari',
    desc: 'Kami percaya 8 jam fokus mengalahkan 12 jam tersebar. Out-of-hours kerja tidak dirayakan — istirahat adalah produktivitas.',
    icon: Sparkles,
  },
]

export function KarierDayInLife() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="karier-day-heading"
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
              Sehari di RPI
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="karier-day-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Ritme kerja yang sehat
          </h2>
          <p className="text-muted-foreground mt-3">
            Kami percaya focus over busy. Hari dimulai dan diakhiri tepat
            waktu, dengan deep work block yang dilindungi.
          </p>
        </motion.div>

        <ol className="relative space-y-5">
          <span
            aria-hidden
            className="bg-border absolute left-[40px] top-2 bottom-2 w-px"
          />
          {DAY_SLOTS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.li
                key={s.time}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.04 * i }}
                className="relative grid grid-cols-[88px_1fr] items-start gap-5"
              >
                <span className="font-heading text-[color:var(--ring)] text-base font-semibold tabular-nums">
                  {s.time}
                </span>
                <div className="border-border bg-card flex items-start gap-4 rounded-2xl border p-5">
                  <span
                    aria-hidden
                    className="bg-background border-[color:var(--ring)] text-[color:var(--ring)] relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {s.title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
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
// Career Growth
// ---------------------------------------------------------------------------

type GrowthStory = {
  initial: string
  color: string
  name: string
  from: string
  to: string
  duration: string
  quote: string
}

const STORIES: GrowthStory[] = [
  {
    initial: 'AS',
    color: '#635BFF',
    name: 'Anissa S.',
    from: 'Junior Frontend Engineer (2022)',
    to: 'Staff Frontend Engineer (2026)',
    duration: '4 tahun',
    quote:
      'Tiap kali saya merasa ready untuk ranjau berikutnya, manajer saya memberi kesempatan sebelum saya minta. Itu yang membuat saya stay.',
  },
  {
    initial: 'DK',
    color: '#10B981',
    name: 'Dito K.',
    from: 'Customer Support (2023)',
    to: 'Product Manager, LMS (2026)',
    duration: '3 tahun',
    quote:
      'Saya pindah lintas fungsi — dari support ke product. Bukan jalur biasa, tapi RPI mendukungnya dengan mentor PM dan kursus internal.',
  },
  {
    initial: 'MR',
    color: '#EC4899',
    name: 'Mira R.',
    from: 'Brand Designer (2022)',
    to: 'Head of Design (2026)',
    duration: '4 tahun',
    quote:
      'Saya promote bukan karena nunggu giliran, tapi karena saya butuh membentuk fungsi design yang lebih besar. Mereka bilang ya, sebelum saya yakin.',
  },
]

export function KarierGrowth() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="karier-growth-heading"
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
              Jalur Tumbuh
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="karier-growth-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Pertumbuhan yang nyata
          </h2>
          <p className="text-muted-foreground mt-3">
            68% promosi RPI berasal dari kandidat internal. Tiga cerita di
            bawah ini bukan pengecualian — ini pola.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {STORIES.map((s, i) => (
            <motion.article
              key={s.name}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="font-heading grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${s.color} 0%, color-mix(in oklab, ${s.color} 70%, black) 100%)`,
                  }}
                >
                  {s.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-foreground text-sm font-semibold">
                    {s.name}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {s.duration} di RPI
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm">
                <div className="text-muted-foreground">
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    Dari
                  </span>
                  <div className="text-foreground/85 mt-0.5">{s.from}</div>
                </div>
                <div className="flex items-center justify-center pt-1">
                  <ArrowRight
                    className="text-[color:var(--ring)] h-4 w-4"
                    aria-hidden
                  />
                </div>
                <div className="text-muted-foreground">
                  <span className="text-[color:var(--ring)] text-[10px] font-medium uppercase tracking-wider">
                    Sekarang
                  </span>
                  <div className="text-foreground mt-0.5 font-medium">{s.to}</div>
                </div>
              </div>

              <blockquote className="border-l-[color:var(--ring)] mt-5 border-l-2 pl-4">
                <Quote
                  className="text-[color:var(--ring)]/40 -ml-1 h-5 w-5"
                  aria-hidden
                />
                <p className="text-foreground/85 mt-1 text-sm italic leading-relaxed">
                  &ldquo;{s.quote}&rdquo;
                </p>
              </blockquote>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Diversity & Inclusion
// ---------------------------------------------------------------------------

const DEI_STATS = [
  { value: '48%', label: 'Perempuan di tim', context: 'Median industri tech ID: 32%' },
  { value: '42%', label: 'Perempuan di leadership', context: 'Median industri tech ID: 18%' },
  { value: '6', label: 'Kota & wilayah', context: 'Tidak hanya Jakarta-centric' },
  { value: '4.8/5', label: 'Skor inclusion', context: 'Survei karyawan internal 2026' },
]

const DEI_COMMITMENTS = [
  'Gaji range publik internal — semua tahu band gaji untuk setiap level',
  'Promosi based on impact, di-review oleh komite lintas fungsi',
  'Parental leave 4 bulan untuk semua jenis kelamin orangtua',
  'Aksesibilitas: kantor wheelchair-accessible, alat bantu kerja disediakan',
  'Komunitas internal: women-in-tech, parents-at-RPI, neurodivergent group',
  'Anonim feedback channel langsung ke board, audit bias tahunan',
]

export function KarierDEI() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="karier-dei-heading"
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
              Keberagaman & Inklusi
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="karier-dei-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Tempat kerja yang bekerja untuk semua
          </h2>
          <p className="text-muted-foreground mt-3">
            Kami tidak menjual slogan keberagaman. Kami melaporkan angka
            tahunan dan terikat dengan komitmen konkret di bawah.
          </p>
        </motion.div>

        {/* Stats */}
        <dl className="mb-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {DEI_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="border-border bg-card rounded-2xl border p-6 text-center"
            >
              <div className="font-heading text-[color:var(--ring)] text-3xl font-semibold tabular-nums md:text-4xl">
                {s.value}
              </div>
              <div className="text-foreground/85 mt-2 text-sm font-medium">
                {s.label}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                {s.context}
              </div>
            </motion.div>
          ))}
        </dl>

        {/* Commitments */}
        <div className="border-border bg-muted/20 rounded-2xl border p-7">
          <h3 className="font-heading text-foreground text-base font-semibold">
            Komitmen konkret kami
          </h3>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {DEI_COMMITMENTS.map((c) => (
              <li key={c} className="flex items-start gap-2.5">
                <Sparkles
                  className="text-[color:var(--ring)] mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <span className="text-foreground/85 text-sm leading-relaxed">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Alumni
// ---------------------------------------------------------------------------

type Alumnus = {
  initial: string
  color: string
  name: string
  current: string
  yearLeft: string
  quote: string
}

const ALUMNI: Alumnus[] = [
  {
    initial: 'BR',
    color: '#0A2540',
    name: 'Bagas R.',
    current: 'Engineering Manager, Stripe Singapore',
    yearLeft: 'Alumni 2024',
    quote:
      '2 tahun di RPI mempersiapkan saya untuk peran ini di Stripe. Saya merasa siap memimpin tim yang lebih besar.',
  },
  {
    initial: 'FN',
    color: '#F59E0B',
    name: 'Fia N.',
    current: 'Founder, kelas.id',
    yearLeft: 'Alumni 2023',
    quote:
      'Saya keluar untuk membangun startup sendiri. Tim RPI adalah investor angel pertama saya — dan masih jadi mentor.',
  },
  {
    initial: 'YT',
    color: '#10B981',
    name: 'Yoga T.',
    current: 'Senior PM, Gojek',
    yearLeft: 'Alumni 2025',
    quote:
      'Network alumni RPI sangat aktif. Sekarang kami sering kolaborasi di proyek lintas perusahaan tanpa kompetisi.',
  },
]

export function KarierAlumni() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="karier-alumni-heading"
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
              Alumni
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="karier-alumni-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Ke mana orang-orang pergi setelahnya
          </h2>
          <p className="text-muted-foreground mt-3">
            Bekerja di RPI bukan pekerjaan terakhir Anda — tapi kami berharap
            ini menjadi yang paling berarti. Network alumni 280+ kuat dan aktif.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {ALUMNI.map((a, i) => (
            <motion.article
              key={a.name}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
            >
              <div className="flex items-center gap-3">
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
                  <h3 className="font-heading text-foreground text-sm font-semibold">
                    {a.name}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {a.yearLeft}
                  </p>
                </div>
              </div>

              <div className="text-foreground/85 mt-4 text-sm">
                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Sekarang
                </span>
                <div className="mt-0.5 font-medium">{a.current}</div>
              </div>

              <blockquote className="text-muted-foreground mt-4 text-sm italic leading-relaxed">
                &ldquo;{a.quote}&rdquo;
              </blockquote>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground text-sm">
            Total network alumni:{' '}
            <strong className="text-foreground font-medium">
              280+ orang
            </strong>{' '}
            · tersebar di 35+ perusahaan global
          </p>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Openings CTA
// ---------------------------------------------------------------------------

export function KarierOpeningsCTA() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="karier-cta-heading"
    >
      <div className="container mx-auto w-full max-w-5xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="border-border bg-card relative overflow-hidden rounded-3xl border p-10 md:p-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-60"
            style={{
              background:
                'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 18%, transparent), transparent)',
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Posisi Terbuka
                </span>
              </div>
              <h2
                id="karier-cta-heading"
                className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl"
              >
                15 posisi sedang menunggu Anda
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl text-base">
                Engineering, Product, Design, Marketing, Partnership, Support,
                Academy, Operations — semua tim sedang scaling. Lihat detail
                peran, gaji range, lokasi, dan proses rekrutmen yang transparan.
              </p>

              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Compass className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  Proses 2-4 minggu, transparan
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Award className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  Studi kasus dibayar Rp 1.5jt
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Map className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  Hybrid atau remote
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg">
                <Link href="/careers">
                  <Briefcase className="mr-2 h-4 w-4" aria-hidden />
                  Lihat 15 Posisi
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:careers@rumahpekerja.id">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden />
                  Tanya Recruiter
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
