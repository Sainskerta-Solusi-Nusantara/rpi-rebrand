/**
 * GET  /api/partners   — Public list of active partners (for marketing).
 * POST /api/partners   — Register a new partner tenant. Creates Tenant +
 *                        default Branding + UserTenant(OWNER) and elevates
 *                        the caller's globalRole to PARTNER if currently USER.
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
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

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/
const RESERVED_SLUGS = new Set(['www', 'app', 'api', 'admin', 'auth', 'static', 'public', 'dashboard'])

const partnerRegisterSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(SLUG_RE, 'Slug must be kebab-case (lowercase letters, digits, hyphens).'),
})

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const pagination = parsePagination(sp, 24, 60)

    const where: Prisma.TenantWhereInput = { status: 'ACTIVE' }
    if (q) {
      const terms = parseQueryTerms(q)
      // Multi-term AND: every term must match in name or slug.
      where.AND = terms.map((term) => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
        ],
      }))
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
          planTier: true,
          createdAt: true,
          branding: { select: { logoLight: true, logoDark: true, primaryColor: true } },
          _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
        },
      }),
      prisma.tenant.count({ where }),
    ])

    return apiSuccess(paginated(items, total, pagination))
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const body = await req.json().catch(() => null)
    const parsed = partnerRegisterSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid registration payload.', 400, parsed.error.issues)
    }
    const { name, slug } = parsed.data
    if (RESERVED_SLUGS.has(slug)) {
      return apiError('SLUG_RESERVED', 'This slug is reserved.', 400)
    }

    const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (existing) return apiError('SLUG_TAKEN', 'This slug is already taken.', 409)

    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          slug,
          name,
          planTier: 'FREE',
          status: 'ACTIVE',
          ownerUserId: session.user.id,
          branding: { create: {} },
          users: {
            create: { userId: session.user.id, role: 'OWNER' },
          },
        },
        include: { branding: true },
      })

      // Promote USER → PARTNER for tenant owners (do not downgrade ADMIN/SUPERADMIN).
      if (session.user.globalRole === 'USER') {
        await tx.user.update({
          where: { id: session.user.id },
          data: { globalRole: 'PARTNER' },
        })
      }

      await tx.auditLog.create({
        data: {
          tenantId: t.id,
          userId: session.user.id,
          action: 'CREATE',
          resource: 'tenant',
          resourceId: t.id,
          metadata: { slug, name },
        },
      })

      return t
    })

    return apiSuccess(tenant, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
