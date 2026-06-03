'use client'

import Image from 'next/image'
import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react'
import { Logo } from '@/components/atoms/logo'
import { Button } from '@/components/atoms/button'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { cn } from '@/lib/utils'

export interface FooterPublicProps {
  tenantName?: string
  tenantLogoUrl?: string | null
  className?: string
}

const socials = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: Facebook },
  { label: 'Twitter', href: 'https://twitter.com', Icon: Twitter },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: Linkedin },
  { label: 'YouTube', href: 'https://youtube.com', Icon: Youtube },
]

export function FooterPublic({
  tenantName = 'Rumah Pekerja Indonesia',
  tenantLogoUrl,
  className,
}: FooterPublicProps) {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  const workerLinks = [
    { label: t.public.footer.workerLinks.findJob, href: '/jobs' },
    { label: t.public.footer.workerLinks.coursesTraining, href: '/courses' },
    { label: t.public.footer.workerLinks.buildCV, href: '/cv-builder' },
    { label: t.public.footer.workerLinks.community, href: '/community' },
  ]
  const companyLinks = [
    { label: t.public.footer.companyLinks.postJob, href: '/employers/post-job' },
    { label: t.public.footer.companyLinks.talentSearch, href: '/employers/talent-search' },
    { label: t.public.footer.companyLinks.pricing, href: '/pricing' },
    { label: t.public.footer.companyLinks.enterprise, href: '/enterprise' },
  ]
  const aboutLinks = [
    { label: t.public.footer.aboutLinks.about, href: '/about' },
    { label: t.public.footer.aboutLinks.careers, href: '/careers' },
    { label: t.public.footer.aboutLinks.partners, href: '/partners' },
    { label: t.public.footer.aboutLinks.contact, href: '/contact' },
  ]
  const legalLinks = [
    { label: t.public.footer.legalLinks.privacy, href: '/privacy' },
    { label: t.public.footer.legalLinks.terms, href: '/terms' },
    { label: t.public.footer.legalLinks.cookie, href: '/cookies' },
    { label: t.public.footer.legalLinks.status, href: '/status' },
  ]

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <footer
      className={cn(
        'border-t border-border bg-muted/40 text-foreground',
        className,
      )}
    >
      {/* Newsletter strip */}
      <div className="border-b border-border">
        <div className="container mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 md:grid-cols-2 md:items-center md:py-14">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t.public.footer.newsletterEyebrow}
              </span>
            </div>
            <h3 className="font-heading text-2xl font-semibold leading-tight text-foreground md:text-3xl">
              {t.public.footer.newsletterTitle}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {t.public.footer.newsletterSubtitle}
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col gap-2 md:flex-row"
            aria-label={t.public.footer.newsletterFormLabel}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {t.public.footer.emailLabel}
            </label>
            <div className="relative flex-1">
              <Mail
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder={t.public.footer.emailPlaceholder}
                className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[color:var(--ring)] focus:ring-1 focus:ring-[color:var(--ring)]"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 gap-2">
              {t.public.footer.subscribe}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        </div>
      </div>

      {/* Main footer area */}
      <div className="container mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              {tenantLogoUrl ? (
                <Image
                  src={tenantLogoUrl}
                  alt={tenantName}
                  className="h-9 w-auto"
                  width={160}
                  height={36}
                  unoptimized
                />
              ) : (
                <Logo alt={tenantName} />
              )}
            </div>

            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.public.footer.tagline}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[color:var(--ring)]"
                />
                <span>Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[color:var(--ring)]"
                />
                <a
                  href="tel:+622112345678"
                  className="transition-colors hover:text-foreground"
                >
                  +62 21 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[color:var(--ring)]"
                />
                <a
                  href="mailto:hello@rumahpekerja.id"
                  className="transition-colors hover:text-foreground"
                >
                  hello@rumahpekerja.id
                </a>
              </li>
            </ul>
          </div>

          {/* Worker links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t.public.footer.forWorkers}
            </h4>
            <ul className="mt-5 space-y-3">
              {workerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as Route}
                    className="text-sm text-foreground/80 transition-colors hover:text-[color:var(--ring)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t.public.footer.forCompanies}
            </h4>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as Route}
                    className="text-sm text-foreground/80 transition-colors hover:text-[color:var(--ring)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t.public.footer.aboutCompany}
            </h4>
            <ul className="mt-5 space-y-3">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as Route}
                    className="text-sm text-foreground/80 transition-colors hover:text-[color:var(--ring)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-12 flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {tenantName}. {t.public.footer.allRightsReserved}
          </p>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href as Route}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex items-center gap-1">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-[color:var(--ring)]"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default FooterPublic
