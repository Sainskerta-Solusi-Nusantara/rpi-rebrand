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
import { useI18n } from '@/lib/i18n/i18n-provider'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function ContactHero() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.contact

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
            {tc.hero.eyebrow}
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
          <span className="text-[color:var(--ring)]">{tc.hero.headingHighlight}</span>.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl"
        >
          {tc.hero.body}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="#contact-form">
              {tc.hero.ctaPrimary}
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
              {tc.hero.ctaWhatsapp}
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
            {tc.hero.badgeHours}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {tc.hero.badgePrivacy}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {tc.hero.badgeResponse}
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

export function ContactChannels() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.contact

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
      primary: 'halo@pekerja.sainskerta.net',
      secondary: tc.channels.emailSecondary,
      href: 'mailto:halo@pekerja.sainskerta.net',
      cta: tc.channels.emailCta,
    },
    {
      icon: Phone,
      label: tc.channels.phoneLabel,
      primary: '+62 21 5000 1000',
      secondary: tc.channels.phoneSecondary,
      href: 'tel:+622150001000',
      cta: tc.channels.phoneCta,
    },
    {
      icon: MessageCircle,
      label: tc.channels.waLabel,
      primary: '+62 811 0000 1000',
      secondary: tc.channels.waSecondary,
      href: 'https://wa.me/6281100001000',
      cta: tc.channels.waCta,
    },
    {
      icon: Building2,
      label: tc.channels.officeLabel,
      primary: 'Jakarta Selatan',
      secondary: tc.channels.officeSecondary,
      href: '#office',
      cta: tc.channels.officeCta,
    },
  ]

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
            {tc.channels.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.channels.body}
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

export function ContactFormSection() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.contact

  const TOPICS = [
    tc.form.topicGeneral,
    tc.form.topicJobseeker,
    tc.form.topicRecruiter,
    tc.form.topicTraining,
    tc.form.topicMedia,
    tc.form.topicCareers,
    tc.form.topicOther,
  ]

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
                {tc.form.eyebrow}
              </span>
            </div>
            <h2
              id="contact-form-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {tc.form.heading}
            </h2>
            <p className="text-muted-foreground mt-3">
              {tc.form.body}
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                // TEMPORARY DUMMY — wire to API route once form spec is approved.
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={tc.form.fieldName} htmlFor="contact-name" required>
                  <Input
                    id="contact-name"
                    name="name"
                    placeholder={tc.form.placeholderName}
                    autoComplete="name"
                    required
                  />
                </Field>
                <Field label={tc.form.fieldEmail} htmlFor="contact-email" required>
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
                <Field label={tc.form.fieldPhone} htmlFor="contact-phone">
                  <Input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="+62 ..."
                    autoComplete="tel"
                  />
                </Field>
                <Field label={tc.form.fieldCompany} htmlFor="contact-company">
                  <Input
                    id="contact-company"
                    name="company"
                    placeholder={tc.form.placeholderCompany}
                  />
                </Field>
              </div>

              <Field label={tc.form.fieldTopic} htmlFor="contact-topic" required>
                <select
                  id="contact-topic"
                  name="topic"
                  required
                  defaultValue=""
                  className="border-border bg-background text-foreground focus-visible:ring-ring/40 placeholder:text-muted-foreground flex h-10 w-full rounded-md border px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="" disabled>
                    {tc.form.placeholderTopic}
                  </option>
                  {TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={tc.form.fieldMessage} htmlFor="contact-message" required>
                <Textarea
                  id="contact-message"
                  name="message"
                  placeholder={tc.form.placeholderMessage}
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
                  {tc.form.consentPrefix}{' '}
                  <a href="/privacy" className="text-foreground underline underline-offset-2">
                    {tc.form.consentLinkLabel}
                  </a>{' '}
                  {tc.form.consentSuffix}
                </span>
              </label>

              <div className="flex flex-col-reverse items-center gap-3 pt-2 sm:flex-row sm:justify-between">
                <p className="text-muted-foreground text-xs">
                  {tc.form.privacy}
                </p>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  <Send className="mr-2 h-4 w-4" aria-hidden />
                  {tc.form.submit}
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
                      {tc.office.mapLabel}
                    </div>
                    <div className="mt-1 text-xs opacity-80">{tc.office.mapSub}</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-heading text-foreground text-lg font-semibold">
                  {tc.office.visitHeading}
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
                  <InfoLine icon={Mail} label="halo@pekerja.sainskerta.net" />
                  <InfoLine icon={Clock} label={tc.office.officeHours} />
                  <InfoLine icon={Globe} label="pekerja.sainskerta.net" />
                </div>
              </div>
            </div>

            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-foreground text-base font-semibold">
                {tc.office.regionalHeading}
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
                {tc.office.followHeading}
              </h3>
              <div className="mt-4 flex gap-2">
                <SocialIcon href="https://linkedin.com" label="LinkedIn">
                  <Linkedin className="h-4 w-4" aria-hidden />
                </SocialIcon>
                <SocialIcon href="https://wa.me/6281100001000" label="WhatsApp">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                </SocialIcon>
                <SocialIcon href="mailto:halo@pekerja.sainskerta.net" label="Email">
                  <Mail className="h-4 w-4" aria-hidden />
                </SocialIcon>
                <SocialIcon href="https://pekerja.sainskerta.net" label="Website">
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

export function ContactAudience() {
  const { t } = useI18n()
  const tc = t.formsPublicSections.contact

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
      title: tc.audience.jobseekerTitle,
      desc: tc.audience.jobseekerDesc,
      href: 'mailto:support@pekerja.sainskerta.net',
      cta: tc.audience.jobseekerCta,
    },
    {
      icon: Briefcase,
      title: tc.audience.recruiterTitle,
      desc: tc.audience.recruiterDesc,
      href: 'mailto:partner@pekerja.sainskerta.net',
      cta: tc.audience.recruiterCta,
    },
    {
      icon: Newspaper,
      title: tc.audience.mediaTitle,
      desc: tc.audience.mediaDesc,
      href: 'mailto:press@pekerja.sainskerta.net',
      cta: tc.audience.mediaCta,
    },
    {
      icon: Heart,
      title: tc.audience.careersTitle,
      desc: tc.audience.careersDesc,
      href: '/careers',
      cta: tc.audience.careersCta,
    },
  ]

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
              {tc.audience.eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h2
            id="contact-audience-heading"
            className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {tc.audience.heading}
          </h2>
          <p className="text-muted-foreground mt-3">
            {tc.audience.body}
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
