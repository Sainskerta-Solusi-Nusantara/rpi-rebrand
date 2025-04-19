/**
 * GET /api/tenants/me
 *
 * Resolve the current tenant from the `x-tenant-slug` header (set by
 * middleware on subdomain requests). Returns tenant identity + plan +
 * brand summary. Used by client components that need tenant info without
 * threading server props down.
 */

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const slug = getTenantSlugFromHeaders(req)
    if (!slug) {
      return apiSuccess({ tenant: null })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        planTier: true,
        status: true,
        createdAt: true,
        branding: {
          select: {
            logoLight: true,
            logoDark: true,
            favicon: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
          },
        },
      },
    })

    if (!tenant) {
      return apiError('TENANT_NOT_FOUND', 'Tenant not found for current subdomain.', 404)
    }

    return apiSuccess({ tenant })
  } catch (err) {
    return handleRouteError(err)
  }
}
