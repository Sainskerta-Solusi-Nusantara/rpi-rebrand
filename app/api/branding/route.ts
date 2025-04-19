/**
 * GET  /api/branding   — Resolve current tenant from x-tenant-slug; return
 *                       merged BrandingTokens (defaults when no tenant).
 * PATCH /api/branding  — Update current tenant branding. Requires PARTNER
 *                       or ADMIN globally + tenant write permission.
 */

import { revalidateTag } from 'next/cache'
import { type NextRequest } from 'next/server'
import type { Branding } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'
import { brandingUpdateSchema } from '@/lib/branding/validate'
import { DEFAULT_TOKENS } from '@/lib/branding/tokens'

export async function GET(req: NextRequest) {
  try {
    const slug = getTenantSlugFromHeaders(req)
    if (!slug) {
      return apiSuccess({ tenant: null, tokens: DEFAULT_TOKENS, customCss: null })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { branding: true },
    })

    if (!tenant) {
      return apiSuccess({ tenant: null, tokens: DEFAULT_TOKENS, customCss: null })
    }

    const b = tenant.branding
    return apiSuccess({
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, planTier: tenant.planTier },
      tokens: b ? mergeBranding(b) : DEFAULT_TOKENS,
      customCss: b?.customCss ?? null,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const slug = getTenantSlugFromHeaders(req)
    if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)

    const tenant = await prisma.tenant.findUnique({ where: { slug } })
    if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)

    // Authorization: SUPERADMIN bypasses; otherwise require branding.update
    // permission within this specific tenant.
    const { globalRole, tenants } = session.user
    if (!canAccessTenant(globalRole, tenants, tenant.id)) {
      return apiError('FORBIDDEN', 'You do not have access to this tenant.', 403)
    }
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'branding.update')) {
      return apiError('FORBIDDEN', 'You do not have permission to update branding.', 403)
    }

    const json = await req.json().catch(() => null)
    const parsed = brandingUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid branding payload.', 400, parsed.error.issues)
    }

    const updated = await prisma.branding.upsert({
      where: { tenantId: tenant.id },
      create: { tenantId: tenant.id, ...parsed.data },
      update: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'branding',
        resourceId: updated.id,
        metadata: { changed: Object.keys(parsed.data) },
      },
    })

    revalidateTag(`branding-${slug}`)

    return apiSuccess({
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, planTier: tenant.planTier },
      tokens: mergeBranding(updated),
      customCss: updated.customCss,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}

function mergeBranding(b: Branding) {
  return {
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
    density: b.density,
    logoLight: b.logoLight,
    logoDark: b.logoDark,
    favicon: b.favicon,
  }
}
