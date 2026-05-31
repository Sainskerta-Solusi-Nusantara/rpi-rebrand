'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

const RESOURCE_TYPES = ['job', 'course', 'user', 'profile', 'message', 'application'] as const
const REASONS = ['spam', 'inappropriate', 'misleading', 'copyright', 'other'] as const
const FLAG_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'] as const
const REMOVAL_ACTIONS = ['suspend_user', 'archive_job', 'archive_course', 'soft_delete_message'] as const

// Cap: 5 flags per reporter per rolling 24h window.
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_MAX = 5

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

async function requireAdmin(level: 'ADMIN' | 'SUPERADMIN' = 'ADMIN') {
  const session = await auth()
  if (!session?.user) return null
  const role = session.user.globalRole
  if (level === 'SUPERADMIN' && role !== 'SUPERADMIN') return null
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') return null
  return session.user
}

async function requireUser() {
  const session = await auth()
  return session?.user ?? null
}

/**
 * Best-effort lookup of the owner user id for a given resource.
 * Used to notify the resource owner when a flag is resolved.
 */
async function findResourceOwnerId(
  resourceType: (typeof RESOURCE_TYPES)[number],
  resourceId: string,
): Promise<string | null> {
  try {
    switch (resourceType) {
      case 'job': {
        const j = await prisma.job.findUnique({
          where: { id: resourceId },
          select: { postedById: true },
        })
        return j?.postedById ?? null
      }
      case 'course': {
        const c = await prisma.course.findUnique({
          where: { id: resourceId },
          select: { instructorId: true },
        })
        return c?.instructorId ?? null
      }
      case 'user':
      case 'profile':
        return resourceId
      case 'application': {
        const a = await prisma.application.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        })
        return a?.userId ?? null
      }
      case 'message':
        return null
      default:
        return null
    }
  } catch {
    return null
  }
}

const submitFlagSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  resourceId: z.string().min(1).max(64),
  reason: z.enum(REASONS),
  description: z.string().trim().max(2000).optional(),
})

/**
 * Submit a moderation flag. Any signed-in user can submit.
 * Rate-limited to RATE_LIMIT_MAX flags per reporter per 24h.
 * No-op (returns ok) if the same reporter already flagged the same
 * resource (any status). Prevents duplicate noise.
 */
