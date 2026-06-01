'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  CONSENT_COOKIE_NAME,
  type CookieCategoryKey,
  type StoredConsent,
} from './cookie-categories'
import { isCategoryAllowed } from './consent-utils'

function readConsentFromCookie(): StoredConsent | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split('; ')
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const name = part.slice(0, eq)
    if (name !== CONSENT_COOKIE_NAME) continue
    try {
      return JSON.parse(decodeURIComponent(part.slice(eq + 1))) as StoredConsent
    } catch {
      return null
    }
  }
  return null
}

type GatedScriptProps = {
  category: CookieCategoryKey
  src: string
  /** Defaults to next/script `afterInteractive`. */
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker'
  id?: string
  /** Inline script body (used when `src` is omitted). */
  children?: string
}

/**
 * Wraps `next/script` so it mounts only after the user opts the given category
 * in. Re-evaluates whenever the consent cookie changes (poll + visibilitychange).
 *
 * Usage:
 *   <GatedScript category="analytics" src="https://plausible.io/js/script.js" />
 */
export function GatedScript({ category, src, strategy, id, children }: GatedScriptProps) {
  const [allowed, setAllowed] = useState<boolean>(false)

  useEffect(() => {
    function check() {
      const prefs = readConsentFromCookie()
      setAllowed(isCategoryAllowed(category, prefs))
    }
    check()
    const onVisibility = () => check()
    document.addEventListener('visibilitychange', onVisibility)
    // Light polling: catches updates from same-tab actions without a refresh.
    const id = window.setInterval(check, 3000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(id)
    }
  }, [category])

  if (!allowed) return null
  if (children && !src) {
    return (
      <Script id={id} strategy={strategy ?? 'afterInteractive'}>
        {children}
      </Script>
    )
  }
  return <Script id={id} src={src} strategy={strategy ?? 'afterInteractive'} />
}
