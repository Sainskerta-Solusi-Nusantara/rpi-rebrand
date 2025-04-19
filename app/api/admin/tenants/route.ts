/**
 * GET /api/admin/tenants
 *
 * Cross-tenant listing for SUPERADMIN / ADMIN consoles. Supports search,
 * plan filter, and pagination. Includes basic counts for at-a-glance ops.
 */

import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  apiError,
  apiSuccess,
  handleRouteError,
  paginated,
  parsePagination,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)
    if (!['SUPERADMIN', 'ADMIN'].includes(session.user.globalRole)) {
      return apiError('FORBIDDEN', 'Insufficient role.', 403)
    }

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const plan = sp.get('plan')?.trim().toUpperCase() ?? ''
    const status = sp.get('status')?.trim().toUpperCase() ?? ''
    const pagination = parsePagination(sp, 25, 100)

    const where: Prisma.TenantWhereInput = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { customDomain: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(plan)) {
      where.planTier = plan as Prisma.TenantWhereInput['planTier']
    }
    if (['ACTIVE', 'SUSPENDED', 'PROVISIONING'].includes(status)) {
      where.status = status as Prisma.TenantWhereInput['status']
    }

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          slug: true,
          name: true,
          customDomain: true,
          planTier: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              jobs: true,
              users: true,
              applications: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ])

    return apiSuccess(paginated(items, total, pagination))
  } catch (err) {
    return handleRouteError(err)
  }
}
