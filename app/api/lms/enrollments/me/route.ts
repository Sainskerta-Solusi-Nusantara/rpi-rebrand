/**
 * GET /api/lms/enrollments/me
 *
 * Return the current user's enrollments with progress + course summary.
 */

import { auth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnail: true,
            level: true,
            durationHours: true,
            tenant: { select: { id: true, slug: true, name: true } },
            _count: { select: { modules: true } },
          },
        },
      },
    })

    const totals = {
      total: enrollments.length,
      completed: enrollments.filter((e) => e.status === 'COMPLETED').length,
      inProgress: enrollments.filter((e) => e.status === 'IN_PROGRESS').length,
    }

    return apiSuccess({ enrollments, totals })
  } catch (err) {
    return handleRouteError(err)
  }
}
