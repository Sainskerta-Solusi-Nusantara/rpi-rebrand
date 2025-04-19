/**
 * GET /api/categories
 *
 * Public list of job categories with PUBLISHED job counts. When called on
 * a tenant subdomain the count is scoped to that tenant; on apex the
 * count is cross-tenant.
 */

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const slug = getTenantSlugFromHeaders(req)
    let tenantId: string | null = null
    if (slug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
      tenantId = tenant?.id ?? null
    }

    const categories = await prisma.jobCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            jobs: {
              where: {
                status: 'PUBLISHED',
                ...(tenantId ? { tenantId } : {}),
              },
            },
          },
        },
      },
    })

    return apiSuccess(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        parentId: c.parentId,
        jobCount: c._count.jobs,
      })),
    )
  } catch (err) {
    return handleRouteError(err)
  }
}
