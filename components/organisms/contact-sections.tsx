'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  Globe,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import { cn } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function ContactHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-background"
      aria-labelledby="contact-hero-heading"
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
            Hubungi Kami
          </span>
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
        </motion.div>

        <motion.h1
          id="contact-hero-heading"
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-heading text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Mari bicara{' '}
          <span className="text-[color:var(--ring)]">soal karier Anda</span>.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          Pertanyaan teknis, kerja sama mitra, kolaborasi pelatihan, atau sekadar
          ingin berbagi cerita — tim kami biasanya membalas dalam 1×24 jam kerja.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="#contact-form">
              Kirim Pesan
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://wa.me/6281100001000"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              WhatsApp Tim Kami
            </a>
          </Button>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
        >
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Senin–Jumat · 09.00–18.00 WIB
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Data Anda terlindungi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Respons rata-rata 4 jam
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

type Channel = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  primary: string
  secondary: string
  href: string
  cta: string
}

const CHANNELS: Channel[] = [
  {
    icon: Mail,
    label: 'Email',
    primary: 'halo@rumahpekerja.id',
    secondary: 'Untuk pertanyaan umum & dukungan',
    href: 'mailto:halo@rumahpekerja.id',
    cta: 'Kirim email',
  },
  {
    icon: Phone,
    label: 'Telepon',
    primary: '+62 21 5000 1000',
    secondary: 'Senin–Jumat, 09.00–18.00 WIB',
    href: 'tel:+622150001000',
    cta: 'Telepon kami',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    primary: '+62 811 0000 1000',
    secondary: 'Chat tim hubungan mitra & pengguna',
    href: 'https://wa.me/6281100001000',
    cta: 'Buka WhatsApp',
  },
  {
    icon: Building2,
    label: 'Kantor Pusat',
    primary: 'Jakarta Selatan',
    secondary: 'Menara Standard Chartered, Lantai 21',
    href: '#office',
    cta: 'Lihat alamat',
  },
]

