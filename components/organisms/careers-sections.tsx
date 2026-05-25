'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  Code,
  Compass,
  Globe2,
  GraduationCap,
  HandshakeIcon,
  Heart,
  HeartHandshake,
  Laptop,
  LifeBuoy,
  Lightbulb,
  MapPin,
  Megaphone,
  MessageCircle,
  PartyPopper,
  PenTool,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { cn } from '@/lib/utils'
import { CAREER_OPENINGS as OPENINGS } from '@/lib/careers-data'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function CareersHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="careers-hero-heading"
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
            Karier di RPI
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="careers-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Bangun masa depan{' '}
          <span className="text-[color:var(--ring)]">cara kerja</span>{' '}
          di Indonesia.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Kami mempertemukan jutaan pencari kerja dengan ribuan perusahaan
          terverifikasi. Bergabunglah dengan tim yang membangun infrastrukturnya.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="#openings">
              Lihat Posisi Terbuka
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#life">
              Hidup di RPI
            </Link>
          </Button>
        </motion.div>

        <motion.dl
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {[
            { v: '120+', l: 'Anggota tim' },
            { v: '6', l: 'Kota di Indonesia' },
            { v: '12', l: 'Posisi terbuka' },
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
// Why RPI
// ---------------------------------------------------------------------------

const WHY = [
  {
    icon: Target,
    title: 'Pekerjaan dengan dampak',
    desc: 'Setiap fitur yang Anda kirim menyentuh kehidupan ribuan pencari kerja — dari pelamar pertama kali hingga eksekutif berpengalaman.',
  },
  {
    icon: Rocket,
    title: 'Tumbuh dengan cepat',
    desc: 'Tim kecil, ruang besar untuk memiliki keputusan. Pertumbuhan karier kami rata-rata 1.8× lebih cepat dari industri.',
  },
  {
    icon: Users,
    title: 'Tim yang Anda hormati',
    desc: 'Ex-Gojek, Tokopedia, Stripe, dan Google. Kami merekrut pelan, tapi setiap orang membuat Anda lebih baik.',
  },
  {
    icon: Heart,
    title: 'Misi yang tulus',
    desc: 'Bukan platform pekerjaan biasa — kami percaya cara kerja yang adil dan transparan adalah fondasi Indonesia maju.',
  },
]

export function CareersWhy() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="careers-why-heading"
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
              Mengapa RPI
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-why-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Empat alasan orang baik tetap di sini
          </h2>
          <p className="text-muted-foreground mt-3">
            Kami tidak menjual ping-pong table. Yang kami tawarkan: pekerjaan yang
            berarti, tim yang kuat, dan jalur karier yang nyata.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => {
            const Icon = w.icon
            return (
              <motion.div
                key={w.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
              >
                <span
                  aria-hidden
                  className="mb-4 grid size-11 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-foreground text-lg font-semibold">
                  {w.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {w.desc}
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
// Life at RPI — Benefits & Culture
// ---------------------------------------------------------------------------

const BENEFITS = [
  { icon: Globe2,        title: 'Remote-friendly',     desc: 'Hybrid di 6 kota atau full-remote untuk peran yang sesuai. Anda yang memilih.' },
  { icon: HeartHandshake,title: 'Kesehatan menyeluruh', desc: 'Asuransi swasta untuk Anda + keluarga, plus tunjangan kesehatan mental.' },
  { icon: GraduationCap, title: 'Anggaran belajar',    desc: 'Rp 12 juta/tahun untuk kursus, konferensi, buku — bagaimana Anda mau tumbuh.' },
  { icon: CalendarCheck, title: 'Cuti yang manusiawi', desc: '20 hari cuti tahunan, cuti ulang tahun, dan kebijakan WFA selama 30 hari/tahun.' },
  { icon: Award,         title: 'Saham + bonus',       desc: 'Equity untuk semua karyawan tetap dan bonus performa setiap kuartal.' },
  { icon: Laptop,        title: 'Setup terbaik',       desc: 'MacBook Pro M-series, monitor 4K, plus anggaran ergonomi Rp 5 juta untuk home office.' },
  { icon: LifeBuoy,      title: 'Parental leave',      desc: '4 bulan cuti melahirkan, 4 minggu untuk pasangan — tanpa kompromi karier.' },
  { icon: PartyPopper,   title: 'Offsite tahunan',     desc: 'Sekali setahun kami berkumpul di lokasi yang seru — Bali, Yogya, Lombok.' },
]

const CULTURE = [
  {
    icon: Lightbulb,
    title: 'Tunjukkan, jangan ceritakan',
    desc: 'Kami mengukur dari hasil, bukan jumlah jam atau slide deck. Ide kecil yang dikirim mengalahkan ide besar yang tertunda.',
  },
  {
    icon: ShieldCheck,
    title: 'Diskusi sehat, keputusan tegas',
    desc: 'Setiap suara didengar — tapi setelah keputusan diambil, kita pergi bersama. Disagree and commit.',
  },
  {
    icon: Sparkles,
    title: 'Pekerja Indonesia first',
    desc: 'Setiap rapat kami bertanya: apakah ini benar-benar membantu pencari kerja? Jika tidak, kami batalkan.',
  },
]

export function CareersLife() {
  return (
    <section
      id="life"
      className="bg-background py-20 md:py-24"
      aria-labelledby="careers-life-heading"
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
              Hidup di RPI
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-life-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Budaya, ritme, dan benefit
          </h2>
          <p className="text-muted-foreground mt-3">
            Bagaimana rasanya bekerja bersama kami sehari-hari — dan dukungan yang Anda
            dapatkan untuk melakukan pekerjaan terbaik dalam hidup Anda.
          </p>
        </motion.div>

        {/* Culture pillars */}
        <div className="grid gap-6 lg:grid-cols-3">
          {CULTURE.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border-border relative overflow-hidden rounded-2xl border p-7"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, color-mix(in oklab, var(--ring) 70%, transparent), transparent)',
                  }}
                />
                <Icon className="text-[color:var(--ring)] mb-4 h-6 w-6" aria-hidden />
                <h3 className="font-heading text-foreground text-lg font-semibold">
                  {c.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {c.desc}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Benefits grid */}
        <div className="mt-16">
          <h3 className="font-heading text-foreground mb-6 text-center text-xl font-semibold">
            Benefit yang Anda dapatkan
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: 0.03 * i }}
                  className="border-border bg-card rounded-xl border p-5"
                >
                  <Icon className="text-[color:var(--ring)] h-5 w-5" aria-hidden />
                  <div className="font-heading text-foreground mt-3 text-sm font-semibold">
                    {b.title}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {b.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

const TEAMS = [
  { icon: Code,         name: 'Engineering', size: 38, color: '#635BFF' },
  { icon: PenTool,      name: 'Design',      size: 8,  color: '#EC4899' },
  { icon: Compass,      name: 'Product',     size: 9,  color: '#0EA5E9' },
  { icon: Megaphone,    name: 'Marketing',   size: 12, color: '#F59E0B' },
  { icon: HandshakeIcon,name: 'Partnership', size: 14, color: '#10B981' },
  { icon: LifeBuoy,     name: 'Support',     size: 18, color: '#EF4444' },
  { icon: BookOpen,     name: 'Academy',     size: 10, color: '#8B5CF6' },
  { icon: TrendingUp,   name: 'Operations',  size: 11, color: '#06B6D4' },
]

export function CareersTeams() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="careers-teams-heading"
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
              Tim Kami
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-teams-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            8 tim, satu misi
          </h2>
          <p className="text-muted-foreground mt-3">
            Setiap tim memiliki ruang lingkup sendiri tetapi bekerja seperti satu
            organisme. Tidak ada silo — hanya kepemilikan yang jelas.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEAMS.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.div
                key={t.name}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
                className="border-border bg-card hover:border-[color:var(--ring)] flex items-center gap-4 rounded-xl border p-5 transition"
              >
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklab, ${t.color} 12%, transparent)`,
                    color: t.color,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-heading text-foreground text-sm font-semibold">
                    {t.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {t.size} orang
                  </div>
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
// Open Positions
// ---------------------------------------------------------------------------

const TEAM_FILTERS = ['Semua', ...Array.from(new Set(OPENINGS.map((o) => o.team)))]

export function CareersOpenings() {
  const [filter, setFilter] = React.useState<string>('Semua')
  const filtered = filter === 'Semua' ? OPENINGS : OPENINGS.filter((o) => o.team === filter)

  return (
    <section
      id="openings"
      className="bg-background py-20 md:py-24"
      aria-labelledby="careers-openings-heading"
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
              Posisi Terbuka
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-openings-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {OPENINGS.length} posisi sedang terbuka
          </h2>
          <p className="text-muted-foreground mt-3">
            Jika Anda tidak menemukan peran yang cocok, kirimkan profil Anda — kami
            sering membuka peran baru sebelum diumumkan.
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {TEAM_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                filter === t
                  ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)]'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
              {t !== 'Semua' && (
                <span className="ml-1.5 opacity-60">
                  {OPENINGS.filter((o) => o.team === t).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <ul className="border-border divide-border bg-card divide-y overflow-hidden rounded-2xl border">
          {filtered.map((o) => (
            <li key={o.title}>
              <Link
                href={`/careers/${o.slug}`}
                className="group hover:bg-muted/40 flex flex-col gap-3 px-5 py-5 transition sm:flex-row sm:items-center sm:justify-between sm:px-7"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition sm:text-lg">
                      {o.title}
                    </h3>
                    <Badge variant="secondary" size="sm">
                      {o.level}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" aria-hidden />
                      {o.team}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {o.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      {o.type}
                    </span>
                  </div>
                </div>
                <span className="text-foreground/80 group-hover:text-[color:var(--ring)] inline-flex shrink-0 items-center gap-1 text-sm font-medium transition">
                  Lihat detail
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-border bg-muted/20 mt-8 rounded-2xl border p-7 text-center">
          <h3 className="font-heading text-foreground text-lg font-semibold">
            Tidak menemukan peran yang cocok?
          </h3>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
            Kami selalu tertarik berkenalan dengan orang-orang hebat. Kirim profil
            dan ceritakan bagaimana Anda ingin berkontribusi.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <a href="mailto:careers@rumahpekerja.id">
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              careers@rumahpekerja.id
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Hiring Process
// ---------------------------------------------------------------------------

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Aplikasi',
    duration: '5 menit',
    desc: 'Kirim CV dan ceritakan kenapa peran ini cocok. Kami balas setiap aplikasi dalam 5 hari kerja.',
  },
  {
    icon: MessageCircle,
    title: 'Intro Call',
    duration: '30 menit',
    desc: 'Obrolan santai dengan recruiter. Kami pelajari Anda; Anda pelajari kami. Tidak ada trick question.',
  },
  {
    icon: Code,
    title: 'Studi Kasus',
    duration: '3–5 hari',
    desc: 'Tugas singkat yang mencerminkan pekerjaan nyata. Anda dibayar Rp 1.5 juta jika lolos ke tahap ini.',
  },
  {
    icon: Users,
    title: 'Wawancara Tim',
    duration: '2 jam',
    desc: 'Bertemu calon rekan tim Anda — diskusi teknis, kolaborasi, dan budaya. Bukan satu arah.',
  },
  {
    icon: HandshakeIcon,
    title: 'Penawaran',
    duration: '1 minggu',
    desc: 'Penawaran terbuka dengan rincian gaji, saham, dan benefit. Kami beri waktu untuk berpikir matang.',
  },
]

export function CareersProcess() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="careers-process-heading"
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
              Proses Rekrutmen
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="careers-process-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Lima langkah, transparan
          </h2>
          <p className="text-muted-foreground mt-3">
            Total 2–4 minggu sejak aplikasi sampai penawaran. Tidak ada kejutan, tidak
            ada rangkaian wawancara tanpa akhir.
          </p>
        </motion.div>

        <ol className="relative space-y-6">
          <span
            aria-hidden
            className="bg-border absolute left-[22px] top-2 bottom-2 w-px"
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.li
                key={s.title}
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
                <div className="border-border bg-card flex-1 rounded-xl border p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {i + 1}. {s.title}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      ⏱ {s.duration}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
