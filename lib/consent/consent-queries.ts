import { cache } from 'react'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  SESSION_COOKIE_NAME,
  type StoredConsent,
} from './cookie-categories'

export type CurrentConsent = {
  prefs: StoredConsent | null
  /** Show the banner when there is no decision OR the saved version is stale. */
  needsBanner: boolean
  /** Anonymous session id (may be `null` if the visitor never accepted/rejected). */
  sessionId: string | null
}

function parseConsentCookie(raw: string | undefined): StoredConsent | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as Partial<StoredConsent>
    if (typeof obj !== 'object' || obj === null) return null
    return {
      version: typeof obj.version === 'number' ? obj.version : 0,
      necessary: true,
      analytics: Boolean(obj.analytics),
      marketing: Boolean(obj.marketing),
      functional: Boolean(obj.functional),
      savedAt: typeof obj.savedAt === 'string' ? obj.savedAt : new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Read the current visitor's consent. Server-only. Returns `needsBanner` when
 * the cookie is missing or stale (`version < CONSENT_VERSION`).
 */
export const getCurrentConsent = cache(async (): Promise<CurrentConsent> => {
  const jar = cookies()
  const sessionId = jar.get(SESSION_COOKIE_NAME)?.value ?? null
  const prefs = parseConsentCookie(jar.get(CONSENT_COOKIE_NAME)?.value)
  const needsBanner = !prefs || prefs.version < CONSENT_VERSION
  return { prefs, needsBanner, sessionId }
})

export type ConsentHistoryEntry = {
  id: string
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
  version: number
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Past + current consent rows for a logged-in user, newest first. Used by the
 * Privacy Center "Riwayat persetujuan" section.
 */
export const getConsentHistoryForUser = cache(
  async (userId: string, limit = 25): Promise<ConsentHistoryEntry[]> => {
    try {
      const rows = await prisma.cookieConsent.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: Math.max(1, Math.min(100, limit)),
        select: {
          id: true,
          necessary: true,
          analytics: true,
          marketing: true,
          functional: true,
          version: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      return rows
    } catch {
      return []
    }
  },
)

/** Same as above but pinned by the anonymous session id (for non-auth visitors). */
export const getConsentHistoryForSession = cache(
  async (sessionId: string, limit = 25): Promise<ConsentHistoryEntry[]> => {
    try {
      const rows = await prisma.cookieConsent.findMany({
        where: { sessionId },
        orderBy: { updatedAt: 'desc' },
        take: Math.max(1, Math.min(100, limit)),
        select: {
          id: true,
          necessary: true,
          analytics: true,
          marketing: true,
          functional: true,
          version: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      return rows
    } catch {
      return []
    }
  },
)
