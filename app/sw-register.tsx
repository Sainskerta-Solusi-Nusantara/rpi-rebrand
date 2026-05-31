'use client'

import { useEffect } from 'react'

/**
 * Registers the /sw.js service worker once on the client.
 *
 * Mounted from the dashboard layout. It is a no-op when the browser does not
 * support service workers (e.g. older Safari, in-app browsers) and it never
 * throws — failures are logged to the console only so they cannot break the
 * dashboard shell render.
 *
 * The dashboard layout is a server component, so we use this small client
 * component (instead of an inline <script>) to keep the registration logic
 * type-checked and easy to remove later.
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    let cancelled = false
    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration('/sw.js')
        if (existing) return
        if (cancelled) return
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[sw] registration failed', err)
      }
    }
    register()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
