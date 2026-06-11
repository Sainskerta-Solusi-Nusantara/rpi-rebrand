'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { scoreApplicationToJob, type MatchResult } from './match-scorer'
import { scoreApplicationToJobAI } from './match-scorer-ai'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const idSchema = z.object({
  applicationId: z.string().min(1),
})

const jobIdSchema = z.object({
  jobId: z.string().min(1),
  limit: z.number().int().min(1).max(200).optional(),
})

const staleSchema = z.object({
  olderThanDays: z.number().int().min(0).max(365).optional(),
  limit: z.number().int().min(1).max(500).optional(),
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

// Fields the scorer reads from Job.
const JOB_SELECT = {
  id: true,
  title: true,
  description: true,
  requirements: true,
  tags: true,
  location: true,
  locationType: true,
  employmentType: true,
  experienceLevel: true,
  tenantId: true,
  tenant: { select: { slug: true } },
} as const

const APPLICATION_SELECT = {
  id: true,
  tenantId: true,
  jobId: true,
  userId: true,
  coverLetter: true,
} as const

async function fetchScoringContext(applicationId: string) {
  const app = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: APPLICATION_SELECT,
    })
    .catch(() => null)
  if (!app) return null

  const [job, user, resume] = await Promise.all([
    prisma.job.findUnique({ where: { id: app.jobId }, select: JOB_SELECT }),
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
  return { app, job, user, resume }
}

/**
 * Persist a MatchResult onto an Application row. Centralized so the single
 * and bulk paths use exactly the same write contract.
 */
async function persistResult(
  applicationId: string,
  result: MatchResult,
): Promise<void> {
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      aiScore: result.score,
      aiTags: result.tags,
      aiScoreBreakdown: result.breakdown as unknown as Prisma.InputJsonValue,
      aiScoredAt: new Date(),
    },
  })
}

/**
 * Re-score a single application against its job. Idempotent — safe to call
 * multiple times. Gated by `job.update` on the application's tenant.
 */
