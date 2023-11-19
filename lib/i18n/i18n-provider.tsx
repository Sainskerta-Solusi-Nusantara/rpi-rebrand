'use client'

import * as React from 'react'
import { dictionary, defaultLocale, locales, type Locale, type Dictionary } from './dictionary'

const COOKIE_NAME = 'rpi_locale'

interface I18nContextValue {
  locale: Locale
  t: Dictionary
  setLocale: (l: Locale) => void
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

function readCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  const v = m ? decodeURIComponent(m[1]) : null
  return (locales as string[]).includes(v ?? '') ? (v as Locale) : defaultLocale
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale ?? defaultLocale)

  React.useEffect(() => {
    const fromCookie = readCookie()
    if (fromCookie !== locale) setLocaleState(fromCookie)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l)
    document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l
    }
  }, [])

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, t: dictionary[locale], setLocale }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) {
    return {
      locale: defaultLocale,
      t: dictionary[defaultLocale],
      setLocale: () => {},
    }
  }
  return ctx
}
