'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Logo } from '@/components/atoms/logo'
import { ThemeToggle } from '@/components/atoms/theme-toggle'
import { LanguageSwitcher } from '@/components/atoms/language-switcher'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { cn } from '@/lib/utils'

export interface NavbarPublicTenantInfo {
  name?: string
  logoUrl?: string | null
  slug?: string
}

export interface NavbarPublicProps {
  tenant?: NavbarPublicTenantInfo
  links?: Array<{ href: string; label: string }>
  className?: string
}

export function NavbarPublic({ tenant, links, className }: NavbarPublicProps) {
  const { t } = useI18n()
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const defaultLinks: Array<{ href: string; label: string }> = [
    { href: '/jobs', label: t.nav.jobs },
    { href: '/mitra', label: t.nav.partners },
    { href: '/courses', label: t.nav.lms },
    { href: '/tentang', label: t.nav.about },
  ]
  const navLinks = links ?? defaultLinks

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-background/85 backdrop-blur-md shadow-sm'
          : 'bg-background/40 backdrop-blur',
        className,
      )}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Beranda">
          <Logo tenantName={tenant?.name} tenantLogoUrl={tenant?.logoUrl ?? undefined} />
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex flex-1 max-w-sm mx-auto">
          <Input
            type="search"
            placeholder={t.hero.searchPlaceholder}
            prefix={<Search className="h-4 w-4 text-muted-foreground" aria-hidden />}
            aria-label="Pencarian"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t.nav.login}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t.nav.register}</Link>
          </Button>
        </div>

        <div className="md:hidden ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3">
            <Input
              type="search"
              placeholder={t.hero.searchPlaceholder}
              prefix={<Search className="h-4 w-4 text-muted-foreground" aria-hidden />}
              aria-label="Pencarian"
            />
            <nav className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/login">{t.nav.login}</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link href="/register">{t.nav.register}</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default NavbarPublic
