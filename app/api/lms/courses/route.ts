/**
 * GET  /api/lms/courses  — List published courses; tenant-scoped when
 *                          x-tenant-slug present, else cross-tenant.
 * POST /api/lms/courses  — Create a course (tenant course.create perm).
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
  paginated,
  parsePagination,
} from '@/lib/api-helpers'
import { parseQueryTerms } from '@/lib/search/relevance'

const courseCreateSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  description: z.string().min(10).max(20_000),
  thumbnail: z.string().url().nullable().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  durationHours: z.number().int().min(0).max(10_000),
  instructorId: z.string().cuid().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export async function GET(req: NextRequest) {
  try {
    const slug = getTenantSlugFromHeaders(req)
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const level = sp.get('level')?.trim().toUpperCase() ?? ''
    const pagination = parsePagination(sp, 20, 60)

    const where: Prisma.CourseWhereInput = { status: 'PUBLISHED' }
    if (slug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
      where.tenantId = tenant?.id ?? '__none__'
    }
    const terms = parseQueryTerms(q)
    if (terms.length > 0) {
      const and: object[] = terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      }))
      where.AND = and
    }
    if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
      where.level = level as Prisma.CourseWhereInput['level']
    }

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.take,
        include: {
          instructor: { select: { id: true, name: true, image: true } },
          tenant: { select: { id: true, slug: true, name: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
      }),
      prisma.course.count({ where }),
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

    const slug = getTenantSlugFromHeaders(req)
    if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)

    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'course.create')) {
      return apiError('FORBIDDEN', 'You do not have permission to create courses.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = courseCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid course payload.', 400, parsed.error.issues)
    }
    const data = parsed.data

    const course = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        thumbnail: data.thumbnail ?? null,
        level: data.level,
        durationHours: data.durationHours,
        instructorId: data.instructorId ?? userId,
        status: data.status,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId,
        action: 'CREATE',
        resource: 'course',
        resourceId: course.id,
        metadata: { title: course.title },
      },
    })

    return apiSuccess(course, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
