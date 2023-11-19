/**
 * Server-side branding resolution.
 *
 * `getTenantBranding(slug)` loads the Tenant + Branding row for a given
 * subdomain slug and merges with `DEFAULT_TOKENS`. Wrapped in React.cache()
 * so multiple Server Components in the same request reuse one DB hit.
 *
 * If slug is null (apex domain) or the tenant has no Branding row, the
 * default brand is returned with a null tenantId.
 */

import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { DEFAULT_TOKENS, type BrandingTokens } from './tokens'

export type ResolvedBranding = {
  tenant: {
    id: string
    slug: string
    name: string
    planTier: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
  } | null
  tokens: BrandingTokens
  customCss: string | null
}

/**
 * Load the resolved branding for a tenant slug.
 *
 * Note: this intentionally does NOT use withTenantContext. The branding row
 * must be readable cross-tenant (the apex marketing page may render a
 * tenant's brand preview). RLS policies are expected to allow Tenant/Branding
 * reads for unauthenticated requests.
 */
export const getTenantBranding = cache(async (slug: string | null): Promise<ResolvedBranding> => {
  if (!slug) {
    return { tenant: null, tokens: { ...DEFAULT_TOKENS }, customCss: null }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { branding: true },
  })

  if (!tenant) {
    return { tenant: null, tokens: { ...DEFAULT_TOKENS }, customCss: null }
  }

  const b = tenant.branding
  const tokens: BrandingTokens = b
    ? {
        primaryColor: b.primaryColor,
        primaryForeground: b.primaryForeground,
        secondaryColor: b.secondaryColor,
        secondaryForeground: b.secondaryForeground,
        accentColor: b.accentColor,
        accentForeground: b.accentForeground,
        backgroundColor: b.backgroundColor,
        foregroundColor: b.foregroundColor,
        mutedColor: b.mutedColor,
        mutedForeground: b.mutedForeground,
        borderColor: b.borderColor,
        destructiveColor: b.destructiveColor,
        successColor: b.successColor,
        warningColor: b.warningColor,
        ringColor: b.ringColor,
        fontHeading: b.fontHeading,
        fontBody: b.fontBody,
        radius: b.radius,
        density: (b.density === 'compact' || b.density === 'comfortable' ? b.density : 'normal') as BrandingTokens['density'],
        logoLight: b.logoLight,
        logoDark: b.logoDark,
        favicon: b.favicon,
      }
    : { ...DEFAULT_TOKENS }

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      planTier: tenant.planTier,
    },
    tokens,
    customCss: b?.customCss ?? null,
  }
})

/** Convenience: tokens only. */
export async function getTenantTokens(slug: string | null): Promise<BrandingTokens> {
  const resolved = await getTenantBranding(slug)
  return resolved.tokens
}