export async function rescoreApplication(
  input: { applicationId: string },
): Promise<ActionResult<MatchResult>> {
  const t = await getServerT()
  const parsed = await localizedParse(idSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.match.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId } = parsed.data

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvApplications2.match.mustLogin }

  const ctx = await fetchScoringContext(applicationId)
  if (!ctx) return { ok: false, error: t.srvApplications2.match.applicationNotFound }
  const { app, job, user, resume } = ctx

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, app.tenantId, 'job.update')) {
    return { ok: false, error: t.srvApplications2.match.noPermission }
  }

  try {
    // On-demand (recruiter-triggered) → AI-augmented when configured. The
    // breakdown stays heuristic; Claude only refines the headline score + adds
    // a reason. With no key this is identical to the pure heuristic.
    const result = await scoreApplicationToJobAI(
      { coverLetter: app.coverLetter },
      {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        location: job.location,
        locationType: job.locationType,
        tags: job.tags,
      },
      resume,
      user,
    )

    await persistResult(applicationId, result)

    const meta = getRequestMeta()
    await prisma.auditLog
      .create({
        data: {
          tenantId: app.tenantId,
          userId: actorId,
          action: AuditAction.UPDATE,
          resource: 'application.match.scored',
          resourceId: applicationId,
          metadata: {
            score: result.score,
            tags: result.tags,
            reason: result.reason ?? null,
            source: result.source ?? 'heuristic',
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch((err) => console.error('[rescoreApplication] audit failed', err))

    revalidatePath(`/dashboard/tenants/${job.tenant.slug}/lamaran`)
    revalidatePath(`/dashboard/tenants/${job.tenant.slug}/lamaran/${applicationId}`)

    return { ok: true, data: result }
  } catch (err) {
    console.error('[rescoreApplication] failed', err)
    return { ok: false, error: t.srvApplications2.match.scoringError }
  }
}

export type BulkRescoreSummary = {
  scored: number
  errors: number
}

/**
 * Re-score all applications attached to a single job. Caps the work at 200
 * applications per call (configurable down via `limit`). All applications
 * are processed in parallel with `Promise.allSettled` so a single bad row
 * doesn't abort the batch.
 */
export async function rescoreAllForJob(
  input: { jobId: string; limit?: number },
): Promise<ActionResult<BulkRescoreSummary>> {
  const t = await getServerT()
  const parsed = await localizedParse(jobIdSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.match.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { jobId, limit = 200 } = parsed.data

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvApplications2.match.mustLogin }

  const job = await prisma.job
    .findUnique({ where: { id: jobId }, select: JOB_SELECT })
    .catch(() => null)
  if (!job) return { ok: false, error: t.srvApplications2.match.jobNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, job.tenantId, 'job.update')) {
    return { ok: false, error: t.srvApplications2.match.noPermission }
  }

  const applications = await prisma.application
    .findMany({
      where: { jobId },
      select: { id: true, coverLetter: true, userId: true },
      take: Math.min(200, limit),
    })
    .catch(() => [])

  if (applications.length === 0) {
    return { ok: true, data: { scored: 0, errors: 0 } }
  }

  // Batched user + resume fetch — keep parity with screening-actions to
  // avoid N+1 query storms during bulk re-score.
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
  const resumeByUser = new Map<
    string,
    { fileUrl: string | null; content: unknown }
  >()
  for (const r of resumes) {
    if (!resumeByUser.has(r.userId)) {
      resumeByUser.set(r.userId, { fileUrl: r.fileUrl, content: r.content })
    }
  }

  const meta = getRequestMeta()

  const settled = await Promise.allSettled(
    applications.map(async (a) => {
      const u = userById.get(a.userId) ?? null
      const resume = resumeByUser.get(a.userId) ?? null
      // Recruiter-triggered bulk → AI per row (mirrors runScreeningForJob).
      // Per-row failures fall back to heuristic inside the scorer; the outer
      // allSettled keeps one bad row from aborting the batch.
      const result = await scoreApplicationToJobAI(
        { coverLetter: a.coverLetter },
        {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          location: job.location,
          locationType: job.locationType,
          tags: job.tags,
        },
        resume,
        u,
      )
      await persistResult(a.id, result)
      // Per-row audit so each scoring action is traceable.
      await prisma.auditLog
        .create({
          data: {
            tenantId: job.tenantId,
            userId: actorId,
            action: AuditAction.UPDATE,
            resource: 'application.match.scored',
            resourceId: a.id,
            metadata: {
              score: result.score,
              tags: result.tags,
              reason: result.reason ?? null,
              source: result.source ?? 'heuristic',
              mode: 'bulk_job',
            } as Prisma.InputJsonValue,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        })
        .catch(() => null)
      return result
    }),
  )

  const scored = settled.filter((s) => s.status === 'fulfilled').length
  const errors = settled.length - scored

  revalidatePath(`/dashboard/tenants/${job.tenant.slug}/lamaran`)

  return { ok: true, data: { scored, errors } }
}

/**
 * Re-score all stale applications (un-scored or scored more than N days ago).
 * Designed for the cron endpoint — does NOT gate on session, callers are
 * responsible for their own authentication (the cron route checks the
 * x-cron-secret header).
 */
export async function rescoreAllStaleApplications(
  input: { olderThanDays?: number; limit?: number } = {},
): Promise<ActionResult<BulkRescoreSummary>> {
  const t = await getServerT()
  const parsed = await localizedParse(staleSchema, input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvApplications2.match.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { olderThanDays = 7, limit = 100 } = parsed.data

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

  // Pick applications that are either unscored or were scored before the
  // cutoff. Order oldest first so we drain backlogs predictably.
  const apps = await prisma.application
    .findMany({
      where: {
        OR: [{ aiScoredAt: null }, { aiScoredAt: { lt: cutoff } }],
      },
      orderBy: [{ aiScoredAt: { sort: 'asc', nulls: 'first' } }, { appliedAt: 'asc' }],
      take: Math.min(500, limit),
      select: { id: true, coverLetter: true, userId: true, jobId: true, tenantId: true },
    })
    .catch(() => [])

  if (apps.length === 0) {
    return { ok: true, data: { scored: 0, errors: 0 } }
  }

  const jobIds = Array.from(new Set(apps.map((a) => a.jobId)))
  const userIds = Array.from(new Set(apps.map((a) => a.userId)))
  const [jobs, users, resumes] = await Promise.all([
    prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: JOB_SELECT,
    }),
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
  const jobById = new Map(jobs.map((j) => [j.id, j]))
  const userById = new Map(users.map((u) => [u.id, u]))
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
    apps.map(async (a) => {
      const job = jobById.get(a.jobId)
      if (!job) throw new Error('job-missing')
      const u = userById.get(a.userId) ?? null
      const resume = resumeByUser.get(a.userId) ?? null
      // HEURISTIC ONLY — this is the cron batch path (up to 500 rows/run). Do
      // NOT swap in scoreApplicationToJobAI here: it would fan out into hundreds
      // of Claude calls per cron tick. AI scoring is reserved for the
      // recruiter-triggered single + per-job paths above.
      const result = scoreApplicationToJob(
        { coverLetter: a.coverLetter },
        {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          location: job.location,
          locationType: job.locationType,
          tags: job.tags,
        },
        resume,
        u,
      )
      await persistResult(a.id, result)
      return result
    }),
  )

  const scored = settled.filter((s) => s.status === 'fulfilled').length
  const errors = settled.length - scored

  return { ok: true, data: { scored, errors } }
}
