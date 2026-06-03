'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  AuditAction,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  LocationType,
  Prisma,
} from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, type Permission } from '@/lib/auth/rbac'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

// =============================================================================
// Helpers
// =============================================================================

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

/**
 * Generate a slug fragment from `title`, then append a short cuid-style suffix
 * to guarantee uniqueness within the tenant scope (Job has @@unique([tenantId, slug])).
 * Total length is kept reasonable for URL aesthetics (≤ ~68 chars).
 */
function buildJobSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, '')
  return base ? `${base}-${suffix}` : `job-${suffix}`
}

// =============================================================================
// Validation schemas
// =============================================================================

const employmentTypeSchema = z.nativeEnum(EmploymentType)
const experienceLevelSchema = z.nativeEnum(ExperienceLevel)
const locationTypeSchema = z.nativeEnum(LocationType)
const jobStatusSchema = z.nativeEnum(JobStatus)

const optionalText = z
  .string()
  .trim()
  .max(20_000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const tagsSchema = z
  .string()
  .trim()
  .optional()
  .transform((raw) => {
    if (!raw) return [] as string[]
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 50)
      .slice(0, 20)
  })

const optionalCategoryId = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const salaryNumber = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return undefined
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d]/g, '')
      if (cleaned === '') return undefined
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : undefined
    }
    return v
  },
  z.number().int().min(0).max(1_000_000_000).optional(),
)

const baseJobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5)
      .max(200),
    description: z
      .string()
      .trim()
      .min(50),
    responsibilities: optionalText,
    requirements: optionalText,
    benefits: optionalText,
    salaryMin: salaryNumber,
    salaryMax: salaryNumber,
    employmentType: employmentTypeSchema,
    experienceLevel: experienceLevelSchema,
    location: z
      .string()
      .trim()
      .min(2)
      .max(120),
    locationType: locationTypeSchema,
    categoryId: optionalCategoryId,
    tags: tagsSchema,
    status: jobStatusSchema,
  })
  .refine(
    (v) =>
      v.salaryMin === undefined ||
      v.salaryMax === undefined ||
      v.salaryMin <= v.salaryMax,
    { params: { i18n: 'salaryRange' }, path: ['salaryMin'] },
  )

function readJobFormData(fd: FormData) {
  return {
    title: fd.get('title') ?? '',
    description: fd.get('description') ?? '',
    responsibilities: fd.get('responsibilities') ?? '',
    requirements: fd.get('requirements') ?? '',
    benefits: fd.get('benefits') ?? '',
    salaryMin: fd.get('salaryMin') ?? undefined,
    salaryMax: fd.get('salaryMax') ?? undefined,
    employmentType: fd.get('employmentType') ?? undefined,
    experienceLevel: fd.get('experienceLevel') ?? undefined,
    location: fd.get('location') ?? '',
    locationType: fd.get('locationType') ?? undefined,
    categoryId: fd.get('categoryId') ?? '',
    tags: fd.get('tags') ?? '',
    status: fd.get('status') ?? JobStatus.DRAFT,
  }
}

// =============================================================================
// Context loaders (mirror loadTenantForBranding)
// =============================================================================

type TenantLoadCtx =
  | { error: string }
  | { tenant: { id: string; slug: string }; actorId: string }

async function loadTenantForJob(
  tenantSlug: string,
  permission: Permission,
): Promise<TenantLoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant3.job.mustBeLoggedIn }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvTenant3.job.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: t.srvTenant3.job.noPermission }
  }
  return { tenant, actorId }
}

type JobLoadCtx =
  | { error: string }
  | {
      job: {
        id: string
        tenantId: string
        slug: string
        status: JobStatus
        publishedAt: Date | null
        title: string
      }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadJobForAction(
  jobId: string,
  permission: Permission,
): Promise<JobLoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant3.job.mustBeLoggedIn }
  }
  if (!jobId) return { error: t.srvTenant3.job.invalidJobId }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      tenantId: true,
      slug: true,
      status: true,
      publishedAt: true,
      title: true,
      tenant: { select: { id: true, slug: true } },
    },
  })
  if (!job) return { error: t.srvTenant3.job.jobNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, job.tenantId, permission)) {
    return { error: t.srvTenant3.job.noPermission }
  }
  return {
    job: {
      id: job.id,
      tenantId: job.tenantId,
      slug: job.slug,
      status: job.status,
      publishedAt: job.publishedAt,
      title: job.title,
    },
    tenant: job.tenant,
    actorId,
  }
}

// =============================================================================
// createJob
// =============================================================================

