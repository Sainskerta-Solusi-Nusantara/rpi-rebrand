'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Compass,
  Eye,
  Heart,
  Lightbulb,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
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

export function ValuesHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="values-hero-heading"
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
            Nilai-Nilai Kami
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="values-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Nilai itu{' '}
          <span className="text-[color:var(--ring)]">keputusan</span>.
          <br />
          Bukan poster.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Empat prinsip yang dipraktikkan setiap minggu di SSN — bukan
          dinding kantor, tetapi keputusan kecil yang kami buat saat ada
          tradeoff.
        </motion.p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Deep Dive — 4 Values
// ---------------------------------------------------------------------------

type ValueDeep = {
  icon: React.ComponentType<{ className?: string }>
  color: string
  number: string
  title: string
  tagline: string
  longDesc: string
  meansWeDo: string[]
  meansWeDont: string[]
  example: string
}

const VALUES_DEEP: ValueDeep[] = [
  {
    icon: ShieldCheck,
    color: '#10B981',
    number: '01',
    title: 'Adil',
    tagline: 'Tidak ada satu pun yang dipermainkan',
    longDesc:
      'Pasar kerja Indonesia panjang dengan praktik tidak adil — calo, biaya tersembunyi, lowongan palsu, gaji yang disembunyikan. Adil berarti kami menolak menjadi bagian dari itu, bahkan ketika lebih menguntungkan.',
    meansWeDo: [
      'Validasi setiap mitra: legalitas, riwayat hiring, dan keluhan pelamar',
      'Review setiap lowongan sebelum tayang — tolak yang tidak menyebut gaji range atau lokasi',
      'Akses platform 100% gratis untuk pencari kerja — selamanya',
      'Hak pelamar untuk menarik aplikasi dan menghapus data kapan saja',
    ],
    meansWeDont: [
      'Tidak meminta biaya dari pencari kerja dalam bentuk apapun',
      'Tidak membiarkan lowongan tanpa gaji range tayang lebih dari 30 hari',
      'Tidak menampilkan kandidat ke perusahaan tanpa izin eksplisit',
    ],
    example:
      'Tahun 2024 kami men-suspend mitra besar yang biasa kontrak Rp 800jt karena praktik discriminatory hiring berbasis usia. Kami kehilangan revenue, tetapi mempertahankan integritas platform.',
  },
  {
    icon: Eye,
    color: '#0EA5E9',
    number: '02',
    title: 'Transparan',
    tagline: 'Default kami: terbuka',
    longDesc:
      'Transparansi bukan kebajikan — itu mekanisme akuntabilitas. Kalau kami tutup-tutup, susah memperbaiki. Kalau terbuka, pengguna dan staf bisa pegang kami pada janji-janji kami.',
    meansWeDo: [
      'Publikasi gaji range untuk setiap lowongan internal SSN',
      'Audit bias AI tiap 6 bulan dengan laporan publik',
      'Post-mortem insiden dibagikan ke semua mitra dalam 5 hari kerja',
      'OKR perusahaan terbuka internal untuk semua karyawan, kuartalan',
    ],
    meansWeDont: [
      'Tidak menyembunyikan downtime atau bug yang berdampak pengguna',
      'Tidak meminta NDA luas untuk kandidat di proses hiring',
      'Tidak menulis press release yang mengaburkan angka sebenarnya',
    ],
    example:
      'Saat sistem matching kami pertama kali diaudit dan ditemukan bias usia, kami publikasikan laporan lengkapnya — termasuk tindakan koreksi dan timeline. Itu lebih sulit daripada diam, tetapi membangun kepercayaan jangka panjang.',
  },
  {
    icon: Heart,
    color: '#EC4899',
    number: '03',
    title: 'Berpihak pada pekerja',
    tagline: 'Saat ada konflik, pencari kerja menang',
    longDesc:
      'Kami adalah marketplace dua sisi. Tetapi marketplace yang fair harus berpihak pada sisi yang lebih lemah informasinya — dalam kasus ini, pencari kerja. Setiap keputusan produk diuji dengan pertanyaan ini: apakah ini benar-benar memberdayakan pekerja?',
    meansWeDo: [
      'Pencari kerja mendapat akses gratis ke semua fitur, selamanya',
      'Profil pelamar tidak dapat dilihat tanpa izin eksplisit',
      'Notifikasi otomatis kalau lowongan ditutup atau gagal',
      'Right to be forgotten — hapus data lengkap dalam 30 hari',
    ],
    meansWeDont: [
      'Tidak menjual data pencari kerja ke pihak ketiga',
      'Tidak menyiapkan "auto-apply" yang spam mitra dan merusak reputasi pelamar',
      'Tidak menampilkan iklan yang menyesatkan di hasil pencarian',
    ],
    example:
      'Kami menolak permintaan mitra besar untuk membayar boost ranking di hasil pencarian — meskipun harganya tinggi. Hasil pencarian harus mengikuti relevansi, bukan budget mitra. Itu prinsip yang tidak bisa dikompromikan.',
  },
  {
    icon: Compass,
    color: '#F59E0B',
    number: '04',
    title: 'Bertumbuh bersama',
    tagline: 'Sukses tunggal tidak ada artinya',
    longDesc:
      'Platform kami berhasil saat pekerja Indonesia berhasil. Bertumbuh bersama berarti memikirkan jangka panjang — investasi dalam pelatihan, jalur karier, dan ekosistem yang sehat — bahkan ketika ROI jangka pendek tidak jelas.',
    meansWeDo: [
      'SSN Academy: kursus gratis untuk semua pengguna, selamanya',
      'Partnership dengan Kemnaker untuk re-skilling 500.000 pekerja',
      'Mentoring program: alumni SSN mentor pencari kerja dari background serupa',
      'Investasi 30% pendapatan ke program edukasi dan komunitas',
    ],
    meansWeDont: [
      'Tidak hanya optimasi quarterly metrics di expense ekosistem',
      'Tidak mengeksploitasi disparitas informasi untuk margin lebih',
      'Tidak melakukan growth hack yang merugikan retensi jangka panjang',
    ],
    example:
      'SSN Academy dijalankan dengan kerugian operasional di tahun pertama. Tim finance mengusulkan menutup, tetapi kami memutuskan untuk lanjut — karena outcome alumni-nya (60K+ orang dapat sertifikasi gratis) lebih berarti daripada margin tahunan.',
  },
]

