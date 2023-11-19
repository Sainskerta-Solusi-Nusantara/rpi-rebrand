'use client'

/**
 * Client-side branding ThemeProvider.
 *
 * Wraps the app and:
 *   1. Holds the active token set in React state.
 *   2. Generates a `:root { ... }` CSS string via `generateBrandingCss`.
 *   3. Injects (or updates) a single <style id="rpi-branding"> tag in <head>.
 *
 * The `initial` prop is normally seeded from the server using tokens from
 * `getTenantBranding`. Children can call `useBranding()` to read or mutate
 * the live theme (used by the partner branding settings page for preview).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_TOKENS, type BrandingTokens } from './tokens'
import { generateBrandingCss } from './generate-css'

type ThemeContextValue = {
  tokens: BrandingTokens
  setTokens: (next: Partial<BrandingTokens>) => void
  replaceTokens: (next: BrandingTokens) => void
  reset: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export type ThemeProviderProps = {
  initial?: Partial<BrandingTokens>
  customCss?: string | null
  children: ReactNode
}

export function ThemeProvider({ initial, customCss, children }: ThemeProviderProps) {
  const [tokens, setTokensState] = useState<BrandingTokens>({
    ...DEFAULT_TOKENS,
    ...(initial ?? {}),
  })

  const setTokens = useCallback((next: Partial<BrandingTokens>) => {
    setTokensState((prev) => ({ ...prev, ...next }))
  }, [])

  const replaceTokens = useCallback((next: BrandingTokens) => {
    setTokensState(next)
  }, [])

  const reset = useCallback(() => {
    setTokensState({ ...DEFAULT_TOKENS })
  }, [])

  const css = useMemo(() => {
    const base = generateBrandingCss(tokens)
    return customCss ? `${base}\n${customCss}` : base
  }, [tokens, customCss])

  const value = useMemo<ThemeContextValue>(
    () => ({ tokens, setTokens, replaceTokens, reset }),
    [tokens, setTokens, replaceTokens, reset],
  )

  return (
    <ThemeContext.Provider value={value}>
      {/*
        Inject the brand stylesheet at the top of the tree. Using
        dangerouslySetInnerHTML keeps the rules in a single block — React
        will diff the innerHTML when `css` changes, giving us live preview
        without remounting.
      */}
      <style
        id="rpi-branding"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: css }}
      />
      {children}
    </ThemeContext.Provider>
  )
}

export function useBranding(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useBranding() must be used within a <ThemeProvider>.')
  }
  return ctx
}
