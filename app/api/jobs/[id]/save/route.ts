/**
 * POST   /api/jobs/[id]/save   — Add job to current user's saved list.
 * DELETE /api/jobs/[id]/save   — Remove job from saved list.
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

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })
    if (!job) return apiError('NOT_FOUND', 'Job not found.', 404)

    const saved = await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
      create: { userId: session.user.id, jobId: job.id },
      update: {},
    })

    return apiSuccess(saved)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    await prisma.savedJob
      .delete({
        where: { userId_jobId: { userId: session.user.id, jobId: params.id } },
      })
      .catch(() => null)

    return apiSuccess({ id: params.id, saved: false })
  } catch (err) {
    return handleRouteError(err)
  }
}
