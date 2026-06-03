'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string; field?: string }

const SEVERITIES = ['minor', 'major', 'critical'] as const
const INCIDENT_STATUSES = [
  'investigating',
  'identified',
  'monitoring',
  'resolved',
] as const
const MAINTENANCE_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

function requireSuperadmin(globalRole: string | undefined, msg: string): string | null {
  if (globalRole !== 'SUPERADMIN') {
    return msg
  }
  return null
}

/**
 * Convert a comma-separated services list ("web, api, database") into a clean
 * `string[]`. Trims, lowercases, dedupes, and drops empties.
 */
function parseServices(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  const seen = new Set<string>()
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => {
      if (!s) return false
      if (seen.has(s)) return false
      seen.add(s)
      return true
    })
}

async function writeAudit(
  userId: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    })
  } catch {
    /* never block on audit failures */
  }
}

function revalidateStatus(id?: string) {
  revalidatePath('/status')
  revalidatePath('/status/feed.json')
  revalidatePath('/admin/status')
  if (id) {
    revalidatePath(`/status/incidents/${id}`)
    revalidatePath(`/admin/status/incidents/${id}`)
  }
}

function revalidateMaintenance(id?: string) {
  revalidatePath('/status')
  revalidatePath('/status/feed.json')
  revalidatePath('/admin/status')
  if (id) {
    revalidatePath(`/status/maintenance/${id}`)
    revalidatePath(`/admin/status/maintenance/${id}`)
  }
}

/* -------------------------------------------------------------------------- */
/*  Incidents                                                                  */
/* -------------------------------------------------------------------------- */

const createIncidentSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200, 'Judul maksimal 200 karakter'),
  severity: z.enum(SEVERITIES, {
    errorMap: () => ({ message: 'Tingkat keparahan tidak valid' }),
  }),
  status: z.enum(INCIDENT_STATUSES, {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
  affectedServices: z.preprocess(emptyToUndefined, z.string().optional()),
  startedAt: z.preprocess(emptyToUndefined, z.string().optional()),
  message: z.preprocess(
    emptyToUndefined,
    z.string().max(2000, 'Pesan maksimal 2000 karakter').optional(),
  ),
})

/**
 * Create an IncidentReport and seed it with the first IncidentUpdate so the
 * timeline is non-empty. We do these in a transaction so a partial creation
 * never reaches the public page.
 */
export async function createIncident(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole, t.srvCalendar.statusIncident.superadminOnly)
  if (denied) return { ok: false, error: denied }

  const raw = {
    title: formData.get('title'),
    severity: formData.get('severity'),
    status: formData.get('status'),
    affectedServices: formData.get('affectedServices'),
    startedAt: formData.get('startedAt'),
    message: formData.get('message'),
  }
  const parsed = createIncidentSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvCalendar.statusIncident.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data
  const affectedServices = parseServices(data.affectedServices)
  const startedAt = data.startedAt ? new Date(data.startedAt) : new Date()
  if (Number.isNaN(startedAt.getTime())) {
    return { ok: false, error: t.srvCalendar.statusIncident.startedAtInvalid, field: 'startedAt' }
  }

  try {
    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incidentReport.create({
        data: {
          title: data.title,
          severity: data.severity,
          status: data.status,
          affectedServices: affectedServices as Prisma.InputJsonValue,
          startedAt,
          resolvedAt: data.status === 'resolved' ? new Date() : null,
          createdById: session.user.id,
        },
      })
      await tx.incidentUpdate.create({
        data: {
          incidentId: created.id,
          status: data.status,
          message: data.message ?? data.title,
          postedById: session.user.id,
        },
      })
      return created
    })

    await writeAudit(
      session.user.id,
      AuditAction.CREATE,
      'status.incident.created',
      incident.id,
      { title: incident.title, severity: incident.severity, status: incident.status },
    )
    revalidateStatus(incident.id)
    return { ok: true, data: { id: incident.id } }
  } catch (err) {
    console.error('[createIncident] failed', err)
    return { ok: false, error: t.srvCalendar.statusIncident.createIncidentFailed }
  }
}

const postUpdateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES, {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
  message: z
    .string()
    .trim()
    .min(1, 'Pesan wajib diisi')
    .max(2000, 'Pesan maksimal 2000 karakter'),
})

/**
 * Append an IncidentUpdate. If the update transitions the incident to
 * `resolved`, the parent IncidentReport.resolvedAt is stamped to now so the
 * status page surfaces the resolution time.
 */