export function ContactChannels() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="contact-channels-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2
            id="contact-channels-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Pilih cara yang paling nyaman
          </h2>
          <p className="text-muted-foreground mt-3">
            Kami siap dihubungi melalui beberapa kanal. Pilih yang paling sesuai
            dengan kebutuhan Anda.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((c, i) => {
            const Icon = c.icon
            const isExternal = c.href.startsWith('http')
            return (
              <motion.a
                key={c.label}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                href={c.href}
                {...(isExternal
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="border-border bg-card hover:border-[color:var(--ring)] hover:shadow-md group flex flex-col rounded-2xl border p-6 transition"
              >
                <span
                  aria-hidden
                  className="mb-4 grid size-11 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  {c.label}
                </div>
                <div className="font-heading text-foreground mt-1 text-lg font-semibold">
                  {c.primary}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {c.secondary}
                </p>
                <span className="text-foreground/80 group-hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium transition">
                  {c.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Form + Office
// ---------------------------------------------------------------------------

const TOPICS = [
  'Pertanyaan Umum',
  'Saya Pencari Kerja',
  'Saya Mitra Perekrut',
  'Pelatihan & Sertifikasi',
  'Media / Press',
  'Karier di RPI',
  'Lainnya',
]

export function ContactFormSection() {
  return (
    <section
      id="contact-form"
      className="bg-background py-20 md:py-24"
      aria-labelledby="contact-form-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Form */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="mb-6 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Kirim Pesan
              </span>
            </div>
            <h2
              id="contact-form-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Tulis pesan Anda
            </h2>
            <p className="text-muted-foreground mt-3">
              Lengkapi formulir di bawah. Tim kami akan menghubungi Anda kembali
              dalam 1×24 jam kerja.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                // TEMPORARY DUMMY — wire to API route once form spec is approved.
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nama lengkap" htmlFor="contact-name" required>
                  <Input
                    id="contact-name"
                    name="name"
                    placeholder="Nama Anda"
                    autoComplete="name"
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="contact-email" required>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nomor telepon" htmlFor="contact-phone">
                  <Input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="+62 ..."
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Perusahaan / Instansi" htmlFor="contact-company">
                  <Input
                    id="contact-company"
                    name="company"
                    placeholder="Opsional"
                  />
                </Field>
              </div>

              <Field label="Topik" htmlFor="contact-topic" required>
                <select
                  id="contact-topic"
                  name="topic"
                  required
                  defaultValue=""
                  className="border-border bg-background text-foreground focus-visible:ring-ring/40 placeholder:text-muted-foreground flex h-10 w-full rounded-md border px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="" disabled>
                    Pilih topik pertanyaan
                  </option>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Pesan" htmlFor="contact-message" required>
                <Textarea
                  id="contact-message"
                  name="message"
                  placeholder="Ceritakan apa yang bisa kami bantu…"
                  rows={6}
                  required
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
                  <a href="/privacy" className="text-foreground underline underline-offset-2">
                    Kebijakan Privasi
                  </a>{' '}
                  dan pemrosesan data oleh Rumah Pekerja Indonesia untuk tujuan
                  korespondensi.
                </span>
              </label>

              <div className="flex flex-col-reverse items-center gap-3 pt-2 sm:flex-row sm:justify-between">
                <p className="text-muted-foreground text-xs">
                  Kami tidak pernah membagikan informasi Anda ke pihak ketiga.
                </p>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  <Send className="mr-2 h-4 w-4" aria-hidden />
                  Kirim Pesan
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Office Info */}
          <motion.aside
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            id="office"
            className="space-y-6"
          >
            <div className="border-border bg-card overflow-hidden rounded-2xl border">
              <div
                aria-hidden
                className="relative h-48 w-full"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--ring) 25%, transparent), transparent 60%), linear-gradient(135deg, color-mix(in oklab, var(--primary) 92%, black) 0%, color-mix(in oklab, var(--primary) 75%, black) 100%)',
                }}
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-primary-foreground/90 flex flex-col items-center text-center">
                    <MapPin className="mb-2 h-8 w-8" aria-hidden />
                    <div className="font-heading text-lg font-semibold">
                      Kantor Pusat RPI
                    </div>
                    <div className="mt-1 text-xs opacity-80">Jakarta Selatan, Indonesia</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-heading text-foreground text-lg font-semibold">
                  Datang berkunjung
                </h3>
                <address className="text-muted-foreground mt-3 not-italic text-sm leading-relaxed">
                  Menara Standard Chartered, Lantai 21
                  <br />
                  Jl. Prof. Dr. Satrio No.164
                  <br />
                  Karet Semanggi, Setiabudi
                  <br />
                  Jakarta Selatan 12930, Indonesia
                </address>

                <div className="border-border mt-5 grid grid-cols-2 gap-3 border-t pt-5 text-sm">
                  <InfoLine icon={Phone} label="+62 21 5000 1000" />
                  <InfoLine icon={Mail} label="halo@rumahpekerja.id" />
                  <InfoLine icon={Clock} label="Sen–Jum, 09–18 WIB" />
                  <InfoLine icon={Globe} label="rumahpekerja.id" />
                </div>
              </div>
            </div>

            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground text-base font-semibold">
                Kantor Regional
              </h3>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                {[
                  { city: 'Bandung', addr: 'Wyata Guna Building, Sukajadi' },
                  { city: 'Surabaya', addr: 'Pakuwon Center, Tunjungan' },
                  { city: 'Medan', addr: 'Centre Point Lt. 14, Medan Timur' },
                ].map((o) => (
                  <li key={o.city} className="flex items-start gap-2">
                    <MapPin className="text-[color:var(--ring)] mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      <strong className="text-foreground font-medium">{o.city}</strong>{' '}
                      — {o.addr}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground text-base font-semibold">
                Ikuti kami
              </h3>
              <div className="mt-4 flex gap-2">
                <SocialIcon href="https://linkedin.com" label="LinkedIn">
                  <Linkedin className="h-4 w-4" aria-hidden />
                </SocialIcon>
                <SocialIcon href="https://wa.me/6281100001000" label="WhatsApp">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                </SocialIcon>
                <SocialIcon href="mailto:halo@rumahpekerja.id" label="Email">
                  <Mail className="h-4 w-4" aria-hidden />
                </SocialIcon>
                <SocialIcon href="https://rumahpekerja.id" label="Website">
                  <Globe className="h-4 w-4" aria-hidden />
                </SocialIcon>
              </div>
            </div>
          </motion.aside>
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

function InfoLine({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2">
      <Icon className="text-[color:var(--ring)] h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  )
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  const isExternal = href.startsWith('http')
  return (
    <a
      href={href}
      aria-label={label}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] grid size-9 place-items-center rounded-lg border transition"
    >
      {children}
    </a>
  )
}

// ---------------------------------------------------------------------------
// Audience Routing
// ---------------------------------------------------------------------------

type Audience = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  href: string
  cta: string
}

const AUDIENCES: Audience[] = [
  {
    icon: Users,
    title: 'Saya Pencari Kerja',
    desc: 'Pertanyaan seputar profil, melamar pekerjaan, kursus, atau sertifikat. Tim Support siap bantu.',
    href: 'mailto:support@rumahpekerja.id',
    cta: 'support@rumahpekerja.id',
  },
  {
    icon: Briefcase,
    title: 'Saya Mitra Perekrut',
    desc: 'Konsultasi paket layanan, onboarding tenant, branding, atau integrasi API untuk perusahaan Anda.',
    href: 'mailto:partner@rumahpekerja.id',
    cta: 'partner@rumahpekerja.id',
  },
  {
    icon: Newspaper,
    title: 'Media & Press',
    desc: 'Permintaan wawancara, siaran pers, atau penggunaan logo dan brand assets resmi RPI.',
    href: 'mailto:press@rumahpekerja.id',
    cta: 'press@rumahpekerja.id',
  },
  {
    icon: Heart,
    title: 'Karier di RPI',
    desc: 'Tertarik bergabung membangun masa depan pekerja Indonesia? Lihat lowongan internal kami.',
    href: '/careers',
    cta: 'Lihat lowongan',
  },
]

export function ContactAudience() {
  return (
    <section
      className="bg-muted/30 py-20 md:py-24"
      aria-labelledby="contact-audience-heading"
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
              Hubungi tim yang tepat
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="contact-audience-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Diarahkan ke orang yang tepat
          </h2>
          <p className="text-muted-foreground mt-3">
            Setiap kebutuhan ditangani tim khusus agar respons lebih cepat dan relevan.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {AUDIENCES.map((a, i) => {
            const Icon = a.icon
            return (
              <motion.div
                key={a.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.05 * i }}
              >
                <a
                  href={a.href}
                  className={cn(
                    'border-border bg-card hover:border-[color:var(--ring)] hover:shadow-md group flex h-full items-start gap-5 rounded-2xl border p-6 transition',
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-12 shrink-0 place-items-center rounded-xl border border-[color:var(--ring)]/30 bg-[color:var(--ring)]/10 text-[color:var(--ring)]"
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-foreground text-lg font-semibold">
                      {a.title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm">{a.desc}</p>
                    <span className="text-foreground/80 group-hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium transition">
                      {a.cta}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                </a>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
