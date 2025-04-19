/**
 * GET    /api/jobs/[id] — Read a single job by id (public if PUBLISHED,
 *                        otherwise requires tenant access).
 * PATCH  /api/jobs/[id] — Update job fields (tenant write perm).
 * DELETE /api/jobs/[id] — Hard delete (tenant job.delete perm) — typically
 *                        prefer PATCH status=ARCHIVED in UX.
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

const employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] as const
const experienceLevels = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'] as const
const locationTypes = ['ONSITE', 'HYBRID', 'REMOTE'] as const
const jobStatuses = ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED'] as const

const jobUpdateSchema = z
  .object({
    title: z.string().min(2).max(200),
    description: z.string().min(20).max(20_000),
    responsibilities: z.string().max(20_000).nullable(),
    requirements: z.string().max(20_000).nullable(),
    benefits: z.string().max(20_000).nullable(),
    salaryMin: z.number().int().nonnegative().nullable(),
    salaryMax: z.number().int().nonnegative().nullable(),
    salaryCurrency: z.string().length(3),
    salaryPeriod: z.enum(['hour', 'day', 'week', 'month', 'year']),
    employmentType: z.enum(employmentTypes),
    experienceLevel: z.enum(experienceLevels),
    location: z.string().min(2).max(200),
    locationType: z.enum(locationTypes),
    categoryId: z.string().cuid().nullable(),
    tags: z.array(z.string().min(1).max(40)).max(20),
    status: z.enum(jobStatuses),
  })
  .partial()
  .strict()

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        tenant: { select: { id: true, slug: true, name: true, planTier: true } },
        postedBy: { select: { id: true, name: true, image: true } },
      },
    })
    if (!job) return apiError('NOT_FOUND', 'Job not found.', 404)

    if (job.status !== 'PUBLISHED') {
      const session = await auth()
      if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)
      if (!canAccessTenant(session.user.globalRole, session.user.tenants, job.tenantId)) {
        return apiError('FORBIDDEN', 'You do not have access to this job.', 403)
      }
    }

    // Increment view count for published jobs (fire-and-forget).
    if (job.status === 'PUBLISHED') {
      prisma.job.update({ where: { id: job.id }, data: { views: { increment: 1 } } }).catch(() => {})
    }

    return apiSuccess(job)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const job = await prisma.job.findUnique({ where: { id: params.id } })
    if (!job) return apiError('NOT_FOUND', 'Job not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, job.tenantId, 'job.update')) {
      return apiError('FORBIDDEN', 'You do not have permission to update this job.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = jobUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid job payload.', 400, parsed.error.issues)
    }

    const data = parsed.data
    if (
      data.salaryMin != null &&
      data.salaryMax != null &&
      data.salaryMin > data.salaryMax
    ) {
      return apiError('VALIDATION_ERROR', 'salaryMin must be <= salaryMax.', 400)
    }

    // Maintain publishedAt when transitioning to PUBLISHED.
    const updateData: Record<string, unknown> = { ...data }
    if (data.status === 'PUBLISHED' && !job.publishedAt) {
      if (!hasTenantPermission(globalRole, tenants, job.tenantId, 'job.publish')) {
        return apiError('FORBIDDEN', 'You do not have permission to publish jobs.', 403)
      }
      updateData.publishedAt = new Date()
    }

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        tenantId: job.tenantId,
        userId,
        action: 'UPDATE',
        resource: 'job',
        resourceId: job.id,
        metadata: { changed: Object.keys(data) },
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

    const job = await prisma.job.findUnique({ where: { id: params.id } })
    if (!job) return apiError('NOT_FOUND', 'Job not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, job.tenantId, 'job.delete')) {
      return apiError('FORBIDDEN', 'You do not have permission to delete this job.', 403)
    }

    await prisma.job.delete({ where: { id: job.id } })

    await prisma.auditLog.create({
      data: {
        tenantId: job.tenantId,
        userId,
        action: 'DELETE',
        resource: 'job',
        resourceId: job.id,
        metadata: { title: job.title },
      },
    })

    return apiSuccess({ id: job.id, deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