export async function postIncidentUpdate(
  incidentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole, t.srvCalendar.statusIncident.superadminOnly)
  if (denied) return { ok: false, error: denied }

  const raw = {
    status: formData.get('status'),
    message: formData.get('message'),
  }
  const parsed = postUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvCalendar.statusIncident.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      await tx.incidentUpdate.create({
        data: {
          incidentId,
          status: data.status,
          message: data.message,
          postedById: session.user.id,
        },
      })
      await tx.incidentReport.update({
        where: { id: incidentId },
        data: {
          status: data.status,
          resolvedAt: data.status === 'resolved' ? new Date() : undefined,
        },
      })
    })

    await writeAudit(
      session.user.id,
      AuditAction.UPDATE,
      'status.incident.updated',
      incidentId,
      { status: data.status },
    )
    revalidateStatus(incidentId)
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: t.srvCalendar.statusIncident.incidentNotFound }
    }
    console.error('[postIncidentUpdate] failed', err)
    return { ok: false, error: t.srvCalendar.statusIncident.postUpdateFailed }
  }
}

/**
 * Soft-delete an incident by force-resolving it with an admin note. We avoid
 * a hard DELETE so the audit trail + history strip remain intact.
 */
export async function deleteIncident(id: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole, t.srvCalendar.statusIncident.superadminOnly)
  if (denied) return { ok: false, error: denied }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.incidentReport.update({
        where: { id },
        data: { status: 'resolved', resolvedAt: new Date() },
      })
      await tx.incidentUpdate.create({
        data: {
          incidentId: id,
          status: 'resolved',
          message: 'Removed by admin.',
          postedById: session.user.id,
        },
      })
    })

    await writeAudit(
      session.user.id,
      AuditAction.DELETE,
      'status.incident.deleted',
      id,
      {},
    )
    revalidateStatus(id)
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: t.srvCalendar.statusIncident.incidentNotFound }
    }
    console.error('[deleteIncident] failed', err)
    return { ok: false, error: t.srvCalendar.statusIncident.deleteIncidentFailed }
  }
}

/* -------------------------------------------------------------------------- */
/*  Scheduled maintenance                                                      */
/* -------------------------------------------------------------------------- */

const createMaintenanceSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
    description: z.preprocess(
      emptyToUndefined,
      z.string().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
    ),
    affectedServices: z.preprocess(emptyToUndefined, z.string().optional()),
    scheduledStart: z.string().min(1, 'Waktu mulai wajib diisi'),
    scheduledEnd: z.string().min(1, 'Waktu selesai wajib diisi'),
  })
  .superRefine((d, ctx) => {
    const start = new Date(d.scheduledStart)
    const end = new Date(d.scheduledEnd)
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledStart'],
        message: 'Waktu mulai tidak valid',
      })
    }
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledEnd'],
        message: 'Waktu selesai tidak valid',
      })
    }
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end.getTime() <= start.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledEnd'],
        message: 'Waktu selesai harus setelah waktu mulai',
      })
    }
  })

export async function createMaintenance(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole, t.srvCalendar.statusIncident.superadminOnly)
  if (denied) return { ok: false, error: denied }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    affectedServices: formData.get('affectedServices'),
    scheduledStart: formData.get('scheduledStart'),
    scheduledEnd: formData.get('scheduledEnd'),
  }
  const parsed = createMaintenanceSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvCalendar.statusIncident.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data
  const affectedServices = parseServices(data.affectedServices)

  try {
    const maintenance = await prisma.scheduledMaintenance.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        affectedServices: affectedServices as Prisma.InputJsonValue,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        status: 'planned',
        createdById: session.user.id,
      },
    })

    await writeAudit(
      session.user.id,
      AuditAction.CREATE,
      'status.maintenance.scheduled',
      maintenance.id,
      {
        title: maintenance.title,
        start: maintenance.scheduledStart.toISOString(),
        end: maintenance.scheduledEnd.toISOString(),
      },
    )
    revalidateMaintenance(maintenance.id)
    return { ok: true, data: { id: maintenance.id } }
  } catch (err) {
    console.error('[createMaintenance] failed', err)
    return { ok: false, error: t.srvCalendar.statusIncident.createMaintenanceFailed }
  }
}

/**
 * Single status transition. We don't enforce the legal transition graph at
 * the DB layer; the form only offers valid next-states.
 */
export async function updateMaintenanceStatus(
  id: string,
  status: (typeof MAINTENANCE_STATUSES)[number],
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole, t.srvCalendar.statusIncident.superadminOnly)
  if (denied) return { ok: false, error: denied }

  if (!MAINTENANCE_STATUSES.includes(status)) {
    return { ok: false, error: t.srvCalendar.statusIncident.statusInvalid }
  }

  try {
    const m = await prisma.scheduledMaintenance.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    })
    await writeAudit(
      session.user.id,
      AuditAction.UPDATE,
      'status.maintenance.status_changed',
      m.id,
      { status: m.status },
    )
    revalidateMaintenance(id)
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: t.srvCalendar.statusIncident.maintenanceNotFound }
    }
    console.error('[updateMaintenanceStatus] failed', err)
    return { ok: false, error: t.srvCalendar.statusIncident.updateMaintenanceFailed }
  }
}
