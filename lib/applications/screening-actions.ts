'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { scoreApplicationAI } from './screening-ai'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const idSchema = z.object({
  applicationId: z.string().min(1),
})

const jobIdSchema = z.object({
  tenantSlug: z.string().min(1),
  jobId: z.string().min(1),
})

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

type ApplicationCtx =
  | { error: string }
  | {
      actorId: string
      application: {
        id: string
        tenantId: string
        coverLetter: string | null
        userId: string
        jobId: string
        tenant: { slug: string }
      }
    }

/**
 * Verify the caller can run AI screening on the given application, returning
 * the loaded record + tenant slug. Gates on `job.update` (recruiter scope).
 */
async function loadApplicationCtx(applicationId: string): Promise<ApplicationCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvApplications2.screening.mustLogin }
  }
  const application = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true,
        coverLetter: true,
        userId: true,
        jobId: true,
        tenant: { select: { slug: true } },
      },
    })
    .catch(() => null)
  if (!application) return { error: t.srvApplications2.screening.applicationNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, application.tenantId, 'job.update')) {
    return { error: t.srvApplications2.screening.noPermission }
  }
  return { actorId, application }
}

type ScoringInputs = {
  application: { coverLetter: string | null }
  job: {
    title: string
    tags: string[]
    location: string
    locationType: import('@prisma/client').LocationType
    experienceLevel: import('@prisma/client').ExperienceLevel
  }
  user: { headline: string | null; location: string | null }
  primaryResume: { fileUrl: string | null; content: unknown } | null
}

/**
 * Batch-fetch the user/job/resume slice needed by `scoreApplication`. Used
 * by both the single-application and bulk paths.
 */
async function fetchScoringInputs(
  applicationId: string,
): Promise<ScoringInputs | null> {
  const app = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: {
        coverLetter: true,
        userId: true,
        jobId: true,
      },
    })
    .catch(() => null)
  if (!app) return null

  const [job, user, primaryResume] = await Promise.all([
    prisma.job.findUnique({
      where: { id: app.jobId },
      select: {
        title: true,
        tags: true,
        location: true,
        locationType: true,
        experienceLevel: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: app.userId },
      select: { headline: true, location: true },
    }),
    prisma.resume.findFirst({
      where: { userId: app.userId },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      select: { fileUrl: true, content: true },
    }),
  ])

  if (!job || !user) return null

  return {
    application: { coverLetter: app.coverLetter },
    job,
    user,
    primaryResume,
  }
}

/**
 * Run AI screening for a single application. Updates aiScore + aiTags and
 * writes an audit row. Returns the computed score + tags on success.
 */
