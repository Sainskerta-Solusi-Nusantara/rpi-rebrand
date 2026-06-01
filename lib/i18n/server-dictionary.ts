// Server-only dictionary access.
//
// `getServerLocale()` resolves the effective locale via a strict priority chain:
//   1. URL `?locale=` query param (forwarded by middleware as x-locale-query header).
//   2. `rpi_locale` cookie.
//   3. Authenticated user's `User.locale` (DB lookup, soft-failing).
//   4. `Accept-Language` request header.
//   5. defaultLocale ('id').
//
// `getDictionary(locale)` returns the dictionary slice for the given locale and
// is wrapped in React.cache so repeated calls in the same request are dedup'd.
// `getServerT()` is the convenient one-liner for server components.

import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import {
  dictionary,
  defaultLocale,
  locales,
  type Dictionary,
  type Locale,
} from './dictionary'
import { parseAcceptLanguage } from './accept-language'

const COOKIE_NAME = 'rpi_locale'

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (locales as string[]).includes(v)
}

/**
 * Returns the dictionary slice for the requested locale. Memoised per request.
 */
export const getDictionary = cache(
  async (locale?: Locale): Promise<Dictionary> => {
    const effective = locale && isLocale(locale) ? locale : defaultLocale
    return dictionary[effective]
  },
)

async function readSessionLocale(): Promise<Locale | null> {
  // Lazy import so this file stays cheap when no DB lookup is needed.
  try {
    const { auth } = await import('@/lib/auth/session')
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return null
    const { prisma } = await import('@/lib/db')
    const user = await prisma.user
      .findUnique({ where: { id: userId }, select: { locale: true } })
      .catch(() => null)
    if (user?.locale && isLocale(user.locale)) return user.locale
    return null
  } catch {
    return null
  }
}

/**
 * Resolve the effective locale for the current request using the documented
 * priority chain. Always returns a Locale (falls back to defaultLocale).
 */
export const getServerLocale = cache(async (): Promise<Locale> => {
  // (1) URL query param. We pick it up from a header that middleware can
  // forward, and we also tolerate it being injected directly via NextURL when
  // possible. Both paths are best-effort.
  try {
    const h = headers()
    const fromHeader = h.get('x-locale-query')
    if (isLocale(fromHeader)) return fromHeader
  } catch {
    /* outside request scope */
  }

  // (2) rpi_locale cookie.
  try {
    const v = cookies().get(COOKIE_NAME)?.value
    if (isLocale(v)) return v
  } catch {
    /* outside request scope */
  }

  // (3) User.locale from DB.
  const fromSession = await readSessionLocale()
  if (fromSession) return fromSession

  // (4) Accept-Language header.
  try {
    const accept = headers().get('accept-language')
    const parsed = parseAcceptLanguage(accept)
    if (parsed) return parsed
  } catch {
    /* outside request scope */
  }

  // (5) Default.
  return defaultLocale
})

/**
 * One-shot helper for server components: returns the dictionary that matches
 * the resolved server locale.
 */
export const getServerT = cache(async (): Promise<Dictionary> => {
  const locale = await getServerLocale()
  return getDictionary(locale)
})
