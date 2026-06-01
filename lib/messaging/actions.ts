'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, NotificationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import type { Session } from 'next-auth'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export type MessageRow = {
  id: string
  threadId: string
  senderId: string
  body: string
  readByCandidateAt: Date | null
  readByRecruiterAt: Date | null
  createdAt: Date
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

const sendSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
  body: z
    .string()
    .min(1, 'Pesan tidak boleh kosong')
    .max(5000, 'Pesan maksimal 5000 karakter')
    .transform((v) => v.trim()),
})

const markReadSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
})

const getAfterSchema = z.object({
  applicationId: z.string().min(1, 'ID lamaran wajib diisi'),
  sinceMessageId: z.string().nullable().optional(),
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

type ApplicationCtx = {
  id: string
  tenantId: string
  userId: string
  tenant: { slug: string; name: string }
  job: { title: string }
  user: { id: string; name: string | null; email: string }
}

/**
 * Determine the viewer's role in the messaging context. A user can be:
 *  - 'candidate' if they own the application (userId match)
 *  - 'recruiter' if they hold job.update on the application's tenant
 *  - null otherwise (unauthorized to view/send messages)
 *
 * NOTE: candidate role takes precedence if the same user somehow appears in
 * both buckets (e.g. test data). In practice the same user can't apply to
 * their own tenant's job, but the check is defensive.
 */
function resolveRole(
  session: Session,
  application: { tenantId: string; userId: string },
): 'candidate' | 'recruiter' | null {
  if (session.user.id === application.userId) return 'candidate'
  if (
    hasTenantPermission(
      session.user.globalRole,
      session.user.tenants,
      application.tenantId,
      'job.update',
    )
  ) {
    return 'recruiter'
  }
  return null
}

type LoadResult =
  | { error: string }
  | {
      session: Session
      application: ApplicationCtx
      role: 'candidate' | 'recruiter'
    }

async function loadContext(applicationId: string): Promise<LoadResult> {
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
        userId: true,
        tenant: { select: { slug: true, name: true } },
        job: { select: { title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    .catch(() => null)
  if (!application) return { error: 'Lamaran tidak ditemukan.' }

  const role = resolveRole(session, {
    tenantId: application.tenantId,
    userId: application.userId,
  })
  if (!role) return { error: 'Anda tidak memiliki izin.' }

  return { session, application, role }
}

function revalidateThread(
  tenantSlug: string,
  applicationId: string,
) {
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}/pesan`)
  revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}`)
  revalidatePath(`/dashboard/lamaran/${applicationId}/pesan`)
  revalidatePath(`/dashboard/lamaran`)
}

/**
 * Send a message in the application thread. Creates the thread on first send.
 * Authorize: candidate (userId) OR recruiter with job.update on tenant.
 */
export async function sendMessage(input: {
  applicationId: string
  body: string
}): Promise<ActionResult<{ messageId: string }>> {
  const parsed = sendSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { applicationId, body } = parsed.data

  const ctx = await loadContext(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { session, application, role } = ctx
  const senderId = session.user.id

  try {
    const now = new Date()

    // Upsert thread + insert message in a single transaction. Reading the
    // existing thread first avoids a Prisma upsert because applicationId is
    // unique and we want to seed lastMessageAt atomically.
    const message = await prisma.$transaction(async (tx) => {
      const thread = await tx.messageThread.upsert({
        where: { applicationId },
        create: { applicationId, lastMessageAt: now },
        update: { lastMessageAt: now },
        select: { id: true },
      })
      return tx.message.create({
        data: {
          threadId: thread.id,
          senderId,
          body,
          // Pre-mark as read for the sender side so unread counts stay clean.
          readByCandidateAt: role === 'candidate' ? now : null,
          readByRecruiterAt: role === 'recruiter' ? now : null,
        },
        select: { id: true },
      })
    })

    const meta = getRequestMeta()
    await prisma.auditLog
      .create({
        data: {
          tenantId: application.tenantId,
          userId: senderId,
          action: AuditAction.CREATE,
          resource: 'application.message',
          resourceId: message.id,
          metadata: {
            applicationId,
            role,
            bodyLength: body.length,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch((err) => {
        console.error('[sendMessage] audit log failed', err)
      })

    // Notify the OTHER party. NotificationType.MESSAGE isn't in the enum, so
    // we use APPLICATION_UPDATE which is the closest semantic match.
    const recipientUserId =
      role === 'candidate'
        ? null /* notify the recruiter team — but we don't have a single user, see below */
        : application.userId
    const candidateLink = `/dashboard/lamaran/${applicationId}/pesan`
    const recruiterLink = `/dashboard/tenants/${application.tenant.slug}/lamaran/${applicationId}/pesan`
    const preview = body.length > 200 ? body.slice(0, 200) + '…' : body
    // Push uses a slightly shorter preview (120 chars) — mobile notification
    // surfaces typically truncate well before 200.
    const pushPreview = body.length > 120 ? body.slice(0, 120) + '…' : body

    if (role === 'recruiter' && recipientUserId) {
      await prisma.notification
        .create({
          data: {
            userId: recipientUserId,
            type: NotificationType.APPLICATION_UPDATE,
            title: `Pesan baru dari ${application.tenant.name}`,
            body: preview,
            link: candidateLink,
          },
        })
        .catch((err) => {
          console.error('[sendMessage] notify candidate failed', err)
        })

      // ---- BEGIN PUSH NOTIFICATION ------------------------------------
      // Recruiter → candidate. Treated as critical per PUSH_EVENT_CONFIG
      // (newMessage.critical === true) — no NotificationPref gate. Dynamic
      // import keeps push optional / decoupled. Fire-and-forget.
      void import('@/lib/push/dispatch')
        .then((m) =>
          m.dispatchPushToUser(recipientUserId, {
            title: `Pesan baru dari ${application.tenant.name}`,
            body: pushPreview,
            url: candidateLink,
          }),
        )
        .catch(() => {})
      // ---- END PUSH NOTIFICATION --------------------------------------
    } else if (role === 'candidate') {
      // Notify every tenant member with job.update access. We fan out to all
      // OWNER/ADMIN/RECRUITER memberships of this tenant so any of them can
      // see the unread badge. SUPERADMIN/ADMIN globals aren't included here
      // because they may flood — they can still see threads via the dashboard.
      try {
        const senderName =
          application.user.name ?? application.user.email ?? 'Pelamar'
        const recruiters = await prisma.userTenant.findMany({
          where: {
            tenantId: application.tenantId,
            role: { in: ['OWNER', 'ADMIN', 'RECRUITER'] },
            status: 'active',
          },
          select: { userId: true },
        })
        if (recruiters.length > 0) {
          await prisma.notification.createMany({
            data: recruiters.map((r) => ({
              userId: r.userId,
              type: NotificationType.APPLICATION_UPDATE,
              title: `Pesan baru dari ${senderName}`,
              body: preview,
              link: recruiterLink,
            })),
            skipDuplicates: true,
          })

          // ---- BEGIN PUSH NOTIFICATION --------------------------------
          // Candidate → recruiter fan-out. Each recruiter receives a push
          // independently — failure to deliver to one MUST NOT prevent the
          // others. dispatchPushToUser already swallows its own errors, so
          // we just need to keep the import/import-failure path quiet too.
          // Critical event per PUSH_EVENT_CONFIG (no pref gate).
          void import('@/lib/push/dispatch')
            .then((m) => {
              for (const r of recruiters) {
                m.dispatchPushToUser(r.userId, {
                  title: `Pesan baru dari ${senderName}`,
                  body: pushPreview,
                  url: recruiterLink,
                }).catch(() => {})
              }
            })
            .catch(() => {})
          // ---- END PUSH NOTIFICATION ----------------------------------
        }
      } catch (err) {
        console.error('[sendMessage] notify recruiters failed', err)
      }
    }

    revalidateThread(application.tenant.slug, applicationId)
    return { ok: true, data: { messageId: message.id } }
  } catch (err) {
    console.error('[sendMessage] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * Mark all messages in the thread as read by the viewer's role. Sets
 * readByCandidateAt or readByRecruiterAt = now for any rows where the
 * respective field is null.
 */
export async function markThreadRead(
  applicationId: string,
): Promise<ActionResult> {
  const parsed = markReadSchema.safeParse({ applicationId })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }

  const ctx = await loadContext(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { application, role } = ctx

  try {
    const thread = await prisma.messageThread.findUnique({
      where: { applicationId },
      select: { id: true },
    })
    if (!thread) return { ok: true } // nothing to mark

    const now = new Date()
    if (role === 'candidate') {
      await prisma.message.updateMany({
        where: { threadId: thread.id, readByCandidateAt: null },
        data: { readByCandidateAt: now },
      })
    } else {
      await prisma.message.updateMany({
        where: { threadId: thread.id, readByRecruiterAt: null },
        data: { readByRecruiterAt: now },
      })
    }

    revalidateThread(application.tenant.slug, applicationId)
    return { ok: true }
  } catch (err) {
    console.error('[markThreadRead] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

/**
 * Fetch messages strictly after the given sinceMessageId. If null, returns
 * all messages in the thread. Used by the polling client to append fresh
 * messages without refetching the entire thread.
 */
export async function getMessagesAfter(input: {
  applicationId: string
  sinceMessageId: string | null
}): Promise<ActionResult<{ messages: MessageRow[] }>> {
  const parsed = getAfterSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    }
  }
  const { applicationId, sinceMessageId } = parsed.data

  const ctx = await loadContext(applicationId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const thread = await prisma.messageThread.findUnique({
      where: { applicationId },
      select: { id: true },
    })
    if (!thread) return { ok: true, data: { messages: [] } }

    let sinceCreatedAt: Date | null = null
    if (sinceMessageId) {
      const since = await prisma.message.findUnique({
        where: { id: sinceMessageId },
        select: { createdAt: true, threadId: true },
      })
      // Ignore if the supplied id belongs to a different thread (defensive).
      if (since && since.threadId === thread.id) {
        sinceCreatedAt = since.createdAt
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        threadId: thread.id,
        ...(sinceCreatedAt ? { createdAt: { gt: sinceCreatedAt } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        threadId: true,
        senderId: true,
        body: true,
        readByCandidateAt: true,
        readByRecruiterAt: true,
        createdAt: true,
        sender: { select: { id: true, name: true, image: true } },
      },
    })

    return { ok: true, data: { messages } }
  } catch (err) {
    console.error('[getMessagesAfter] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
