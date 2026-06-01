'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Languages, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  defaultLocale,
  locales,
  type Locale,
} from '@/lib/i18n/dictionary'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { setUserLocale } from '@/lib/i18n/locale-actions'

const COOKIE_NAME = 'rpi_locale'
const ONE_YEAR = 60 * 60 * 24 * 365

const FLAGS: Record<Locale, string> = {
  id: '\u{1F1EE}\u{1F1E9}', // 🇮🇩
  en: '\u{1F1EC}\u{1F1E7}', // 🇬🇧
}

const SHORT_LABEL: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
}

export interface LanguageSwitcherProps {
  /** Current locale resolved on the server. Falls back to client provider. */
  currentLocale?: Locale
  /** UI variant — dropdown is compact, inline shows side-by-side buttons. */
  variant?: 'dropdown' | 'inline'
  className?: string
}

export function LanguageSwitcher({
  currentLocale,
  variant = 'dropdown',
  className,
}: LanguageSwitcherProps) {
  const router = useRouter()
  const { t, setLocale: setClientLocale, locale: clientLocale } = useI18n()
  const initial: Locale = currentLocale ?? clientLocale ?? defaultLocale
  const [active, setActive] = React.useState<Locale>(initial)
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // Close dropdown on outside click.
  React.useEffect(() => {
    if (variant !== 'dropdown') return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [variant])

  const apply = React.useCallback(
    (next: Locale) => {
      if (next === active) {
        setOpen(false)
        return
      }
      // Optimistic UI: set the cookie + client state immediately so the
      // interface re-localises before the server action returns.
      try {
        document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
      } catch {
        /* SSR safety */
      }
      try {
        setClientLocale(next)
      } catch {
        /* provider absent */
      }
      setActive(next)
      setOpen(false)
      startTransition(async () => {
        try {
          await setUserLocale(next)
        } catch (err) {
          console.error('[LanguageSwitcher] setUserLocale failed', err)
        }
        // Re-render server components with the new locale resolution.
        router.refresh()
      })
    },
    [active, router, setClientLocale],
  )

  const switchToLabel =
    (t as { common?: { language?: { switchTo?: string } } })?.common?.language?.switchTo ??
    'Ganti bahasa'

  if (variant === 'inline') {
    return (
      <div
        role="group"
        aria-label={switchToLabel}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-border bg-background p-0.5',
          className,
        )}
      >
        {locales.map((loc) => {
          const isActive = loc === active
          return (
            <button
              key={loc}
              type="button"
              aria-pressed={isActive}
              disabled={pending}
              onClick={() => apply(loc)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                pending && 'opacity-60',
              )}
            >
              <span aria-hidden="true">{FLAGS[loc]}</span>
              <span>{SHORT_LABEL[loc]}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown variant
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={switchToLabel}
        title={switchToLabel}
        disabled={pending}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground',
          pending && 'opacity-60',
        )}
      >
        <Languages className="h-5 w-5" />
        <span aria-hidden="true" className="text-base leading-none">
          {FLAGS[active]}
        </span>
        <span className="sr-only sm:not-sr-only sm:text-xs sm:font-medium">
          {SHORT_LABEL[active]}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={switchToLabel}
          className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground">{switchToLabel}</p>
          </div>
          {locales.map((loc) => {
            const isActive = loc === active
            const label =
              (t as { common?: { language?: Record<string, string> } })?.common?.language?.[loc] ??
              (loc === 'id' ? 'Bahasa Indonesia' : 'English')
            return (
              <button
                key={loc}
                type="button"
                role="menuitem"
                onClick={() => apply(loc)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
                  isActive && 'bg-muted/60',
                )}
              >
                <span aria-hidden="true" className="text-base">
                  {FLAGS[loc]}
                </span>
                <span className="flex-1 truncate">{label}</span>
                {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default LanguageSwitcher
