'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ApplicationStatus, AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { env } from '@/lib/env'
import {
  sendEmail,
  interviewScheduledEmail,
  interviewCancelledEmail,
} from '@/lib/mailer'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const INTERVIEW_TYPES = ['video', 'onsite', 'phone'] as const
type InterviewType = (typeof INTERVIEW_TYPES)[number]

/**
 * Statuses that should be auto-bumped to INTERVIEW when a new interview row
 * is scheduled. We never downgrade later stages (OFFERED, HIRED, REJECTED,
 * WITHDRAWN) and we don't re-bump INTERVIEW itself.
 */
const STATUSES_TO_BUMP: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWED,
  ApplicationStatus.SHORTLISTED,
]

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
 * Shared core schema for an interview payload. The discriminated `type`
 * field gates whether meetingUrl or location is required.
 */
const baseInterviewShape = {
  scheduledAt: z
    .string()
    .min(1, 'Tanggal & jam wajib diisi')
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'Format tanggal tidak valid',
    })
    .transform((v) => new Date(v))
    .refine((d) => d.getTime() > Date.now(), {
      message: 'Tidak bisa menjadwalkan wawancara di masa lalu',
    }),
  durationMin: z
    .number({
      invalid_type_error: 'Durasi harus berupa angka',
      required_error: 'Durasi wajib diisi',
    })
    .int('Durasi harus bilangan bulat')
    .min(15, 'Durasi minimal 15 menit')
    .max(480, 'Durasi maksimal 480 menit'),
  type: z.enum(INTERVIEW_TYPES, {
    errorMap: () => ({ message: 'Jenis wawancara tidak valid' }),
  }),
  meetingUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  location: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  notes: z
    .string()
    .max(5000, 'Catatan maksimal 5000 karakter')
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
}

function applyTypeRefinements<T extends z.ZodTypeAny>(schema: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (schema as any)
    .refine(
      (data: {
        type: InterviewType
        meetingUrl?: string
      }) => {
        if (data.type !== 'video') return true
        if (!data.meetingUrl) return false
        try {
          new URL(data.meetingUrl)
          return true
        } catch {
          return false
        }
      },
      {
        message: 'Tautan meeting wajib berupa URL valid untuk wawancara video',
        path: ['meetingUrl'],
      },
    )
    .refine(
      (data: { type: InterviewType; location?: string }) => {
        if (data.type !== 'onsite') return true
        if (!data.location) return false
        const len = data.location.length
        return len >= 2 && len <= 200
      },
      {
        message: 'Lokasi wajib diisi (2-200 karakter) untuk wawancara onsite',
        path: ['location'],
      },
    )
}

const scheduleSchema = applyTypeRefinements(
  z.object({
    applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
    ...baseInterviewShape,
  }),
)

const updateSchema = applyTypeRefinements(
  z.object({
    interviewId: z.string().min(1, 'ID wawancara wajib diisi'),
    ...baseInterviewShape,
  }),
)

type LoadAppCtx =
  | { error: string }
  | {
      actorId: string
      application: {
        id: string
        tenantId: string
        status: ApplicationStatus
        userId: string
        tenant: { slug: string; name: string }
        job: { title: string }
        user: { email: string; name: string | null }
      }
    }

async function loadTenantForApplication(
  applicationId: string,
): Promise<LoadAppCtx> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Anda harus masuk.' }
  const application = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        userId: true,
        tenant: { select: { slug: true, name: true } },
        job: { select: { title: true } },
        user: { select: { email: true, name: true } },
      },
    })
    .catch(() => null)
  if (!application) return { error: 'Lamaran tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(globalRole, tenants, application.tenantId, 'job.update')
  ) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return { actorId, application }
}

