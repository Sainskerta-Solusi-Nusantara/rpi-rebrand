/**
 * Cookie category metadata used by the consent banner + Privacy Center.
 *
 * Bump `CONSENT_VERSION` whenever the category list or category meaning
 * materially changes — that invalidates any previously-saved cookie so
 * users are re-prompted (UU PDP / GDPR re-consent requirement).
 */

export type CookieCategoryKey = 'necessary' | 'analytics' | 'marketing' | 'functional'

export type CookieCategory = {
  key: CookieCategoryKey
  label: string
  description: string
  /** True for `necessary` — cannot be toggled off. */
  locked: boolean
  /** Cookie / vendor names shown in the disclosure list. */
  examples: string[]
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    key: 'necessary',
    label: 'Diperlukan',
    description: 'Autentikasi, sesi login, keranjang belanja',
    locked: true,
    examples: ['session', 'csrf_token', 'auth.session-token'],
  },
  {
    key: 'analytics',
    label: 'Analitik',
    description: 'Membantu kami memahami perilaku pengguna untuk perbaikan',
    locked: false,
    examples: ['google_analytics', 'plausible'],
  },
  {
    key: 'marketing',
    label: 'Pemasaran',
    description: 'Iklan yang dipersonalisasi dan kampanye',
    locked: false,
    examples: ['fb_pixel', 'linkedin_insight'],
  },
  {
    key: 'functional',
    label: 'Fungsional',
    description: 'Preferensi tampilan, bahasa, dan integrasi pihak ketiga',
    locked: false,
    examples: ['theme', 'locale', 'youtube_embed'],
  },
]

/**
 * Increment this whenever COOKIE_CATEGORIES is changed in a way that requires
 * users to re-confirm. The banner uses this to detect stale consent cookies.
 */
export const CONSENT_VERSION = 1

/** Cookie that stores the consent prefs object (JSON-encoded). */
export const CONSENT_COOKIE_NAME = 'rpi_consent'

/** Cookie that stores the anonymous session id (UUID) for DB pinning. */
export const SESSION_COOKIE_NAME = 'rpi_consent_session'

/** Shape persisted both in the cookie and (via columns) in `cookie_consents`. */
export type ConsentPrefs = {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export type StoredConsent = ConsentPrefs & {
  version: number
  savedAt: string
}

export const DEFAULT_PREFS: ConsentPrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
}
