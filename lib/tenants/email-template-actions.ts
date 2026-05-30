'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * The 6 ApplicationStatus values that trigger a candidate notification email
 * (see `applicationStatusEmail` in lib/mailer.ts). APPLIED has its own
 * "lamaran diterima" template and WITHDRAWN is user-initiated, so neither
 * is customizable here.
 */
const TEMPLATE_STATUS_VALUES = [
  'REVIEWED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFERED',
  'HIRED',
  'REJECTED',
] as const
export type TemplateStatus = (typeof TEMPLATE_STATUS_VALUES)[number]

const upsertSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug tenant wajib diisi'),
  status: z.enum(TEMPLATE_STATUS_VALUES, {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
  subject: z
    .string()
    .trim()
    .min(5, 'Subjek minimal 5 karakter')
    .max(200, 'Subjek maksimal 200 karakter'),
  body: z
    .string()
    .min(50, 'Isi email minimal 50 karakter')
    .max(10_000, 'Isi email maksimal 10.000 karakter'),
  enabled: z.boolean().default(true),
})

const deleteSchema = z.object({
  tenantSlug: z.string().min(1, 'Slug tenant wajib diisi'),
  status: z.enum(TEMPLATE_STATUS_VALUES, {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
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

type LoadCtx =
  | { error: string }
  | { tenant: { id: string; slug: string }; actorId: string }

/**
 * Resolve the tenant from a slug + verify the caller has `job.update` perm.
 * Email templates are an *operational* recruiter concern (same recruiters that
 * change application status configure the message that goes out), not a
 * tenant-config one, so we deliberately gate on `job.update` rather than
 * `tenant.update`.
 */
async function loadTenantForEmailTemplates(tenantSlug: string): Promise<LoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Anda harus masuk.' }
  }
  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true },
    })
    .catch(() => null)
  if (!tenant) return { error: 'Tenant tidak ditemukan.' }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return { tenant, actorId }
}

export async function upsertEmailTemplate(input: {
  tenantSlug: string
  status: string
  subject: string
  body: string
  enabled?: boolean
}): Promise<ActionResult<{ id: string; created: boolean }>> {
  const parsed = upsertSchema.safeParse({
    tenantSlug: input.tenantSlug,
    status: input.status,
    subject: input.subject,
    body: input.body,
    enabled: input.enabled ?? true,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data

  const ctx = await loadTenantForEmailTemplates(data.tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const existing = await prisma.tenantEmailTemplate.findUnique({
      where: { tenantId_status: { tenantId: ctx.tenant.id, status: data.status } },
      select: { id: true },
    })

    const row = await prisma.tenantEmailTemplate.upsert({
      where: { tenantId_status: { tenantId: ctx.tenant.id, status: data.status } },
      update: {
        subject: data.subject,
        body: data.body,
        enabled: data.enabled,
      },
      create: {
        tenantId: ctx.tenant.id,
        status: data.status,
        subject: data.subject,
        body: data.body,
        enabled: data.enabled,
      },
      select: { id: true },
    })

    const created = !existing
    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: created ? AuditAction.CREATE : AuditAction.UPDATE,
        resource: 'tenant.email_template',
        resourceId: row.id,
        metadata: {
          status: data.status,
          enabled: data.enabled,
          subjectLength: data.subject.length,
          bodyLength: data.body.length,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${data.tenantSlug}/email-templates`)
    return { ok: true, data: { id: row.id, created } }
  } catch (err) {
    console.error('[upsertEmailTemplate] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function deleteEmailTemplate(input: {
  tenantSlug: string
  status: string
}): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, status } = parsed.data

  const ctx = await loadTenantForEmailTemplates(tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const existing = await prisma.tenantEmailTemplate.findUnique({
      where: { tenantId_status: { tenantId: ctx.tenant.id, status } },
      select: { id: true },
    })
    if (!existing) {
      // Treat as success — the template is already gone, so the user got what
      // they wanted (status reverts to default).
      return { ok: true }
    }

    await prisma.tenantEmailTemplate.delete({
      where: { tenantId_status: { tenantId: ctx.tenant.id, status } },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.DELETE,
        resource: 'tenant.email_template',
        resourceId: existing.id,
        metadata: { status } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${tenantSlug}/email-templates`)
    return { ok: true }
  } catch (err) {
    console.error('[deleteEmailTemplate] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
