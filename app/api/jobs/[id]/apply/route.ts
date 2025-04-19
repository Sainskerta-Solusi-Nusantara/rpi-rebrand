/**
 * POST /api/jobs/[id]/apply
 *
 * Submit an application to a published job. Idempotent on (jobId, userId).
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

const applySchema = z.object({
  resumeUrl: z.string().url().optional().nullable(),
  coverLetter: z.string().max(20_000).optional().nullable(),
})

type Ctx = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      select: { id: true, tenantId: true, status: true, title: true },
    })
    if (!job) return apiError('NOT_FOUND', 'Job not found.', 404)
    if (job.status !== 'PUBLISHED') {
      return apiError('JOB_UNAVAILABLE', 'This job is not accepting applications.', 400)
    }

    const body = await req.json().catch(() => ({}))
    const parsed = applySchema.safeParse(body ?? {})
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid application payload.', 400, parsed.error.issues)
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_userId: { jobId: job.id, userId: session.user.id } },
    })
    if (existing) {
      return apiError('ALREADY_APPLIED', 'You have already applied to this job.', 409, {
        applicationId: existing.id,
      })
    }

    const application = await prisma.application.create({
      data: {
        tenantId: job.tenantId,
        jobId: job.id,
        userId: session.user.id,
        resumeUrl: parsed.data.resumeUrl ?? null,
        coverLetter: parsed.data.coverLetter ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: job.tenantId,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'application',
        resourceId: application.id,
        metadata: { jobId: job.id, jobTitle: job.title },
      },
    })

    return apiSuccess(application, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
