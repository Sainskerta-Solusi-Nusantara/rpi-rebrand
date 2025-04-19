/**
 * POST /api/lms/courses/[id]/enroll
 *
 * Enroll the current user in a published course. Idempotent.
 */

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

type Ctx = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, tenantId: true, title: true },
    })
    if (!course) return apiError('NOT_FOUND', 'Course not found.', 404)
    if (course.status !== 'PUBLISHED') {
      return apiError('COURSE_UNAVAILABLE', 'This course is not open for enrollment.', 400)
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      create: { userId: session.user.id, courseId: course.id },
      update: {},
    })

    await prisma.auditLog.create({
      data: {
        tenantId: course.tenantId,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'enrollment',
        resourceId: enrollment.id,
        metadata: { courseId: course.id, courseTitle: course.title },
      },
    })

    return apiSuccess(enrollment, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