export async function createJob(input: {
  tenantSlug: string
  values: FormData
}): Promise<ActionResult<{ id: string; slug: string }>> {
  const t = await getServerT()
  const ctx = await loadTenantForJob(input.tenantSlug, 'job.create')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = await localizedParse(baseJobSchema, readJobFormData(input.values))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant3.job.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  // Publishing on creation requires the publish permission.
  if (d.status === JobStatus.PUBLISHED) {
    const session = await auth()
    if (
      !hasTenantPermission(
        session?.user?.globalRole,
        session?.user?.tenants,
        ctx.tenant.id,
        'job.publish',
      )
    ) {
      return { ok: false, error: t.srvTenant3.job.noPublishPermission }
    }
  }

  try {
    // Verify category (if provided) is a real JobCategory id.
    if (d.categoryId) {
      const cat = await prisma.jobCategory.findUnique({
        where: { id: d.categoryId },
        select: { id: true },
      })
      if (!cat) {
        return { ok: false, error: t.srvTenant3.job.categoryNotFound, field: 'categoryId' }
      }
    }

    const slug = buildJobSlug(d.title)

    const created = await prisma.job.create({
      data: {
        tenantId: ctx.tenant.id,
        postedById: ctx.actorId,
        title: d.title,
        slug,
        description: d.description,
        responsibilities: d.responsibilities,
        requirements: d.requirements,
        benefits: d.benefits,
        salaryMin: d.salaryMin,
        salaryMax: d.salaryMax,
        employmentType: d.employmentType,
        experienceLevel: d.experienceLevel,
        location: d.location,
        locationType: d.locationType,
        categoryId: d.categoryId,
        tags: d.tags,
        status: d.status,
        publishedAt: d.status === JobStatus.PUBLISHED ? new Date() : null,
      },
      select: { id: true, slug: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.job',
        resourceId: created.id,
        metadata: {
          title: d.title,
          slug: created.slug,
          status: d.status,
          employmentType: d.employmentType,
          experienceLevel: d.experienceLevel,
          locationType: d.locationType,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // TODO(webhooks): emit tenant.job.created — pending allowlist update in
    // lib/webhooks/events.ts.

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/jobs`)
    return { ok: true, data: { id: created.id, slug: created.slug } }
  } catch (err) {
    console.error('[createJob] failed', err)
    return { ok: false, error: t.srvTenant3.job.genericError }
  }
}

// =============================================================================
// updateJob
// =============================================================================

export async function updateJob(input: {
  jobId: string
  values: FormData
}): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadJobForAction(input.jobId, 'job.update')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = await localizedParse(baseJobSchema, readJobFormData(input.values))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant3.job.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  // Status change → PUBLISHED via update form requires publish permission.
  const willPublish =
    d.status === JobStatus.PUBLISHED && ctx.job.status !== JobStatus.PUBLISHED
  if (willPublish) {
    const session = await auth()
    if (
      !hasTenantPermission(
        session?.user?.globalRole,
        session?.user?.tenants,
        ctx.tenant.id,
        'job.publish',
      )
    ) {
      return { ok: false, error: t.srvTenant3.job.noPublishPermission }
    }
  }

  try {
    if (d.categoryId) {
      const cat = await prisma.jobCategory.findUnique({
        where: { id: d.categoryId },
        select: { id: true },
      })
      if (!cat) {
        return { ok: false, error: t.srvTenant3.job.categoryNotFound, field: 'categoryId' }
      }
    }

    const updateData: Prisma.JobUpdateInput = {
      title: d.title,
      description: d.description,
      responsibilities: d.responsibilities ?? null,
      requirements: d.requirements ?? null,
      benefits: d.benefits ?? null,
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      employmentType: d.employmentType,
      experienceLevel: d.experienceLevel,
      location: d.location,
      locationType: d.locationType,
      category: d.categoryId
        ? { connect: { id: d.categoryId } }
        : { disconnect: true },
      tags: { set: d.tags },
      status: d.status,
    }

    if (willPublish && ctx.job.publishedAt === null) {
      updateData.publishedAt = new Date()
    }

    await prisma.job.update({
      where: { id: ctx.job.id },
      data: updateData,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.job',
        resourceId: ctx.job.id,
        metadata: {
          title: d.title,
          status: { from: ctx.job.status, to: d.status },
          willPublish,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // TODO(webhooks): emit tenant.job.updated / tenant.job.published — pending
    // allowlist update in lib/webhooks/events.ts.

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/jobs`)
    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/jobs/${ctx.job.id}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateJob] failed', err)
    return { ok: false, error: t.srvTenant3.job.genericError }
  }
}

// =============================================================================
// changeJobStatus
// =============================================================================

export async function changeJobStatus(input: {
  jobId: string
  status: JobStatus
}): Promise<ActionResult> {
  const t = await getServerT()
  const statusParse = await localizedParse(jobStatusSchema, input.status)
  if (!statusParse.success) {
    return { ok: false, error: t.srvTenant3.job.invalidStatus }
  }
  const nextStatus = statusParse.data

  // For PUBLISHED transitions we additionally require job.publish; for any
  // other status change job.update is sufficient.
  const requiredPerm: Permission =
    nextStatus === JobStatus.PUBLISHED ? 'job.publish' : 'job.update'

  const ctx = await loadJobForAction(input.jobId, requiredPerm)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.job.status === nextStatus) {
    return { ok: true }
  }

  try {
    const data: Prisma.JobUpdateInput = { status: nextStatus }
    if (nextStatus === JobStatus.PUBLISHED && ctx.job.publishedAt === null) {
      data.publishedAt = new Date()
    }

    await prisma.job.update({
      where: { id: ctx.job.id },
      data,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.job.status',
        resourceId: ctx.job.id,
        metadata: {
          title: ctx.job.title,
          status: { from: ctx.job.status, to: nextStatus },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // TODO(webhooks): emit tenant.job.status_changed — pending allowlist update.

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/jobs`)
    return { ok: true }
  } catch (err) {
    console.error('[changeJobStatus] failed', err)
    return { ok: false, error: t.srvTenant3.job.genericError }
  }
}

// =============================================================================
// deleteJob — hard delete (mirrors webhook revoke approach: configuration-style
// artefact whose audit log retains the resourceId pointer for compliance).
// Applications cascade per schema relation.
// =============================================================================

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadJobForAction(jobId, 'job.delete')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.job.delete({ where: { id: ctx.job.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.job',
          resourceId: ctx.job.id,
          metadata: {
            title: ctx.job.title,
            slug: ctx.job.slug,
            status: ctx.job.status,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    // TODO(webhooks): emit tenant.job.deleted — pending allowlist update.

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/jobs`)
    return { ok: true }
  } catch (err) {
    console.error('[deleteJob] failed', err)
    return { ok: false, error: t.srvTenant3.job.genericError }
  }
}
