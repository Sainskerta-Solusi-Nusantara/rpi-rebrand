/**
 * Zod validation schemas for branding payloads.
 *
 * - hex color regex: /^#[0-9A-Fa-f]{6}$/
 * - radius: 0..32 integer
 * - density: 'compact' | 'normal' | 'comfortable'
 * - font heading/body: restricted to a curated safe list (defense in depth
 *   against arbitrary CSS injection through font-family).
 */

import { z } from 'zod'
import { SAFE_BODY_FONTS, SAFE_HEADING_FONTS } from './tokens'

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

export const hexColor = z
  .string()
  .regex(HEX_COLOR_RE, 'Must be a 6-digit hex color, e.g. #0A2540')

export const radiusValue = z.coerce.number().int().min(0).max(32)

export const densityValue = z.enum(['compact', 'normal', 'comfortable'])

export const fontHeadingValue = z.enum(SAFE_HEADING_FONTS as unknown as [string, ...string[]])
export const fontBodyValue = z.enum(SAFE_BODY_FONTS as unknown as [string, ...string[]])

// URLs for logo/favicon — allow absolute https URLs OR root-relative paths.
export const assetUrlValue = z
  .string()
  .max(2048)
  .refine(
    (s) => /^https?:\/\//i.test(s) || s.startsWith('/'),
    'Must be an absolute URL or a root-relative path.',
  )
  .nullable()

/**
 * Full branding update schema. Every field is optional — PATCH semantics.
 * customCss is intentionally limited to a sane upper bound to prevent abuse.
 */
export const brandingUpdateSchema = z
  .object({
    primaryColor: hexColor.optional(),
    primaryForeground: hexColor.optional(),
    secondaryColor: hexColor.optional(),
    secondaryForeground: hexColor.optional(),
    accentColor: hexColor.optional(),
    accentForeground: hexColor.optional(),
    backgroundColor: hexColor.optional(),
    foregroundColor: hexColor.optional(),
    mutedColor: hexColor.optional(),
    mutedForeground: hexColor.optional(),
    borderColor: hexColor.optional(),
    destructiveColor: hexColor.optional(),
    successColor: hexColor.optional(),
    warningColor: hexColor.optional(),
    ringColor: hexColor.optional(),
    fontHeading: fontHeadingValue.optional(),
    fontBody: fontBodyValue.optional(),
    radius: radiusValue.optional(),
    density: densityValue.optional(),
    logoLight: assetUrlValue.optional(),
    logoDark: assetUrlValue.optional(),
    favicon: assetUrlValue.optional(),
    customCss: z.string().max(20_000).nullable().optional(),
  })
  .strict()

export type BrandingUpdate = z.infer<typeof brandingUpdateSchema>

/**
 * Preview schema is the same shape as update, just without a tenant write.
 * Reused so the same payload can be sent to /api/branding/preview to
 * inspect generated CSS without persisting.
 */
export const brandingPreviewSchema = brandingUpdateSchema

export type BrandingPreview = z.infer<typeof brandingPreviewSchema>