export async function submitFlag(input: {
  resourceType: (typeof RESOURCE_TYPES)[number]
  resourceId: string
  reason: (typeof REASONS)[number]
  description?: string
}): Promise<ActionResult> {
  const parsed = submitFlagSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Input tidak valid.' }
  const { resourceType, resourceId, reason, description } = parsed.data

  const actor = await requireUser()
  if (!actor) return { ok: false, error: 'Anda harus masuk untuk melaporkan.' }

  try {
    // Duplicate-check: same reporter, same resource — quietly succeed.
    const existing = await prisma.moderationFlag.findFirst({
      where: {
        reportedById: actor.id,
        resourceType,
        resourceId,
      },
      select: { id: true },
    })
    if (existing) return { ok: true }

    // Rate-limit: 5 flags per rolling 24h window.
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
    const recentCount = await prisma.moderationFlag.count({
      where: {
        reportedById: actor.id,
        createdAt: { gte: windowStart },
      },
    })
    if (recentCount >= RATE_LIMIT_MAX) {
      return {
        ok: false,
        error: 'Anda telah mencapai batas laporan harian. Coba lagi nanti.',
      }
    }

    const meta = getRequestMeta()
    const flag = await prisma.moderationFlag.create({
      data: {
        resourceType,
        resourceId,
        reason,
        description: description?.trim() || null,
        reportedById: actor.id,
        status: 'pending',
      },
      select: { id: true },
    })

    await prisma.auditLog
      .create({
        data: {
          action: AuditAction.CREATE,
          userId: actor.id,
          resource: 'moderation.flag',
          resourceId: flag.id,
          metadata: { resourceType, resourceId, reason },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch(() => null)

    revalidatePath('/admin/moderasi')
    return { ok: true }
  } catch (err) {
    console.error('[submitFlag] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

const updateFlagStatusSchema = z.object({
  flagId: z.string().min(1),
  status: z.enum(['reviewing', 'resolved', 'dismissed']),
  resolution: z.string().trim().max(2000).optional(),
})

/**
 * Update a flag's status. Admin only.
 * Sets resolvedById + resolvedAt when status is resolved or dismissed.
 * Sends best-effort Notification to reportedBy (if any) and resource owner.
 */
export async function updateFlagStatus(input: {
  flagId: string
  status: 'reviewing' | 'resolved' | 'dismissed'
  resolution?: string
}): Promise<ActionResult> {
  const parsed = updateFlagStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Input tidak valid.' }
  const { flagId, status, resolution } = parsed.data

  const actor = await requireAdmin('ADMIN')
  if (!actor) return { ok: false, error: 'Akses ditolak.' }

  try {
    const flag = await prisma.moderationFlag.findUnique({
      where: { id: flagId },
      select: {
        id: true,
        status: true,
        resourceType: true,
        resourceId: true,
        reportedById: true,
      },
    })
    if (!flag) return { ok: false, error: 'Laporan tidak ditemukan.' }
    if (flag.status === status) return { ok: true }

    const isTerminal = status === 'resolved' || status === 'dismissed'
    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.moderationFlag.update({
        where: { id: flagId },
        data: {
          status,
          resolution: resolution?.trim() || null,
          resolvedById: isTerminal ? actor.id : null,
          resolvedAt: isTerminal ? new Date() : null,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          userId: actor.id,
          resource: 'moderation.flag',
          resourceId: flagId,
          metadata: { from: flag.status, to: status, resolution: resolution ?? null },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    if (isTerminal) {
      // Best-effort notifications.
      const recipients = new Set<string>()
      if (flag.reportedById) recipients.add(flag.reportedById)
      const ownerId = await findResourceOwnerId(
        flag.resourceType as (typeof RESOURCE_TYPES)[number],
        flag.resourceId,
      )
      if (ownerId) recipients.add(ownerId)

      const title =
        status === 'resolved'
          ? 'Laporan moderasi diselesaikan'
          : 'Laporan moderasi ditolak'
      const body = resolution?.trim()
        ? resolution.trim().slice(0, 500)
        : status === 'resolved'
          ? 'Tim moderator telah menyelesaikan laporan Anda.'
          : 'Tim moderator memutuskan tidak ada tindakan yang diperlukan.'

      await Promise.allSettled(
        Array.from(recipients).map((userId) =>
          prisma.notification.create({
            data: {
              userId,
              type: 'SYSTEM',
              title,
              body,
              link: `/admin/moderasi/${flagId}`,
            },
          }),
        ),
      )
    }

    revalidatePath('/admin/moderasi')
    revalidatePath(`/admin/moderasi/${flagId}`)
    return { ok: true }
  } catch (err) {
    console.error('[updateFlagStatus] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

const removeContentSchema = z.object({
  flagId: z.string().min(1),
  action: z.enum(REMOVAL_ACTIONS),
})

/**
 * Apply a removal action against the flagged resource. Admin only.
 * Marks the flag resolved with resolution = action.
 */
export async function removeContent(input: {
  flagId: string
  action: (typeof REMOVAL_ACTIONS)[number]
}): Promise<ActionResult> {
  const parsed = removeContentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Input tidak valid.' }
  const { flagId, action } = parsed.data

  const actor = await requireAdmin('ADMIN')
  if (!actor) return { ok: false, error: 'Akses ditolak.' }

  try {
    const flag = await prisma.moderationFlag.findUnique({
      where: { id: flagId },
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
        reportedById: true,
        status: true,
      },
    })
    if (!flag) return { ok: false, error: 'Laporan tidak ditemukan.' }

    const resourceType = flag.resourceType as (typeof RESOURCE_TYPES)[number]
    const resourceId = flag.resourceId

    // Validate action against resourceType.
    const valid =
      (action === 'archive_job' && resourceType === 'job') ||
      (action === 'archive_course' && resourceType === 'course') ||
      (action === 'suspend_user' && (resourceType === 'user' || resourceType === 'profile')) ||
      (action === 'soft_delete_message' && resourceType === 'message')

    if (!valid) {
      return { ok: false, error: 'Tindakan tidak sesuai dengan jenis konten.' }
    }

    // For MVP we explicitly skip soft_delete_message — no Message model handling here.
    if (action === 'soft_delete_message') {
      return { ok: false, error: 'Tindakan pesan belum tersedia.' }
    }

    const meta = getRequestMeta()

    if (action === 'archive_job') {
      await prisma.job.update({
        where: { id: resourceId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: 'ARCHIVED' as any },
      })
    } else if (action === 'archive_course') {
      await prisma.course.update({
        where: { id: resourceId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: 'ARCHIVED' as any },
      })
    } else if (action === 'suspend_user') {
      // resourceId is the user id for both 'user' and 'profile' types.
      if (actor.id === resourceId) {
        return { ok: false, error: 'Tidak dapat menangguhkan akun Anda sendiri.' }
      }
      await prisma.user.update({
        where: { id: resourceId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: 'SUSPENDED' as any },
      })
    }

    await prisma.$transaction([
      prisma.moderationFlag.update({
        where: { id: flagId },
        data: {
          status: 'resolved',
          resolution: action,
          resolvedById: actor.id,
          resolvedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          userId: actor.id,
          resource: 'moderation.flag',
          resourceId: flagId,
          metadata: { removalAction: action, resourceType, targetResourceId: resourceId },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    // Best-effort notify.
    const recipients = new Set<string>()
    if (flag.reportedById) recipients.add(flag.reportedById)
    const ownerId = await findResourceOwnerId(resourceType, resourceId)
    if (ownerId) recipients.add(ownerId)

    await Promise.allSettled(
      Array.from(recipients).map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title: 'Tindakan moderasi diterapkan',
            body: `Tindakan: ${action}.`,
            link: `/admin/moderasi/${flagId}`,
          },
        }),
      ),
    )

    revalidatePath('/admin/moderasi')
    revalidatePath(`/admin/moderasi/${flagId}`)
    return { ok: true }
  } catch (err) {
    console.error('[removeContent] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
