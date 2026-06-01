import type { Metadata, Viewport } from 'next'
import { heading, sans, mono } from '@/lib/fonts'
import { AppProviders } from '@/components/providers/app-providers'
import { CookieConsentMount } from '@/components/organisms/cookie-consent-mount'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Rumah Pekerja Indonesia',
    default: 'Rumah Pekerja Indonesia — Platform SaaS Manajemen Tenaga Kerja',
  },
  description:
    'Rumah Pekerja Indonesia (RPI) — platform SaaS multi-tenant untuk manajemen tenaga kerja, kontrak, payroll, dan kepatuhan ketenagakerjaan di Indonesia.',
  keywords: [
    'Rumah Pekerja Indonesia',
    'RPI',
    'SaaS Tenaga Kerja',
    'Manajemen Pekerja',
    'HRIS Indonesia',
    'Payroll Indonesia',
  ],
  authors: [{ name: 'Rumah Pekerja Indonesia' }],
  creator: 'Rumah Pekerja Indonesia',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Rumah Pekerja Indonesia',
    title: 'Rumah Pekerja Indonesia — Platform SaaS Manajemen Tenaga Kerja',
    description:
      'Platform SaaS multi-tenant untuk manajemen tenaga kerja, kontrak, payroll, dan kepatuhan ketenagakerjaan di Indonesia.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Rumah Pekerja Indonesia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rumah Pekerja Indonesia',
    description:
      'Platform SaaS multi-tenant untuk manajemen tenaga kerja, kontrak, payroll, dan kepatuhan ketenagakerjaan di Indonesia.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A2540' },
    { media: '(prefers-color-scheme: dark)', color: '#0A2540' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${heading.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="bg-background text-foreground font-sans antialiased">
        {/*
          AppProviders wires next-themes (dark/light) + I18nProvider (id/en).
          Per-route providers (BrandingProvider, SessionProvider) still mount
          inside route-group layouts in app/(public), app/(dashboard), app/(auth).
        */}
        <AppProviders>{children}</AppProviders>
        {/* Cookie consent banner — server-rendered conditionally (renders nothing
            when a valid consent cookie is already present). */}
        <CookieConsentMount />
      </body>
    </html>
  )
}
