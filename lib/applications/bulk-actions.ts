'use server'

/**
 * Bulk recruiter actions across multiple applications.
 *
 * Every action below is gated by `job.update` per-tenant. Inputs accept either
 * a `FormData` (when called from a non-JS form submit) or a typed object so
 * the bulk toolbar client component can call them as plain functions.
 *
 * Limits:
 *   - 100 applications per call (server enforced).
 *   - Custom-email body capped at 5000 chars.
 *
 * Partial success: when some application IDs fail the per-row tenant +
 * permission check, the action still proceeds with the eligible subset and
 * returns `{ ok: true, data: { updated, skipped, failed } }`. Skipped IDs
 * include the reason so the UI can surface what was rejected.
 *
 * Each successful row generates its own audit log entry tagged with `batchId`
 * so a recruiter can trace the bulk operation back later.
 */

import crypto from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ApplicationStatus, AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { sendEmail } from '@/lib/mailer'
import { renderTemplate } from '@/lib/tenants/email-template-resolver'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvApplications } from '@/lib/i18n/dictionaries/srv-applications'
import { localizedParse } from '@/lib/i18n/zod-error-map'
import { dispatchTenantEvent } from '@/lib/webhooks/dispatch'

export type BulkResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string }

export type BulkSummary = {
  batchId: string
  updated: string[]
  skipped: Array<{ id: string; reason: string }>
}

const MAX_BULK_SIZE = 100

const BULK_STATUSES = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
] as const

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

function readArray(fd: FormData, key: string): string[] {
  const all = fd.getAll(key)
  if (all.length === 0) return []
  // FormData may serialize an array as a single CSV value or multi-value;
  // accept both shapes.
  if (all.length === 1 && typeof all[0] === 'string' && all[0].includes(',')) {
    return all[0]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return all
    .filter((v): v is string => typeof v === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Resolve `applicationIds` → only those the session can `job.update` on,
 * grouped per tenant for downstream revalidation. Returns a summary with
 * `skipped` IDs (per-row failures) so the caller can build a partial-success
 * response.
 */
type EligibleRow = {
  id: string
  tenantId: string
  status: ApplicationStatus
  jobId: string
  userId: string
  aiTags: string[]
  notes: string | null
  job: { title: string } | null
  user: { id: string; email: string; name: string | null } | null
  tenant: { id: string; slug: string; name: string } | null
}

type LoadResult =
  | { ok: false; error: string }
  | {
      ok: true
      actorId: string
      eligible: EligibleRow[]
      skipped: BulkSummary['skipped']
    }

async function loadEligible(
  applicationIds: string[],
  m: (typeof srvApplications)['id' | 'en']['bulkActions'],
): Promise<LoadResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const { id: actorId, globalRole, tenants } = session.user

  // Dedupe + clamp to MAX_BULK_SIZE up-front.
  const ids = Array.from(new Set(applicationIds)).slice(0, MAX_BULK_SIZE)
  if (ids.length === 0) {
    return { ok: false, error: m.minOneApplication }
  }

  const rows = await prisma.application.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      tenantId: true,
      status: true,
      jobId: true,
      userId: true,
      aiTags: true,
      notes: true,
      job: { select: { title: true } },
      user: { select: { id: true, email: true, name: true } },
      tenant: { select: { id: true, slug: true, name: true } },
    },
  })

  const found = new Set(rows.map((r) => r.id))
  const missing = ids.filter((i) => !found.has(i))
  const skipped: BulkSummary['skipped'] = missing.map((id) => ({
    id,
    reason: m.applicationNotFound,
  }))

  const eligible = rows.filter((r) =>
    hasTenantPermission(globalRole, tenants, r.tenantId, 'job.update'),
  )
  for (const r of rows) {
    if (!eligible.includes(r)) {
      skipped.push({ id: r.id, reason: m.noPermission })
    }
  }

  return { ok: true, actorId, eligible, skipped }
}

// -----------------------------------------------------------------------------
// bulkUpdateStatus
// -----------------------------------------------------------------------------

const statusSchema = z.object({
  applicationIds: z.array(z.string().min(1)).min(1).max(MAX_BULK_SIZE),
  newStatus: z.nativeEnum(ApplicationStatus),
  notes: z
    .string()
    .max(5000)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
})

