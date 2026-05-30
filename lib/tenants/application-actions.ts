'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ApplicationStatus, AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const MANAGEABLE_STATUSES = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
] as const

const statusSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
  status: z.nativeEnum(ApplicationStatus, {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
})

const noteSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
  notes: z
    .string()
    .max(5000, 'Catatan maksimal 5000 karakter')
    .transform((v) => v.trim()),
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
  | {
      actorId: string
      application: {
        id: string
        tenantId: string
        status: ApplicationStatus
        notes: string | null
        tenant: { slug: string }
      }
    }

/**
 * Verify the caller can manage the given application, returning the loaded
 * record + tenant slug. Gates on `job.update` (recruiter scope).
 */
async function loadTenantForApplication(applicationId: string): Promise<LoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Anda harus masuk.' }
  }
  const application = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        notes: true,
        tenant: { select: { slug: true } },
      },
    })
    .catch(() => null)
  if (!application) return { error: 'Lamaran tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, application.tenantId, 'job.update')) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return { actorId, application }
}

export async function updateApplicationStatus(input: {
  applicationId: string
  status: ApplicationStatus | string
}): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId, status } = parsed.data

  if (status === ApplicationStatus.WITHDRAWN) {
    return {
      ok: false,
      error: 'Status WITHDRAWN hanya dapat diatur oleh pelamar.',
      field: 'status',
    }
  }
  if (!MANAGEABLE_STATUSES.includes(status as (typeof MANAGEABLE_STATUSES)[number])) {
    return { ok: false, error: 'Status tidak valid', field: 'status' }
  }

  const ctx = await loadTenantForApplication(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.application.status === status) {
    // No-op; treat as success so the UI doesn't flicker an error.
    return { ok: true }
  }

  try {
    await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application',
        resourceId: applicationId,
        metadata: {
          from: ctx.application.status,
          to: status,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.application.tenant.slug}/lamaran`)
    revalidatePath(
      `/dashboard/tenants/${ctx.application.tenant.slug}/lamaran/${applicationId}`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateApplicationStatus] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function updateApplicationNote(input: {
  applicationId: string
  notes: string
}): Promise<ActionResult> {
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId, notes } = parsed.data

  const ctx = await loadTenantForApplication(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    await prisma.application.update({
      where: { id: applicationId },
      data: { notes: notes.length === 0 ? null : notes },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application',
        resourceId: applicationId,
        metadata: { notesLength: notes.length } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.application.tenant.slug}/lamaran`)
    revalidatePath(
      `/dashboard/tenants/${ctx.application.tenant.slug}/lamaran/${applicationId}`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateApplicationNote] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
