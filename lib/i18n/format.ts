// Locale-aware formatting helpers built on the Intl APIs.
//
// All helpers accept our app Locale ('id' | 'en') and translate it to the
// underlying BCP-47 tag we want Intl to use: 'id-ID' / 'en-US'. This keeps the
// callsites simple and decouples our app locale from Intl's region quirks.

import type { Locale } from './dictionary'

const INTL_LOCALE: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en-US',
}

function intlTag(locale: Locale): string {
  return INTL_LOCALE[locale] ?? INTL_LOCALE.id
}

/**
 * Format a Date for display.
 *  - id  → "1 Jun 2026"
 *  - en  → "Jun 1, 2026"
 *
 * Pass `opts` to override (e.g. `{dateStyle: 'long'}`).
 */
export function formatDate(
  d: Date,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  try {
    return new Intl.DateTimeFormat(intlTag(locale), opts).format(d)
  } catch {
    return d.toISOString()
  }
}

/**
 * Format a number with grouping/decimals appropriate for the locale.
 *  - id  → "1.234,5"
 *  - en  → "1,234.5"
 */
export function formatNumber(
  n: number,
  locale: Locale,
  opts?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(intlTag(locale), opts).format(n)
  } catch {
    return String(n)
  }
}

/**
 * Format a currency amount. Defaults to IDR; pass currency='USD' for English
 * pricing displays.
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: string = 'IDR',
): string {
  try {
    return new Intl.NumberFormat(intlTag(locale), {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
]

/**
 * Format a Date relative to now. Picks the largest applicable unit.
 *  - id  → "2 menit lalu"
 *  - en  → "2 minutes ago"
 */
export function formatRelativeTime(d: Date, locale: Locale): string {
  try {
    const rtf = new Intl.RelativeTimeFormat(intlTag(locale), { numeric: 'auto' })
    const diff = d.getTime() - Date.now()
    const abs = Math.abs(diff)
    for (const { unit, ms } of UNITS) {
      if (abs >= ms || unit === 'second') {
        const value = Math.round(diff / ms)
        return rtf.format(value, unit)
      }
    }
    return rtf.format(0, 'second')
  } catch {
    return d.toISOString()
  }
}
