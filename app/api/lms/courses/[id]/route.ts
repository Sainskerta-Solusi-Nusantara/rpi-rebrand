/**
 * GET    /api/lms/courses/[id]  — Course detail with modules & lessons.
 * PATCH  /api/lms/courses/[id]  — Update course fields.
 * DELETE /api/lms/courses/[id]  — Delete course (course.delete perm).
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

const courseUpdateSchema = z
  .object({
    title: z.string().min(2).max(200),
    description: z.string().min(10).max(20_000),
    thumbnail: z.string().url().nullable(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    durationHours: z.number().int().min(0).max(10_000),
    instructorId: z.string().cuid().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  })
  .partial()
  .strict()

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        instructor: { select: { id: true, name: true, image: true, headline: true } },
        tenant: { select: { id: true, slug: true, name: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!course) return apiError('NOT_FOUND', 'Course not found.', 404)

    if (course.status !== 'PUBLISHED') {
      const session = await auth()
      if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)
      if (!canAccessTenant(session.user.globalRole, session.user.tenants, course.tenantId)) {
        return apiError('FORBIDDEN', 'You do not have access to this course.', 403)
      }
    }

    return apiSuccess(course)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const course = await prisma.course.findUnique({ where: { id: params.id } })
    if (!course) return apiError('NOT_FOUND', 'Course not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, course.tenantId, 'course.update')) {
      return apiError('FORBIDDEN', 'You do not have permission to update courses.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = courseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid course payload.', 400, parsed.error.issues)
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.status === 'PUBLISHED' && !course.publishedAt) {
      updateData.publishedAt = new Date()
    }

    const updated = await prisma.course.update({ where: { id: course.id }, data: updateData })

    await prisma.auditLog.create({
      data: {
        tenantId: course.tenantId,
        userId,
        action: 'UPDATE',
        resource: 'course',
        resourceId: course.id,
        metadata: { changed: Object.keys(parsed.data) },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const course = await prisma.course.findUnique({ where: { id: params.id } })
    if (!course) return apiError('NOT_FOUND', 'Course not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, course.tenantId, 'course.delete')) {
      return apiError('FORBIDDEN', 'You do not have permission to delete this course.', 403)
    }

    await prisma.course.delete({ where: { id: course.id } })

    await prisma.auditLog.create({
      data: {
        tenantId: course.tenantId,
        userId,
        action: 'DELETE',
        resource: 'course',
        resourceId: course.id,
        metadata: { title: course.title },
      },
    })

    return apiSuccess({ id: course.id, deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