export function ValuesDeepDive() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-28"
      aria-labelledby="values-deep-heading"
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
              Empat Nilai
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="values-deep-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Bukan slogan, tetapi keputusan
          </h2>
          <p className="text-muted-foreground mt-3">
            Untuk tiap nilai, kami sebutkan apa yang kami lakukan, apa yang
            kami tolak, dan contoh nyata saat nilai itu diuji.
          </p>
        </motion.div>

        <div className="space-y-10">
          {VALUES_DEEP.map((v, i) => {
            const Icon = v.icon
            return (
              <motion.article
                key={v.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="border-border bg-card relative overflow-hidden rounded-3xl border p-7 md:p-10"
                id={`value-${v.title.toLowerCase()}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 -top-24 size-56 rounded-full opacity-50"
                  style={{
                    background: `radial-gradient(closest-side, color-mix(in oklab, ${v.color} 18%, transparent), transparent)`,
                  }}
                />

                <div className="relative grid gap-8 lg:grid-cols-[280px_1fr]">
                  {/* Left: header */}
                  <header className="lg:sticky lg:top-24 lg:self-start">
                    <div
                      className="font-heading text-7xl font-semibold tracking-tighter md:text-8xl"
                      style={{ color: `color-mix(in oklab, ${v.color} 25%, transparent)` }}
                    >
                      {v.number}
                    </div>
                    <span
                      aria-hidden
                      className="mt-4 grid size-12 place-items-center rounded-2xl"
                      style={{
                        background: `color-mix(in oklab, ${v.color} 12%, transparent)`,
                        color: v.color,
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="font-heading text-foreground mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                      {v.title}
                    </h3>
                    <p
                      className="mt-2 text-base font-medium"
                      style={{ color: v.color }}
                    >
                      {v.tagline}
                    </p>
                  </header>

                  {/* Right: details */}
                  <div className="space-y-8">
                    <p className="text-foreground/85 text-base leading-[1.75] md:text-lg">
                      {v.longDesc}
                    </p>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Artinya kami
                        </div>
                        <ul className="space-y-2.5">
                          {v.meansWeDo.map((m) => (
                            <li
                              key={m}
                              className="text-foreground/85 flex items-start gap-2 text-sm leading-relaxed"
                            >
                              <span
                                aria-hidden
                                className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500"
                              />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                          <X className="h-3.5 w-3.5" aria-hidden />
                          Artinya kami tidak
                        </div>
                        <ul className="space-y-2.5">
                          {v.meansWeDont.map((m) => (
                            <li
                              key={m}
                              className="text-foreground/85 flex items-start gap-2 text-sm leading-relaxed"
                            >
                              <span
                                aria-hidden
                                className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500"
                              />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-border bg-muted/30 rounded-2xl border p-5">
                      <div className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                        <Lightbulb className="h-3 w-3" aria-hidden />
                        Contoh nyata
                      </div>
                      <p className="text-foreground/85 text-sm leading-relaxed">
                        {v.example}
                      </p>
                    </div>
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
// Decision Filter
// ---------------------------------------------------------------------------

const DECISION_STEPS = [
  {
    step: '1',
    question: 'Apakah ini adil untuk semua pihak?',
    desc: 'Termasuk pihak yang tidak ada di meeting — pencari kerja, mitra kecil, kandidat tertolak.',
  },
  {
    step: '2',
    question: 'Apa yang akan kami katakan ke publik tentang ini?',
    desc: 'Kalau jawabannya sulit dijelaskan, biasanya itu sinyal masalah.',
  },
  {
    step: '3',
    question: 'Apakah ini memberdayakan pencari kerja?',
    desc: 'Saat ada konflik antara mitra dan pencari kerja, sisi yang lebih lemah informasinya menang.',
  },
  {
    step: '4',
    question: 'Apa dampaknya 5 tahun dari sekarang?',
    desc: 'Optimasi quarterly mungkin menarik, tetapi nilai dievaluasi dengan lensa jangka panjang.',
  },
]

export function ValuesDecisionFilter() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="values-decision-heading"
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
              Cara Kami Memutuskan
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="values-decision-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Empat pertanyaan, urut
          </h2>
          <p className="text-muted-foreground mt-3">
            Saat keputusan besar di meja — fitur baru, kebijakan, kontrak —
            kami melewati filter empat-pertanyaan ini. Dalam urutan ini.
          </p>
        </motion.div>

        <ol className="relative space-y-5">
          <span
            aria-hidden
            className="bg-border absolute left-[26px] top-2 bottom-2 w-px"
          />
          {DECISION_STEPS.map((s, i) => (
            <motion.li
              key={s.step}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="relative flex gap-5"
            >
              <span
                aria-hidden
                className="bg-background border-[color:var(--ring)] text-[color:var(--ring)] font-heading relative z-10 grid size-13 h-13 w-13 shrink-0 place-items-center rounded-full border-2 text-lg font-semibold"
                style={{ width: 52, height: 52 }}
              >
                {s.step}
              </span>
              <div className="border-border bg-card flex-1 rounded-2xl border p-6">
                <h3 className="font-heading text-foreground text-lg font-semibold md:text-xl">
                  {s.question}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed md:text-base">
                  {s.desc}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tradeoffs
// ---------------------------------------------------------------------------

type Tradeoff = {
  conflict: string
  weChoose: string
  whatItCosts: string
}

const TRADEOFFS: Tradeoff[] = [
  {
    conflict: 'Kecepatan vs Kehati-hatian',
    weChoose: 'Kehati-hatian saat melibatkan data pengguna',
    whatItCosts: 'Rilis fitur baru lebih lambat 2–3 minggu daripada kompetitor — tetapi tidak pernah ada insiden privacy major.',
  },
  {
    conflict: 'Revenue vs Adil',
    weChoose: 'Adil, terutama untuk sisi yang lebih lemah informasi',
    whatItCosts: 'Beberapa kontrak besar gagal karena kami menolak praktik tertentu. Estimasi opportunity cost: Rp 4–6 miliar/tahun.',
  },
  {
    conflict: 'Growth vs Sustainability',
    weChoose: 'Sustainability — hanya tumbuh sebanyak yang bisa kami support',
    whatItCosts: 'Tidak ada hyper-growth headlines. Tetapi retention 12-bulan tetap di atas 91%.',
  },
  {
    conflict: 'Optimasi metrik vs Pengalaman jangka panjang',
    weChoose: 'Pengalaman jangka panjang',
    whatItCosts: 'Engagement metrics quarterly tidak setinggi yang mungkin. NPS dan retention long-term lebih tinggi dari rata-rata.',
  },
]

export function ValuesTradeoffs() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="values-tradeoffs-heading"
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
              Tradeoff
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="values-tradeoffs-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Ketika nilai bertabrakan
          </h2>
          <p className="text-muted-foreground mt-3">
            Nilai dewasa adalah nilai yang Anda bayar untuk pegang. Empat
            tradeoff utama kami — dan apa yang itu sebenarnya biayai.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {TRADEOFFS.map((t, i) => (
            <motion.article
              key={t.conflict}
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="border-border bg-card flex h-full flex-col rounded-2xl border p-7"
            >
              <Scale
                className="text-[color:var(--ring)] h-6 w-6"
                aria-hidden
              />
              <div className="font-heading text-muted-foreground mt-4 text-xs uppercase tracking-wider">
                Konflik
              </div>
              <h3 className="font-heading text-foreground mt-1 text-lg font-semibold">
                {t.conflict}
              </h3>
              <div className="border-border mt-5 border-t pt-4">
                <div className="text-[color:var(--ring)] text-[10px] font-semibold uppercase tracking-wider">
                  Kami memilih
                </div>
                <p className="text-foreground/90 mt-1 text-sm font-medium leading-relaxed">
                  {t.weChoose}
                </p>
              </div>
              <div className="border-border mt-4 border-t pt-4">
                <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                  Biaya yang kami bayar
                </div>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {t.whatItCosts}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Living the Values (testimonials/scenarios)
// ---------------------------------------------------------------------------

type LivingScenario = {
  quote: string
  author: string
  role: string
  initial: string
  color: string
}

const LIVING: LivingScenario[] = [
  {
    quote:
      'Saat seorang mitra besar minta data kandidat untuk analisis "internal", kami tolak — bahkan ketika mereka tawarkan kontrak tambahan. Itu yang membuat saya tahu nilainya nyata, bukan retorika.',
    author: 'Citra L.',
    role: 'Head of TA',
    initial: 'CL',
    color: '#EC4899',
  },
  {
    quote:
      'Hari pertama saya, manajer bilang: "Setiap keputusan, tanya dulu: apakah ini memberdayakan pekerja?" Saya pikir itu skrip onboarding. Setelah 2 tahun, saya melihat dia mempraktikkannya tiap minggu.',
    author: 'Rendra W.',
    role: 'VP Product',
    initial: 'RW',
    color: '#F59E0B',
  },
  {
    quote:
      'Kami pernah salah audit bias dan menerbitkan koreksi publik. Beberapa di tim takut itu merusak reputasi. Sebaliknya — kepercayaan mitra naik karena kami transparan.',
    author: 'Siti N.',
    role: 'CTO',
    initial: 'SN',
    color: '#635BFF',
  },
]

export function ValuesLiving() {
  return (
    <section
      className="bg-background py-20 md:py-24"
      aria-labelledby="values-living-heading"
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
              Bukti
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="values-living-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Kata orang-orang yang menjalankannya
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {LIVING.map((l, i) => (
            <motion.figure
              key={l.author}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="border-border bg-card flex h-full flex-col rounded-2xl border p-7"
            >
              <Quote
                className="text-[color:var(--ring)]/40 h-6 w-6"
                aria-hidden
              />
              <blockquote className="text-foreground/90 font-heading mt-4 flex-1 text-base italic leading-relaxed">
                &ldquo;{l.quote}&rdquo;
              </blockquote>
              <figcaption className="border-border mt-5 flex items-center gap-3 border-t pt-5">
                <span
                  aria-hidden
                  className="font-heading grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${l.color} 0%, color-mix(in oklab, ${l.color} 70%, black) 100%)`,
                  }}
                >
                  {l.initial}
                </span>
                <div className="min-w-0">
                  <div className="text-foreground text-sm font-medium">
                    {l.author}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {l.role}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Accountability
// ---------------------------------------------------------------------------

const ACCOUNTABILITY = [
  {
    icon: BadgeCheck,
    title: 'Audit bias AI per 6 bulan',
    desc: 'Laporan publik di /legal/bias-audit. Termasuk findings dan rencana perbaikan.',
    href: '/tentang/legal',
  },
  {
    icon: TrendingUp,
    title: 'Laporan transparansi tahunan',
    desc: 'Statistik permintaan data, takedown, dan moderasi konten. Diterbitkan tiap Maret.',
    href: '/tentang/legal',
  },
  {
    icon: Sparkles,
    title: 'Survei budaya internal',
    desc: 'Karyawan menilai kepemimpinan dan eksekusi nilai. Hasil terbagi anonim di seluruh tim.',
    href: '/tentang/tim',
  },
  {
    icon: Heart,
    title: 'NPS pengguna kuartalan',
    desc: 'Pencari kerja dan mitra menilai pengalaman. Skor di bawah target memicu deep-dive.',
    href: '/blog',
  },
]

export function ValuesAccountability() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="values-accountability-heading"
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
              Akuntabilitas
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="values-accountability-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Cara Anda bisa pegang kami
          </h2>
          <p className="text-muted-foreground mt-3">
            Nilai tanpa akuntabilitas adalah pernyataan PR. Berikut empat
            mekanisme yang membuat kami bertanggung jawab secara publik.
          </p>
        </motion.div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {ACCOUNTABILITY.map((a, i) => {
            const Icon = a.icon
            return (
              <motion.li
                key={a.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.03 * i }}
              >
                <a
                  href={a.href}
                  className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-6 transition"
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                        {a.title}
                      </h3>
                      <ArrowRight
                        className="text-muted-foreground group-hover:text-[color:var(--ring)] h-3.5 w-3.5 shrink-0 transition"
                        aria-hidden
                      />
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </a>
              </motion.li>
            )
          })}
        </ul>

        <div className="border-border bg-card mt-10 rounded-2xl border p-7 text-center">
          <h3 className="font-heading text-foreground text-base font-semibold">
            Lihat ada yang tidak konsisten dengan nilai ini?
          </h3>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
            Hubungi tim kami langsung. Anonim channel ke board tersedia bagi
            yang membutuhkan privasi penuh.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="sm">
              <a href="mailto:values@pekerja.sainskerta.net">
                Email values@pekerja.sainskerta.net
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/contact">
                Form Kontak Anonim
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
