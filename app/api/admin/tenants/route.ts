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
import { parseQueryTerms } from '@/lib/search/relevance'

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

    const and: Prisma.TenantWhereInput[] = []
    if (q) {
      const terms = parseQueryTerms(q)
      for (const term of terms) {
        and.push({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
            { customDomain: { contains: term, mode: 'insensitive' } },
          ],
        })
      }
    }

    const where: Prisma.TenantWhereInput = {
      ...(and.length ? { AND: and } : {}),
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
