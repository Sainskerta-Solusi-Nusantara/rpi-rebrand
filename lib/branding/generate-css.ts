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

  // Color tokens — exposed both via descriptive names and shadcn-style aliases.
  const decls: string[] = [
    // Primary
    `--primary:${merged.primaryColor}`,
    `--primary-foreground:${merged.primaryForeground}`,
    // Secondary
    `--secondary:${merged.secondaryColor}`,
    `--secondary-foreground:${merged.secondaryForeground}`,
    // Accent
    `--accent:${merged.accentColor}`,
    `--accent-foreground:${merged.accentForeground}`,
    // Surfaces
    `--background:${merged.backgroundColor}`,
    `--foreground:${merged.foregroundColor}`,
    `--muted:${merged.mutedColor}`,
    `--muted-foreground:${merged.mutedForeground}`,
    `--border:${merged.borderColor}`,
    `--input:${merged.borderColor}`,
    `--card:${merged.backgroundColor}`,
    `--card-foreground:${merged.foregroundColor}`,
    `--popover:${merged.backgroundColor}`,
    `--popover-foreground:${merged.foregroundColor}`,
    // Status
    `--destructive:${merged.destructiveColor}`,
    `--destructive-foreground:#FFFFFF`,
    `--success:${merged.successColor}`,
    `--warning:${merged.warningColor}`,
    `--ring:${merged.ringColor}`,
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
 * Quote a font-family name for safe CSS embedding. Names containing
 * spaces are wrapped in single quotes; single quotes inside the name are
 * stripped defensively (validate.ts already restricts to a safe list).
 */
function cssQuoteFont(name: string): string {
  const cleaned = name.replace(/['"\\;{}]/g, '').trim()
  if (!cleaned) return `'Inter'`
  return /\s/.test(cleaned) ? `'${cleaned}'` : `'${cleaned}'`
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}