export async function bulkUpdateStatus(
  input: FormData | { applicationIds: string[]; newStatus: string; notes?: string },
): Promise<BulkResult<BulkSummary>> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].bulkActions
  const raw =
    input instanceof FormData
      ? {
          applicationIds: readArray(input, 'applicationIds'),
          newStatus: String(input.get('newStatus') ?? ''),
          notes: (input.get('notes') as string | null) ?? undefined,
        }
      : input

  if (
    raw.newStatus === ApplicationStatus.WITHDRAWN ||
    !BULK_STATUSES.includes(raw.newStatus as (typeof BULK_STATUSES)[number])
  ) {
    return { ok: false, error: m.statusInvalid, field: 'newStatus' }
  }

  const parsed = await localizedParse(statusSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? m.inputInvalid,
      field: issue?.path[0]?.toString(),
    }
  }
  const { applicationIds, newStatus, notes } = parsed.data
  const targetStatus = newStatus as ApplicationStatus

  const ctx = await loadEligible(applicationIds, m)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { actorId, eligible, skipped } = ctx

  if (eligible.length === 0) {
    return {
      ok: true,
      data: { batchId: '', updated: [], skipped },
    }
  }

  const batchId = crypto.randomUUID()
  const meta = getRequestMeta()
  const updated: string[] = []
  const tenantSlugs = new Set<string>()

  for (const app of eligible) {
    try {
      // Skip no-op transitions but still record them in `skipped` so the UI
      // shows the count to the recruiter.
      if (app.status === targetStatus) {
        skipped.push({ id: app.id, reason: m.alreadyAtStatus })
        continue
      }
      await prisma.$transaction([
        prisma.application.update({
          where: { id: app.id },
          data: {
            status: targetStatus,
            ...(notes ? { notes } : {}),
          },
        }),
        prisma.auditLog.create({
          data: {
            tenantId: app.tenantId,
            userId: actorId,
            action: AuditAction.UPDATE,
            resource: 'application.bulk_status_updated',
            resourceId: app.id,
            metadata: {
              batchId,
              fromStatus: app.status,
              toStatus: targetStatus,
            } as Prisma.InputJsonValue,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        }),
      ])
      updated.push(app.id)
      dispatchTenantEvent(app.tenantId, 'tenant.application.status_changed', {
        applicationId: app.id,
        status: targetStatus,
        previousStatus: app.status,
        batchId,
      })
      if (app.tenant?.slug) tenantSlugs.add(app.tenant.slug)
    } catch (err) {
      console.error('[bulkUpdateStatus] row failed', app.id, err)
      skipped.push({ id: app.id, reason: m.updateFailed })
    }
  }

  for (const slug of tenantSlugs) {
    revalidatePath(`/dashboard/tenants/${slug}/lamaran`)
  }

  return { ok: true, data: { batchId, updated, skipped } }
}

// -----------------------------------------------------------------------------
// bulkSendEmail
// -----------------------------------------------------------------------------

const emailSchema = z
  .object({
    applicationIds: z.array(z.string().min(1)).min(1).max(MAX_BULK_SIZE),
    templateId: z.string().min(1).optional(),
    subject: z.string().max(300).optional(),
    body: z.string().max(5000).optional(),
  })
  .refine(
    (v) => Boolean(v.templateId) || (Boolean(v.subject) && Boolean(v.body)),
    {
      params: { i18n: 'emailTemplateChoice' },
      path: ['templateId'],
    },
  )

export type BulkEmailSummary = BulkSummary & {
  sent: number
  failed: number
}