export async function runScreening(input: {
  applicationId: string
}): Promise<ActionResult<{ score: number; tags: string[] }>> {
  const t = await getServerT()
  const parsed = await localizedParse(idSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.screening.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId } = parsed.data

  const ctx = await loadApplicationCtx(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const inputs = await fetchScoringInputs(applicationId)
    if (!inputs) {
      return { ok: false, error: t.srvApplications2.screening.incompleteData }
    }

    const result = await scoreApplicationAI(inputs)

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        aiScore: result.score,
        aiTags: result.tags,
        aiScoreBreakdown: {
          breakdown: result.breakdown,
          matchedSkills: result.matchedSkills,
          reason: result.reason,
          source: result.source,
        } as Prisma.InputJsonValue,
        aiScoredAt: new Date(),
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application.screening',
        resourceId: applicationId,
        metadata: {
          score: result.score,
          tags: result.tags,
          breakdown: result.breakdown,
          reason: result.reason,
          source: result.source,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.application.tenant.slug}/lamaran`)
    revalidatePath(
      `/dashboard/tenants/${ctx.application.tenant.slug}/lamaran/${applicationId}`,
    )
    revalidatePath(
      `/dashboard/tenants/${ctx.application.tenant.slug}/lamaran/kanban`,
    )

    return { ok: true, data: { score: result.score, tags: result.tags } }
  } catch (err) {
    console.error('[runScreening] failed', err)
    return { ok: false, error: t.srvApplications2.screening.genericError }
  }
}

export type BulkScreeningSummary = {
  total: number
  succeeded: number
  errors: number
}

/**
 * Bulk-run AI screening for every application against a single job. All
 * applications are scored in parallel; per-row failures are counted but do
 * not abort the batch. Writes a single summary audit row for the job.
 */
export async function runScreeningForJob(input: {
  tenantSlug: string
  jobId: string
}): Promise<ActionResult<BulkScreeningSummary>> {
  const t = await getServerT()
  const parsed = await localizedParse(jobIdSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.screening.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, jobId } = parsed.data

  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvApplications2.screening.mustLogin }
  }

  const job = await prisma.job
    .findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        tags: true,
        location: true,
        locationType: true,
        experienceLevel: true,
        tenantId: true,
        tenant: { select: { slug: true } },
      },
    })
    .catch(() => null)
  if (!job) return { ok: false, error: t.srvApplications2.screening.jobNotFound }
  if (job.tenant.slug !== tenantSlug) {
    return { ok: false, error: t.srvApplications2.screening.tenantMismatch }
  }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, job.tenantId, 'job.update')) {
    return { ok: false, error: t.srvApplications2.screening.noPermission }
  }

  const applications = await prisma.application
    .findMany({
      where: { jobId },
      select: { id: true, coverLetter: true, userId: true },
    })
    .catch(() => [])

  if (applications.length === 0) {
    return { ok: true, data: { total: 0, succeeded: 0, errors: 0 } }
  }

  // Fetch all users + primary resumes in two batched round-trips rather than
  // per-application N+1.
  const userIds = Array.from(new Set(applications.map((a) => a.userId)))
  const [users, resumes] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, headline: true, location: true },
    }),
    prisma.resume.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      select: { userId: true, fileUrl: true, content: true },
    }),
  ])

  const userById = new Map(users.map((u) => [u.id, u]))
  // The `orderBy` above puts the primary (or most-recent) row first per user,
  // so taking the first seen entry preserves that preference.
  const resumeByUser = new Map<
    string,
    { fileUrl: string | null; content: unknown }
  >()
  for (const r of resumes) {
    if (!resumeByUser.has(r.userId)) {
      resumeByUser.set(r.userId, { fileUrl: r.fileUrl, content: r.content })
    }
  }

  const settled = await Promise.allSettled(
    applications.map(async (a) => {
      const user = userById.get(a.userId)
      if (!user) throw new Error('user-missing')
      const primaryResume = resumeByUser.get(a.userId) ?? null

      const result = await scoreApplicationAI({
        application: { coverLetter: a.coverLetter },
        job: {
          title: job.title,
          tags: job.tags,
          location: job.location,
          locationType: job.locationType,
          experienceLevel: job.experienceLevel,
        },
        user,
        primaryResume,
      })

      await prisma.application.update({
        where: { id: a.id },
        data: {
          aiScore: result.score,
          aiTags: result.tags,
          aiScoreBreakdown: {
            breakdown: result.breakdown,
            matchedSkills: result.matchedSkills,
            reason: result.reason,
            source: result.source,
          } as Prisma.InputJsonValue,
          aiScoredAt: new Date(),
        },
      })
      return result
    }),
  )

  const succeeded = settled.filter((s) => s.status === 'fulfilled').length
  const errors = settled.length - succeeded

  const meta = getRequestMeta()
  await prisma.auditLog
    .create({
      data: {
        tenantId: job.tenantId,
        userId: actorId,
        action: AuditAction.UPDATE,
        resource: 'application.screening',
        resourceId: job.id,
        metadata: {
          mode: 'bulk',
          jobId: job.id,
          total: applications.length,
          succeeded,
          errors,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
    .catch((err) => console.error('[runScreeningForJob] audit failed', err))

  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/kanban`)

  return {
    ok: true,
    data: { total: applications.length, succeeded, errors },
  }
}

/**
 * Reset AI screening state for a single application (clears score + tags).
 * Audited as DELETE on the `application.screening` resource.
 */
export async function clearScreening(input: {
  applicationId: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const parsed = await localizedParse(idSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.screening.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId } = parsed.data

  const ctx = await loadApplicationCtx(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    await prisma.application.update({
      where: { id: applicationId },
      data: { aiScore: null, aiTags: [] },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.DELETE,
        resource: 'application.screening',
        resourceId: applicationId,
        metadata: { cleared: true } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.application.tenant.slug}/lamaran`)
    revalidatePath(
      `/dashboard/tenants/${ctx.application.tenant.slug}/lamaran/${applicationId}`,
    )
    revalidatePath(
      `/dashboard/tenants/${ctx.application.tenant.slug}/lamaran/kanban`,
    )

    return { ok: true }
  } catch (err) {
    console.error('[clearScreening] failed', err)
    return { ok: false, error: t.srvApplications2.screening.genericError }
  }
}
