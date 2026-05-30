import { cache } from 'react'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { defaultLocale, locales, type Locale } from '@/lib/i18n/dictionary'

/** Curated allowlist of timezones surfaced in the UI. Other IANA tz names are
 * still accepted at the schema layer for users who set it via API or import. */
export const SUPPORTED_TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Bangkok',
  'Asia/Manila',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
] as const

export const DEFAULT_TIMEZONE = 'Asia/Jakarta'

export type PersonalPrefs = {
  locale: Locale
  timezone: string
}

function pickLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  for (const seg of header.split(',')) {
    const main = seg.trim().split(';')[0] ?? ''
    const lang = main.toLowerCase().split('-')[0] ?? ''
    if (lang && (locales as string[]).includes(lang)) return lang as Locale
  }
  return null
}

/** Resolve preferences for the user with a fallback chain:
 *   DB row → Accept-Language → defaults. Safe to call without a session. */
export const getPersonalPrefs = cache(
  async (userId: string | null | undefined): Promise<PersonalPrefs> => {
    let dbLocale: string | null = null
    let dbTz: string | null = null
    if (userId) {
      try {
        const row = await prisma.user.findUnique({
          where: { id: userId },
          select: { locale: true, timezone: true },
        })
        dbLocale = row?.locale ?? null
        dbTz = row?.timezone ?? null
      } catch {
        // fall through to defaults
      }
    }

    let locale: Locale = defaultLocale
    if (dbLocale && (locales as string[]).includes(dbLocale)) {
      locale = dbLocale as Locale
    } else {
      try {
        const fromHeader = pickLocaleFromAcceptLanguage(
          headers().get('accept-language'),
        )
        if (fromHeader) locale = fromHeader
      } catch {
        // headers may be unavailable outside a request scope
      }
    }

    const timezone =
      dbTz && SUPPORTED_TIMEZONES.includes(dbTz as (typeof SUPPORTED_TIMEZONES)[number])
        ? dbTz
        : (dbTz ?? DEFAULT_TIMEZONE)

    return { locale, timezone }
  },
)

/** Format a date with the resolved locale + timezone. Falls back gracefully
 * if the timezone string is invalid. */
export function formatDateTime(
  date: Date,
  prefs: PersonalPrefs,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  try {
    return new Intl.DateTimeFormat(
      prefs.locale === 'en' ? 'en-US' : 'id-ID',
      { ...opts, timeZone: prefs.timezone },
    ).format(date)
  } catch {
    return new Intl.DateTimeFormat('id-ID', opts).format(date)
  }
}
