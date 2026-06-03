/**
 * GET /api/users  — Admin user listing with pagination & search.
 *
 * Requires SUPERADMIN or ADMIN. PARTNER/USER are forbidden — they should
 * use /api/team for tenant-scoped membership lists instead.
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

    const allowed = ['SUPERADMIN', 'ADMIN']
    if (!allowed.includes(session.user.globalRole)) {
      return apiError('FORBIDDEN', 'Insufficient role.', 403)
    }

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const role = sp.get('role')?.trim().toUpperCase() ?? ''
    const status = sp.get('status')?.trim().toUpperCase() ?? ''
    const pagination = parsePagination(sp, 25, 100)

    const terms = parseQueryTerms(q)
    const termClauses: Prisma.UserWhereInput[] = terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    }))

    const where: Prisma.UserWhereInput = {
      ...(termClauses.length ? { AND: termClauses } : {}),
    }
    if (['SUPERADMIN', 'ADMIN', 'PARTNER', 'USER'].includes(role)) {
      where.globalRole = role as Prisma.UserWhereInput['globalRole']
    }
    if (['ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'].includes(status)) {
      where.status = status as Prisma.UserWhereInput['status']
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          globalRole: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return apiSuccess(paginated(items, total, pagination))
  } catch (err) {
    return handleRouteError(err)
  }
}