export async function bulkSendEmail(
  input:
    | FormData
    | {
        applicationIds: string[]
        templateId?: string
        subject?: string
        body?: string
      },
): Promise<BulkResult<BulkEmailSummary>> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].bulkActions
  const raw =
    input instanceof FormData
      ? {
          applicationIds: readArray(input, 'applicationIds'),
          templateId: (input.get('templateId') as string | null) || undefined,
          subject: (input.get('subject') as string | null) || undefined,
          body: (input.get('body') as string | null) || undefined,
        }
      : input

  const parsed = await localizedParse(emailSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? m.inputInvalid,
      field: issue?.path[0]?.toString(),
    }
  }
  const { applicationIds, templateId, subject, body } = parsed.data

  const ctx = await loadEligible(applicationIds, m)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { actorId, eligible, skipped } = ctx

  const batchId = crypto.randomUUID()
  const meta = getRequestMeta()

  // Resolve template once (templates live per-tenant). When the toolbar passes
  // a templateId we look it up once outside the loop and the per-row render
  // simply substitutes the candidate/job/tenant vars.
  let resolvedTpl: { subject: string; body: string; tenantId: string } | null = null
  if (templateId) {
    const row = await prisma.tenantEmailTemplate
      .findUnique({
        where: { id: templateId },
        select: { subject: true, body: true, enabled: true, tenantId: true },
      })
      .catch(() => null)
    if (!row || !row.enabled) {
      return {
        ok: false,
        error: m.templateNotFound,
        field: 'templateId',
      }
    }
    resolvedTpl = { subject: row.subject, body: row.body, tenantId: row.tenantId }
  }

  const updated: string[] = []
  let sent = 0
  let failed = 0
  const tenantSlugs = new Set<string>()

  for (const app of eligible) {
    // Reject cross-tenant template usage as a safety net.
    if (resolvedTpl && resolvedTpl.tenantId !== app.tenantId) {
      skipped.push({ id: app.id, reason: m.crossTenantTemplate })
      continue
    }
    if (!app.user?.email) {
      skipped.push({ id: app.id, reason: m.noEmail })
      continue
    }

    const vars: Record<string, string> = {
      candidateName: app.user.name ?? '',
      name: app.user.name ?? '',
      jobTitle: app.job?.title ?? '',
      tenantName: app.tenant?.name ?? '',
    }
    const finalSubject = renderTemplate(
      resolvedTpl ? resolvedTpl.subject : subject ?? '',
      vars,
    )
    const finalBody = renderTemplate(
      resolvedTpl ? resolvedTpl.body : body ?? '',
      vars,
    )

    try {
      const result = await sendEmail({
        to: app.user.email,
        subject: finalSubject,
        text: finalBody,
        // Minimal HTML wrapper mirrors the tenant custom-template path.
        html: `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;color:#0f172a;line-height:1.6"><div style="white-space:pre-wrap">${finalBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></body></html>`,
      })
      if (result.ok) {
        sent += 1
      } else {
        failed += 1
        skipped.push({ id: app.id, reason: m.emailSendFailed })
        continue
      }
      await prisma.auditLog.create({
        data: {
          tenantId: app.tenantId,
          userId: actorId,
          action: AuditAction.UPDATE,
          resource: 'application.bulk_email_sent',
          resourceId: app.id,
          metadata: {
            batchId,
            templateId: templateId ?? null,
            custom: !templateId,
            subject: finalSubject.slice(0, 200),
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      updated.push(app.id)
      if (app.tenant?.slug) tenantSlugs.add(app.tenant.slug)
    } catch (err) {
      failed += 1
      console.error('[bulkSendEmail] row failed', app.id, err)
      skipped.push({ id: app.id, reason: m.emailSendFailed })
    }
  }

  for (const slug of tenantSlugs) {
    revalidatePath(`/dashboard/tenants/${slug}/lamaran`)
  }

  return { ok: true, data: { batchId, updated, skipped, sent, failed } }
}

// -----------------------------------------------------------------------------
// bulkAddTag
// -----------------------------------------------------------------------------

const tagSchema = z.object({
  applicationIds: z.array(z.string().min(1)).min(1).max(MAX_BULK_SIZE),
  tag: z
    .string()
    .min(1)
    .max(40)
    .transform((v) => v.trim()),
})

export async function bulkAddTag(
  input: FormData | { applicationIds: string[]; tag: string },
): Promise<BulkResult<BulkSummary>> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].bulkActions
  const raw =
    input instanceof FormData
      ? {
          applicationIds: readArray(input, 'applicationIds'),
          tag: String(input.get('tag') ?? ''),
        }
      : input

  const parsed = await localizedParse(tagSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? m.inputInvalid,
      field: issue?.path[0]?.toString(),
    }
  }
  const { applicationIds, tag } = parsed.data

  const ctx = await loadEligible(applicationIds, m)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { actorId, eligible, skipped } = ctx

  const batchId = crypto.randomUUID()
  const meta = getRequestMeta()
  const updated: string[] = []
  const tenantSlugs = new Set<string>()

  for (const app of eligible) {
    try {
      // Append-only: skip if the tag is already present.
      if (app.aiTags?.includes(tag)) {
        skipped.push({ id: app.id, reason: m.tagAlreadyExists })
        continue
      }
      const nextTags = [...(app.aiTags ?? []), tag]
      await prisma.$transaction([
        prisma.application.update({
          where: { id: app.id },
          data: { aiTags: { set: nextTags } },
        }),
        prisma.auditLog.create({
          data: {
            tenantId: app.tenantId,
            userId: actorId,
            action: AuditAction.UPDATE,
            resource: 'application.bulk_tagged',
            resourceId: app.id,
            metadata: { batchId, tag } as Prisma.InputJsonValue,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        }),
      ])
      updated.push(app.id)
      if (app.tenant?.slug) tenantSlugs.add(app.tenant.slug)
    } catch (err) {
      console.error('[bulkAddTag] row failed', app.id, err)
      skipped.push({ id: app.id, reason: m.tagAddFailed })
    }
  }

  for (const slug of tenantSlugs) {
    revalidatePath(`/dashboard/tenants/${slug}/lamaran`)
  }

  return { ok: true, data: { batchId, updated, skipped } }
}

// -----------------------------------------------------------------------------
// bulkAssignReviewer
// -----------------------------------------------------------------------------

const assignSchema = z.object({
  applicationIds: z.array(z.string().min(1)).min(1).max(MAX_BULK_SIZE),
  reviewerId: z.string().min(1),
})

export async function bulkAssignReviewer(
  input: FormData | { applicationIds: string[]; reviewerId: string },
): Promise<BulkResult<BulkSummary>> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].bulkActions
  const raw =
    input instanceof FormData
      ? {
          applicationIds: readArray(input, 'applicationIds'),
          reviewerId: String(input.get('reviewerId') ?? ''),
        }
      : input

  const parsed = await localizedParse(assignSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? m.inputInvalid,
      field: issue?.path[0]?.toString(),
    }
  }
  const { applicationIds, reviewerId } = parsed.data

  const ctx = await loadEligible(applicationIds, m)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { actorId, eligible, skipped } = ctx

  const reviewer = await prisma.user
    .findUnique({
      where: { id: reviewerId },
      select: { id: true, name: true, email: true },
    })
    .catch(() => null)
  if (!reviewer) {
    return { ok: false, error: m.reviewerNotFound, field: 'reviewerId' }
  }
  const reviewerLabel = reviewer.name ?? reviewer.email ?? 'Pengulas'

  const batchId = crypto.randomUUID()
  const meta = getRequestMeta()
  const updated: string[] = []
  const tenantSlugs = new Set<string>()

  for (const app of eligible) {
    try {
      const appendedNote = m.assignedNote.replace('{reviewerLabel}', reviewerLabel)
      const nextNotes = app.notes
        ? `${app.notes}\n${appendedNote}`
        : appendedNote
      await prisma.$transaction([
        prisma.application.update({
          where: { id: app.id },
          data: { notes: nextNotes },
        }),
        prisma.auditLog.create({
          data: {
            tenantId: app.tenantId,
            userId: actorId,
            action: AuditAction.UPDATE,
            resource: 'application.bulk_assigned',
            resourceId: app.id,
            metadata: {
              batchId,
              reviewerId: reviewer.id,
              reviewerLabel,
            } as Prisma.InputJsonValue,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        }),
      ])
      // Best-effort notification — never fail the loop.
      try {
        await prisma.notification.create({
          data: {
            userId: reviewer.id,
            type: 'APPLICATION_UPDATE',
            title: m.assignNotifTitle,
            body: m.assignNotifBody.replace('{jobTitle}', app.job?.title ?? 'Lamaran'),
            link: `/dashboard/tenants/${app.tenant?.slug ?? ''}/lamaran/${app.id}`,
          },
        })
      } catch (err) {
        console.error('[bulkAssignReviewer] notify failed', err)
      }
      updated.push(app.id)
      if (app.tenant?.slug) tenantSlugs.add(app.tenant.slug)
    } catch (err) {
      console.error('[bulkAssignReviewer] row failed', app.id, err)
      skipped.push({ id: app.id, reason: m.assignFailed })
    }
  }

  for (const slug of tenantSlugs) {
    revalidatePath(`/dashboard/tenants/${slug}/lamaran`)
  }

  return { ok: true, data: { batchId, updated, skipped } }
}
