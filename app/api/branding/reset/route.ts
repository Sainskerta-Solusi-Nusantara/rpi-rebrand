/**
 * POST /api/branding/reset
 *
 * Resets the current tenant's branding to RPI defaults by deleting the
 * Branding row (Prisma will recreate with column defaults on next upsert)
 * or re-writing to defaults explicitly. We chose to upsert with defaults
 * so the row remains for audit and consistent reads.
 */

import { revalidateTag } from 'next/cache'
import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'
import { DEFAULT_TOKENS } from '@/lib/branding/tokens'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const slug = getTenantSlugFromHeaders(req)
    if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)

    const tenant = await prisma.tenant.findUnique({ where: { slug } })
    if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)

    const { globalRole, tenants } = session.user
    if (!canAccessTenant(globalRole, tenants, tenant.id)) {
      return apiError('FORBIDDEN', 'You do not have access to this tenant.', 403)
    }
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'branding.update')) {
      return apiError('FORBIDDEN', 'You do not have permission to reset branding.', 403)
    }

    const defaults = {
      primaryColor: DEFAULT_TOKENS.primaryColor,
      primaryForeground: DEFAULT_TOKENS.primaryForeground,
      secondaryColor: DEFAULT_TOKENS.secondaryColor,
      secondaryForeground: DEFAULT_TOKENS.secondaryForeground,
      accentColor: DEFAULT_TOKENS.accentColor,
      accentForeground: DEFAULT_TOKENS.accentForeground,
      backgroundColor: DEFAULT_TOKENS.backgroundColor,
      foregroundColor: DEFAULT_TOKENS.foregroundColor,
      mutedColor: DEFAULT_TOKENS.mutedColor,
      mutedForeground: DEFAULT_TOKENS.mutedForeground,
      borderColor: DEFAULT_TOKENS.borderColor,
      destructiveColor: DEFAULT_TOKENS.destructiveColor,
      successColor: DEFAULT_TOKENS.successColor,
      warningColor: DEFAULT_TOKENS.warningColor,
      ringColor: DEFAULT_TOKENS.ringColor,
      fontHeading: DEFAULT_TOKENS.fontHeading,
      fontBody: DEFAULT_TOKENS.fontBody,
      radius: DEFAULT_TOKENS.radius,
      density: DEFAULT_TOKENS.density,
      logoLight: null,
      logoDark: null,
      favicon: null,
      customCss: null,
    }

    const updated = await prisma.branding.upsert({
      where: { tenantId: tenant.id },
      create: { tenantId: tenant.id, ...defaults },
      update: defaults,
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'branding.reset',
        resourceId: updated.id,
      },
    })

    revalidateTag(`branding-${slug}`)

    return apiSuccess({ tokens: DEFAULT_TOKENS })
  } catch (err) {
    return handleRouteError(err)
  }
}
