import { getCurrentConsent } from '@/lib/consent/consent-queries'
import { CookieConsentBanner } from './cookie-consent-banner'

/**
 * Server-component wrapper. Reads the consent cookie via `getCurrentConsent()`
 * and only mounts the (client) banner when `needsBanner` is true. Place once
 * at the bottom of the root layout — it has zero impact on the page tree when
 * consent is already on file.
 */
export async function CookieConsentMount() {
  const { prefs, needsBanner } = await getCurrentConsent().catch(() => ({
    prefs: null,
    needsBanner: false,
    sessionId: null,
  }))
  if (!needsBanner) return null
  return <CookieConsentBanner initialPrefs={prefs} />
}
