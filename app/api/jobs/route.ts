/**
 * GET  /api/jobs        — Search & paginate published jobs.
 * POST /api/jobs        — Create a job. Requires PARTNER+ with tenant
 *                         job.create permission.
 *
 * Tenant scoping:
 *  - GET: when x-tenant-slug is present, results are restricted to that
 *    tenant. On apex, all published jobs are searchable cross-tenant.
 *  - POST: x-tenant-slug is required.
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
  paginated,
  parsePagination,
} from '@/lib/api-helpers'
import { parseQueryTerms } from '@/lib/search/relevance'

const employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] as const
const experienceLevels = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'] as const
const locationTypes = ['ONSITE', 'HYBRID', 'REMOTE'] as const

const jobCreateSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  description: z.string().min(20).max(20_000),
  responsibilities: z.string().max(20_000).optional().nullable(),
  requirements: z.string().max(20_000).optional().nullable(),
  benefits: z.string().max(20_000).optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  salaryCurrency: z.string().length(3).default('IDR'),
  salaryPeriod: z.enum(['hour', 'day', 'week', 'month', 'year']).default('month'),
  employmentType: z.enum(employmentTypes).default('FULL_TIME'),
  experienceLevel: z.enum(experienceLevels).default('MID'),
  location: z.string().min(2).max(200),
  locationType: z.enum(locationTypes).default('ONSITE'),
  categoryId: z.string().cuid().optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export async function GET(req: NextRequest) {
  try {
    const slug = getTenantSlugFromHeaders(req)
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const category = sp.get('category')?.trim() ?? ''
    const location = sp.get('location')?.trim() ?? ''
    const type = sp.get('type')?.trim().toUpperCase() ?? ''
    const level = sp.get('level')?.trim().toUpperCase() ?? ''
    const salaryMin = Number(sp.get('salaryMin') ?? '')
    const salaryMax = Number(sp.get('salaryMax') ?? '')
    const pagination = parsePagination(sp, 20, 50)

    const where: Prisma.JobWhereInput = { status: 'PUBLISHED' }

    if (slug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
      if (tenant) where.tenantId = tenant.id
      else where.tenantId = '__none__' // No results for unknown slug.
    }

    const terms = parseQueryTerms(q)
    if (terms.length > 0) {
      const and: object[] = terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { tags: { has: term } },
        ],
      }))
      where.AND = and
    }
    if (category) {
      where.category = { slug: category }
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }
    if ((employmentTypes as readonly string[]).includes(type)) {
      where.employmentType = type as (typeof employmentTypes)[number]
    }
    if ((experienceLevels as readonly string[]).includes(level)) {
      where.experienceLevel = level as (typeof experienceLevels)[number]
    }
    if (Number.isFinite(salaryMin)) {
      where.salaryMin = { gte: salaryMin }
    }
    if (Number.isFinite(salaryMax)) {
      where.salaryMax = { lte: salaryMax }
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.take,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          tenant: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.job.count({ where }),
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

    const tenant = await prisma.tenant.findUnique({ where: { slug } })
    if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!canAccessTenant(globalRole, tenants, tenant.id)) {
      return apiError('FORBIDDEN', 'You do not have access to this tenant.', 403)
    }
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.create')) {
      return apiError('FORBIDDEN', 'You do not have permission to create jobs.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = jobCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid job payload.', 400, parsed.error.issues)
    }

    const data = parsed.data
    if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
      return apiError('VALIDATION_ERROR', 'salaryMin must be <= salaryMax.', 400)
    }

    const job = await prisma.job.create({
      data: {
        tenantId: tenant.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        responsibilities: data.responsibilities ?? null,
        requirements: data.requirements ?? null,
        benefits: data.benefits ?? null,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        salaryCurrency: data.salaryCurrency,
        salaryPeriod: data.salaryPeriod,
        employmentType: data.employmentType,
        experienceLevel: data.experienceLevel,
        location: data.location,
        locationType: data.locationType,
        categoryId: data.categoryId ?? null,
        tags: data.tags,
        status: data.status,
        postedById: userId,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId,
        action: 'CREATE',
        resource: 'job',
        resourceId: job.id,
        metadata: { title: job.title, status: job.status },
      },
    })

    return apiSuccess(job, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
