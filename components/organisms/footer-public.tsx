'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/atoms/logo'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface FooterPublicProps {
  tenantName?: string
  tenantLogoUrl?: string | null
  className?: string
}

const workerLinks = [
  { label: 'Cari Kerja', href: '/jobs' },
  { label: 'Kursus & Pelatihan', href: '/courses' },
  { label: 'Bangun CV', href: '/cv-builder' },
  { label: 'Tips Karier', href: '/blog/career' },
  { label: 'Komunitas', href: '/community' },
]

const companyLinks = [
  { label: 'Posting Lowongan', href: '/employers/post-job' },
  { label: 'Cari Talenta', href: '/employers/talent-search' },
  { label: 'Harga', href: '/pricing' },
  { label: 'Solusi Enterprise', href: '/enterprise' },
  { label: 'API Docs', href: '/developers' },
]

const aboutLinks = [
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Karier di RPI', href: '/careers' },
  { label: 'Newsroom', href: '/newsroom' },
  { label: 'Mitra', href: '/partners' },
  { label: 'Kontak', href: '/contact' },
]

const legalLinks = [
  { label: 'Privasi', href: '/privacy' },
  { label: 'Ketentuan', href: '/terms' },
  { label: 'Kebijakan Cookie', href: '/cookies' },
]

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
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <footer className={cn('bg-primary text-primary-foreground', className)}>
      {/* Newsletter banner */}
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'bg-gradient-to-br from-[#0B1437] via-[#111B4A] to-[#1A2461]',
            'border border-secondary/20 shadow-2xl',
            'px-6 py-10 md:px-12 md:py-14',
          )}
        >
          {/* Decorative gold + indigo glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
          />

          <div className="relative grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                <Mail className="h-3.5 w-3.5" />
                Newsletter Mingguan
              </div>
              <h3 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl">
                Dapatkan Info Lowongan Terbaru Setiap Minggu
              </h3>
              <p className="mt-3 text-sm text-primary-foreground/70 md:text-base">
                Bergabung dengan 12.000+ pencari kerja yang sudah berlangganan.
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col gap-3 sm:flex-row"
              aria-label="Form berlangganan newsletter"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Alamat email
              </label>
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/50" />
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className={cn(
                    'h-12 w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-primary-foreground/40',
                    'outline-none transition focus:border-secondary/60 focus:bg-white/10 focus:ring-2 focus:ring-secondary/30',
                  )}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="h-12 gap-2 px-6 font-semibold"
              >
                Berlangganan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer area */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3">
              {tenantLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenantLogoUrl}
                  alt={tenantName}
                  className="h-9 w-auto"
                />
              ) : (
                <Logo tenantName={tenantName} />
              )}
            </div>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              Platform SaaS multi-tenant untuk masa depan kerja Indonesia.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <MapPin className="h-4 w-4 text-secondary" />
                </span>
                <span className="pt-1">Jakarta, Indonesia</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Phone className="h-4 w-4 text-secondary" />
                </span>
                <a
                  href="tel:+622112345678"
                  className="pt-1 transition hover:text-secondary"
                >
                  +62 21 1234 5678
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Mail className="h-4 w-4 text-secondary" />
                </span>
                <a
                  href="mailto:hello@rumahpekerja.id"
                  className="pt-1 transition hover:text-secondary"
                >
                  hello@rumahpekerja.id
                </a>
              </li>
            </ul>

            {/* Social row */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10',
                    'text-primary-foreground/80 transition hover:bg-secondary hover:text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Worker links */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Untuk Pekerja
            </h4>
            <ul className="mt-5 space-y-3">
              {workerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-primary-foreground/70 transition hover:text-secondary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Untuk Perusahaan
            </h4>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-primary-foreground/70 transition hover:text-secondary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About links + app badges */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Tentang RPI
            </h4>
            <ul className="mt-5 space-y-3">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-primary-foreground/70 transition hover:text-secondary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-primary-foreground/60">
                Unduh Aplikasi
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  aria-label="Unduh di App Store"
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-2',
                    'transition hover:border-secondary/40 hover:bg-primary-foreground/10',
                  )}
                >
                  <Smartphone className="h-5 w-5 text-secondary" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-primary-foreground/60">
                      Unduh di
                    </span>
                    <span className="text-xs font-semibold text-white">
                      App Store
                    </span>
                  </span>
                </a>
                <a
                  href="#"
                  aria-label="Tersedia di Google Play"
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-2',
                    'transition hover:border-secondary/40 hover:bg-primary-foreground/10',
                  )}
                >
                  <Smartphone className="h-5 w-5 text-secondary" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-primary-foreground/60">
                      Tersedia di
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Google Play
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-8 border-t border-primary-foreground/10 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-primary-foreground/60">
              &copy; 2025 {tenantName}. All rights reserved.
            </p>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs text-primary-foreground/60 transition hover:text-secondary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-center text-xs text-primary-foreground/50 md:text-left">
            Made with <span aria-hidden>&#10084;&#65039;</span>
            <span className="sr-only">love</span> in Indonesia
          </p>
        </div>
      </div>
    </footer>
  )
}

export default FooterPublic
