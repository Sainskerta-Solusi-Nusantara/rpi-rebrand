'use client'

/**
 * Public client hook surface for branding.
 *
 * Re-exports `useBranding` from the provider and adds an optional
 * `useBrandingSave` hook that PATCHes /api/branding (with optimistic
 * preview via the ThemeProvider context) and revalidates SWR caches.
 */

import { useCallback, useState } from 'react'
import { mutate as globalMutate } from 'swr'
import { useBranding as useThemeBranding } from './theme-provider'
import type { BrandingTokens } from './tokens'

export { useBranding } from './theme-provider'

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export function useBrandingSave() {
  const { tokens, setTokens } = useThemeBranding()
  const [state, setState] = useState<SaveState>({ status: 'idle' })

  const save = useCallback(
    async (patch: Partial<BrandingTokens>) => {
      setState({ status: 'saving' })

      // Optimistic preview — apply the patch immediately to the live theme.
      const previous = { ...tokens }
      setTokens(patch)

      try {
        const res = await fetch('/api/branding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        const json = (await res.json()) as
          | { ok: true; data: unknown }
          | { ok: false; error: { code: string; message: string } }

        if (!res.ok || !json.ok) {
          // Roll back optimistic preview.
          setTokens(previous)
          const message = !json.ok ? json.error.message : 'Failed to save branding.'
          setState({ status: 'error', message })
          return { ok: false as const, error: message }
        }

        await globalMutate('/api/branding')
        setState({ status: 'success' })
        return { ok: true as const, data: json.data }
      } catch (err) {
        setTokens(previous)
        const message = err instanceof Error ? err.message : 'Network error.'
        setState({ status: 'error', message })
        return { ok: false as const, error: message }
      }
    },
    [tokens, setTokens],
  )

  return { save, state }
}

/**
 * Issue a reset call to /api/branding/reset and revalidate the branding
 * cache. Returns ok/error envelope.
 */
export async function resetBranding() {
  const res = await fetch('/api/branding/reset', { method: 'POST' })
  const json = await res.json()
  await globalMutate('/api/branding')
  return json
}
