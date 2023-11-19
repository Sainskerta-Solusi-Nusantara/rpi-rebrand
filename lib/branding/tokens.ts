/**
 * Branding tokens — canonical default theme + token type.
 *
 * These are the brand defaults used when a tenant has no Branding row
 * (or for the apex / marketing site). Values match prisma defaults on the
 * Branding model so the merge in `getTenantBranding` is idempotent.
 */

export const DEFAULT_TOKENS = {
  // Brand palette
  primaryColor: '#0A2540',
  primaryForeground: '#FFFFFF',
  secondaryColor: '#C9A961',
  secondaryForeground: '#0A2540',
  accentColor: '#635BFF',
  accentForeground: '#FFFFFF',

  // Surfaces
  backgroundColor: '#FFFFFF',
  foregroundColor: '#0A2540',
  mutedColor: '#F5F5F4',
  mutedForeground: '#6B7280',
  borderColor: '#E5E7EB',

  // Status
  destructiveColor: '#EF4444',
  successColor: '#10B981',
  warningColor: '#F59E0B',
  ringColor: '#C9A961',

  // Typography
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',

  // Shape & density
  radius: 12,
  density: 'normal' as 'compact' | 'normal' | 'comfortable',

  // Brand assets
  logoLight: null as string | null,
  logoDark: null as string | null,
  favicon: null as string | null,
} as const

export type BrandingTokens = {
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  accentColor: string
  accentForeground: string
  backgroundColor: string
  foregroundColor: string
  mutedColor: string
  mutedForeground: string
  borderColor: string
  destructiveColor: string
  successColor: string
  warningColor: string
  ringColor: string
  fontHeading: string
  fontBody: string
  radius: number
  density: 'compact' | 'normal' | 'comfortable'
  logoLight: string | null
  logoDark: string | null
  favicon: string | null
}

/** All branding color keys — useful for iteration. */
export const COLOR_TOKEN_KEYS = [
  'primaryColor',
  'primaryForeground',
  'secondaryColor',
  'secondaryForeground',
  'accentColor',
  'accentForeground',
  'backgroundColor',
  'foregroundColor',
  'mutedColor',
  'mutedForeground',
  'borderColor',
  'destructiveColor',
  'successColor',
  'warningColor',
  'ringColor',
] as const satisfies readonly (keyof BrandingTokens)[]

export type ColorTokenKey = (typeof COLOR_TOKEN_KEYS)[number]

/** Safe-list of font-family names the UI is allowed to switch to. */
export const SAFE_HEADING_FONTS = [
  'Playfair Display',
  'Inter',
  'Poppins',
  'Montserrat',
  'Merriweather',
  'Lora',
  'DM Serif Display',
] as const

export const SAFE_BODY_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Source Sans 3',
  'Nunito',
  'IBM Plex Sans',
] as const

export type SafeHeadingFont = (typeof SAFE_HEADING_FONTS)[number]
export type SafeBodyFont = (typeof SAFE_BODY_FONTS)[number]
