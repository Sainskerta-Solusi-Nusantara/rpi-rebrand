'use server'

import { randomUUID } from 'crypto'
import { cookies, headers } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  SESSION_COOKIE_NAME,
  type ConsentPrefs,
  type StoredConsent,
} from './cookie-categories'

export type ConsentActionResult =
  | { ok: true; prefs: StoredConsent }
  | { ok: false; error: string }

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

/**
 * Get the anonymous session cookie used to pin DB rows for not-yet-logged-in
 * visitors. If absent, mint a new UUID and set it (1 year, HTTP-only off so
 * the client-side gating helper can read it for script gating).
 */
function getOrCreateSessionId(): string {
  const jar = cookies()
  const existing = jar.get(SESSION_COOKIE_NAME)?.value
  if (existing && existing.length >= 8) return existing
  const fresh = randomUUID()
  jar.set(SESSION_COOKIE_NAME, fresh, {
    httpOnly: false, // readable by client gate helper
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  })
  return fresh
}

function writeConsentCookie(stored: StoredConsent) {
  cookies().set(CONSENT_COOKIE_NAME, JSON.stringify(stored), {
    httpOnly: false, // client-side script gating reads this
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  })
}

/**
 * Persist the consent decision:
 *  1. Ensure SESSION_COOKIE_NAME exists.
 *  2. Write CONSENT_COOKIE_NAME with the new prefs + version + savedAt.
 *  3. Upsert a CookieConsent row keyed by (sessionId, userId).
 *     There is no compound unique index so we emulate upsert with findFirst.
 *  4. Audit `consent.cookie.updated`.
 *
 * Never throws — DB / audit failures degrade gracefully (cookie is still set
 * so the user is not re-prompted on every page).
 */
async function persistConsent(prefs: ConsentPrefs): Promise<ConsentActionResult> {
  const sessionId = getOrCreateSessionId()
  const session = await auth().catch(() => null)
  const userId = session?.user?.id ?? null

  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    necessary: true, // always true regardless of input
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    functional: Boolean(prefs.functional),
    savedAt: new Date().toISOString(),
  }

  writeConsentCookie(stored)

  const meta = getRequestMeta()

  try {
    const existing = await prisma.cookieConsent.findFirst({
      where: { sessionId, userId: userId ?? undefined },
      select: { id: true },
    })

    if (existing) {
      await prisma.cookieConsent.update({
        where: { id: existing.id },
        data: {
          userId, // link if previously anon and now logged in
          necessary: true,
          analytics: stored.analytics,
          marketing: stored.marketing,
          functional: stored.functional,
          version: CONSENT_VERSION,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    } else {
      await prisma.cookieConsent.create({
        data: {
          sessionId,
          userId,
          necessary: true,
          analytics: stored.analytics,
          marketing: stored.marketing,
          functional: stored.functional,
          version: CONSENT_VERSION,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    }
  } catch (err) {
    console.error('[persistConsent] DB write failed', err)
    // Cookie is already set; surface success so UX is not blocked.
  }

  // AuditLog requires userId (non-nullable FK to User). Skip for anonymous
  // visitors — the CookieConsent row itself is the authoritative record.
  if (userId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          resource: 'consent.cookie.updated',
          resourceId: sessionId,
          metadata: {
            prefs: {
              analytics: stored.analytics,
              marketing: stored.marketing,
              functional: stored.functional,
            },
            version: CONSENT_VERSION,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    } catch (err) {
      console.error('[persistConsent] audit write failed', err)
    }
  }

  return { ok: true, prefs: stored }
}

/** Opt in to every category. */
export async function acceptAllCookies(): Promise<ConsentActionResult> {
  return persistConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    functional: true,
  })
}

/** Opt out of everything optional; only `necessary` stays on. */
export async function rejectAllNonEssentialCookies(): Promise<ConsentActionResult> {
  return persistConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  })
}

/** Persist a custom mix from the Privacy Center / banner accordion. */
export async function saveCustomConsent(prefs: {
  analytics: boolean
  marketing: boolean
  functional: boolean
}): Promise<ConsentActionResult> {
  return persistConsent({
    necessary: true,
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    functional: Boolean(prefs.functional),
  })
}

/**
 * Convenience wrapper for <form action={...}> usage. Reads checkbox values
 * from FormData. Necessary is always coerced to true.
 */
export async function saveCustomConsentFromForm(
  formData: FormData,
): Promise<ConsentActionResult> {
  return saveCustomConsent({
    analytics: formData.get('analytics') === 'on' || formData.get('analytics') === 'true',
    marketing: formData.get('marketing') === 'on' || formData.get('marketing') === 'true',
    functional: formData.get('functional') === 'on' || formData.get('functional') === 'true',
  })
}