type LoadInterviewCtx =
  | { error: string }
  | {
      actorId: string
      interview: {
        id: string
        applicationId: string
        scheduledAt: Date
        durationMin: number
        type: string
        meetingUrl: string | null
        location: string | null
        notes: string | null
        status: string
        application: {
          id: string
          tenantId: string
          status: ApplicationStatus
          userId: string
          tenant: { slug: string; name: string }
          job: { title: string }
          user: { email: string; name: string | null }
        }
      }
    }

async function loadTenantForInterview(
  interviewId: string,
): Promise<LoadInterviewCtx> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Anda harus masuk.' }
  const interview = await prisma.interviewSchedule
    .findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        applicationId: true,
        scheduledAt: true,
        durationMin: true,
        type: true,
        meetingUrl: true,
        location: true,
        notes: true,
        status: true,
        application: {
          select: {
            id: true,
            tenantId: true,
            status: true,
            userId: true,
            tenant: { select: { slug: true, name: true } },
            job: { select: { title: true } },
            user: { select: { email: true, name: true } },
          },
        },
      },
    })
    .catch(() => null)
  if (!interview) return { error: 'Wawancara tidak ditemukan.' }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      interview.application.tenantId,
      'job.update',
    )
  ) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return { actorId, interview }
}

function revalidateForApplication(tenantSlug: string, applicationId: string) {
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}`)
  revalidatePath(`/dashboard/lamaran`)
  revalidatePath(`/dashboard/lamaran/${applicationId}/wawancara`)
}

export async function scheduleInterview(input: {
  applicationId: string
  scheduledAt: string
  durationMin: number
  type: string
  meetingUrl?: string
  location?: string
  notes?: string
}): Promise<ActionResult<{ interviewId: string }>> {
  const parsed = scheduleSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const {
    applicationId,
    scheduledAt,
    durationMin,
    type,
    meetingUrl,
    location,
    notes,
  } = parsed.data

  const ctx = await loadTenantForApplication(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const interview = await prisma.interviewSchedule.create({
      data: {
        applicationId,
        scheduledAt,
        durationMin,
        type,
        meetingUrl: type === 'video' ? meetingUrl ?? null : null,
        location: type === 'onsite' ? location ?? null : null,
        notes: notes ?? null,
        status: 'scheduled',
        createdById: ctx.actorId,
      },
      select: { id: true },
    })

    // Auto-bump application status if it's still in an early stage.
    const shouldBump = STATUSES_TO_BUMP.includes(ctx.application.status)
    if (shouldBump) {
      await prisma.application
        .update({
          where: { id: applicationId },
          data: { status: ApplicationStatus.INTERVIEW },
        })
        .catch((err) => {
          console.error('[scheduleInterview] status bump failed', err)
        })
    }

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'application.interview',
        resourceId: interview.id,
        metadata: {
          applicationId,
          scheduledAt: scheduledAt.toISOString(),
          durationMin,
          type,
          autoBumpedStatus: shouldBump
            ? {
                from: ctx.application.status,
                to: ApplicationStatus.INTERVIEW,
              }
            : null,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // Best-effort candidate notification — never fail the action on mail errors.
    if (ctx.application.user.email) {
      try {
        const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        const tpl = interviewScheduledEmail({
          name: ctx.application.user.name,
          jobTitle: ctx.application.job.title,
          tenantName: ctx.application.tenant.name,
          scheduledAt,
          durationMin,
          type,
          meetingUrl: meetingUrl ?? null,
          location: location ?? null,
          notes: notes ?? null,
          dashboardUrl: `${baseUrl}/dashboard/lamaran/${applicationId}/wawancara`,
        })
        await sendEmail({
          to: ctx.application.user.email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        })
      } catch (err) {
        console.error('[scheduleInterview] candidate notify failed', err)
      }
    }

    revalidateForApplication(ctx.application.tenant.slug, applicationId)
    return { ok: true, data: { interviewId: interview.id } }
  } catch (err) {
    console.error('[scheduleInterview] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function updateInterview(input: {
  interviewId: string
  scheduledAt: string
  durationMin: number
  type: string
  meetingUrl?: string
  location?: string
  notes?: string
}): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const {
    interviewId,
    scheduledAt,
    durationMin,
    type,
    meetingUrl,
    location,
    notes,
  } = parsed.data

  const ctx = await loadTenantForInterview(interviewId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.interview.status === 'cancelled') {
    return {
      ok: false,
      error: 'Wawancara yang sudah dibatalkan tidak dapat diubah.',
    }
  }

  try {
    const nextMeetingUrl = type === 'video' ? meetingUrl ?? null : null
    const nextLocation = type === 'onsite' ? location ?? null : null
    const nextNotes = notes ?? null

    const changed: string[] = []
    if (ctx.interview.scheduledAt.getTime() !== scheduledAt.getTime())
      changed.push('scheduledAt')
    if (ctx.interview.durationMin !== durationMin) changed.push('durationMin')
    if (ctx.interview.type !== type) changed.push('type')
    if ((ctx.interview.meetingUrl ?? null) !== nextMeetingUrl)
      changed.push('meetingUrl')
    if ((ctx.interview.location ?? null) !== nextLocation)
      changed.push('location')
    if ((ctx.interview.notes ?? null) !== nextNotes) changed.push('notes')

    // If nothing changed, treat as no-op success so the UI doesn't error.
    if (changed.length === 0) {
      return { ok: true }
    }

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        scheduledAt,
        durationMin,
        type,
        meetingUrl: nextMeetingUrl,
        location: nextLocation,
        notes: nextNotes,
        // Reset reminder so the H-1 cron can fire again for the new time.
        reminderSentAt: changed.includes('scheduledAt') ? null : undefined,
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.interview.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application.interview',
        resourceId: interviewId,
        metadata: { changed } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(
      ctx.interview.application.tenant.slug,
      ctx.interview.application.id,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateInterview] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function cancelInterview(
  interviewId: string,
): Promise<ActionResult> {
  if (!interviewId) return { ok: false, error: 'ID wawancara tidak valid.' }

  const ctx = await loadTenantForInterview(interviewId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.interview.status === 'cancelled') {
    return { ok: true } // idempotent
  }

  try {
    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: { status: 'cancelled' },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.interview.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application.interview',
        resourceId: interviewId,
        metadata: {
          status: { from: ctx.interview.status, to: 'cancelled' },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    if (ctx.interview.application.user.email) {
      try {
        const tpl = interviewCancelledEmail({
          name: ctx.interview.application.user.name,
          jobTitle: ctx.interview.application.job.title,
          tenantName: ctx.interview.application.tenant.name,
          scheduledAt: ctx.interview.scheduledAt,
        })
        await sendEmail({
          to: ctx.interview.application.user.email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        })
      } catch (err) {
        console.error('[cancelInterview] candidate notify failed', err)
      }
    }

    revalidateForApplication(
      ctx.interview.application.tenant.slug,
      ctx.interview.application.id,
    )
    return { ok: true }
  } catch (err) {
    console.error('[cancelInterview] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function markInterviewCompleted(
  interviewId: string,
): Promise<ActionResult> {
  if (!interviewId) return { ok: false, error: 'ID wawancara tidak valid.' }

  const ctx = await loadTenantForInterview(interviewId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.interview.status === 'completed') {
    return { ok: true } // idempotent
  }
  if (ctx.interview.status === 'cancelled') {
    return {
      ok: false,
      error: 'Wawancara yang sudah dibatalkan tidak dapat ditandai selesai.',
    }
  }

  try {
    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: { status: 'completed' },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.interview.application.tenantId,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'application.interview',
        resourceId: interviewId,
        metadata: {
          status: { from: ctx.interview.status, to: 'completed' },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateForApplication(
      ctx.interview.application.tenant.slug,
      ctx.interview.application.id,
    )
    return { ok: true }
  } catch (err) {
    console.error('[markInterviewCompleted] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
