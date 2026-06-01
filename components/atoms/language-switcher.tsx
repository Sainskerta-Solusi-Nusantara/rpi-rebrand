'use client'

import * as React from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { locales, type Locale } from '@/lib/i18n/dictionary'

const labels: Record<Locale, { short: string; long: string; flag: string }> = {
  id: { short: 'ID', long: 'Bahasa Indonesia', flag: '🇮🇩' },
  en: { short: 'EN', long: 'English', flag: '🇬🇧' },
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={t.common.language.label}
        title={t.common.language.label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{labels[locale].short}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {locales.map((l) => {
            const active = l === locale
            return (
              <button
                key={l}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => {
                  setLocale(l)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted',
                  active && 'bg-muted/60',
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden className="text-base leading-none">
                    {labels[l].flag}
                  </span>
                  {labels[l].long}
                </span>
                {active ? <Check className="h-4 w-4 text-secondary" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
