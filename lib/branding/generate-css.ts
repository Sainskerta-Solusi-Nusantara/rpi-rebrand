/**
 * Branding CSS generator.
 *
 * Produces a `:root { ... }` block that the ThemeProvider injects at the
 * document root. Each token maps to a CSS custom property consumed by
 * Tailwind's shadcn-style theme tokens (e.g. `--primary`, `--background`).
 *
 * NOTE: tokens are stored as hex by Prisma; we keep them as hex here
 * (the design system's tailwind preset reads them via hsl-from-var helpers
 * or directly with `bg-[color:var(--primary)]` patterns).
 */

import { DEFAULT_TOKENS, type BrandingTokens } from './tokens'
import { safeCssColor } from '@/lib/security/sanitize'

const FONT_FALLBACK_SERIF = 'ui-serif, Georgia, serif'
const FONT_FALLBACK_SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** Density → spacing/scale modifier exposed to the design system. */
const DENSITY_SCALE: Record<BrandingTokens['density'], number> = {
  compact: 0.875,
  normal: 1,
  comfortable: 1.125,
}

/**
 * Generate the `:root { ... }` rule for a given partial token set. Any
 * missing key falls back to `DEFAULT_TOKENS`. Returns a single-line string
 * suitable for injection into a `<style>` tag.
 */
export function generateBrandingCss(t: Partial<BrandingTokens> = {}): string {
  const merged: BrandingTokens = { ...DEFAULT_TOKENS, ...t }

  const radiusPx = clampInt(merged.radius, 0, 32, DEFAULT_TOKENS.radius)
  const density = merged.density in DENSITY_SCALE ? merged.density : 'normal'
  const densityScale = DENSITY_SCALE[density as BrandingTokens['density']]

  const heading = cssQuoteFont(merged.fontHeading)
  const body = cssQuoteFont(merged.fontBody)

  // Color values are injected into a raw <style>; sanitize every one against a
  // safe-color allowlist (falling back to the default token) so a malformed or
  // malicious stored color can never break out of the declaration / <style>.
  // This holds regardless of which write path validated the value.
  const c = (key: keyof BrandingTokens) =>
    safeCssColor(merged[key] as string, DEFAULT_TOKENS[key] as string)

  // Color tokens — exposed both via descriptive names and shadcn-style aliases.
  const decls: string[] = [
    // Primary
    `--primary:${c('primaryColor')}`,
    `--primary-foreground:${c('primaryForeground')}`,
    // Secondary
    `--secondary:${c('secondaryColor')}`,
    `--secondary-foreground:${c('secondaryForeground')}`,
    // Accent
    `--accent:${c('accentColor')}`,
    `--accent-foreground:${c('accentForeground')}`,
    // Surfaces
    `--background:${c('backgroundColor')}`,
    `--foreground:${c('foregroundColor')}`,
    `--muted:${c('mutedColor')}`,
    `--muted-foreground:${c('mutedForeground')}`,
    `--border:${c('borderColor')}`,
    `--input:${c('borderColor')}`,
    `--card:${c('backgroundColor')}`,
    `--card-foreground:${c('foregroundColor')}`,
    `--popover:${c('backgroundColor')}`,
    `--popover-foreground:${c('foregroundColor')}`,
    // Status
    `--destructive:${c('destructiveColor')}`,
    `--destructive-foreground:#FFFFFF`,
    `--success:${c('successColor')}`,
    `--warning:${c('warningColor')}`,
    `--ring:${c('ringColor')}`,
    // Shape & density
    `--radius:${radiusPx}px`,
    `--density-scale:${densityScale}`,
    // Typography
    `--font-heading:${heading}, ${FONT_FALLBACK_SERIF}`,
    `--font-body:${body}, ${FONT_FALLBACK_SANS}`,
    `--font-sans:${body}, ${FONT_FALLBACK_SANS}`,
  ]

  return `:root{${decls.join(';')};}`
}

/**
 * Quote a font-family name for safe CSS embedding. This CSS is injected into a
 * raw <style> tag, so we must allow ONLY safe font-name characters — anything
 * else (`<`, `>`, `;`, `{`, `}`, quotes) could terminate the declaration or the
 * <style> element (the HTML parser ends a <style> at a literal `</style` even
 * inside CSS quotes) and inject markup. An allowlist is used rather than a
 * blocklist so no escape sequence is missed.
 */
function cssQuoteFont(name: string): string {
  const cleaned = (name ?? '').replace(/[^A-Za-z0-9 _-]/g, '').trim().slice(0, 48)
  if (!cleaned) return `'Inter'`
  return `'${cleaned}'`
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}
