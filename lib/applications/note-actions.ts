'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, NotificationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { parseMentions } from '@/lib/applications/mention-parser'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvApplications } from '@/lib/i18n/dictionaries/srv-applications'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const EDIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

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

const createSchema = z.object({
  applicationId: z.string().min(1),
  body: z
    .string()
    .min(1)
    .max(5000)
    .transform((v) => v.trim()),
  parentNoteId: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

const updateSchema = z.object({
  noteId: z.string().min(1),
  body: z
    .string()
    .min(1)
    .max(5000)
    .transform((v) => v.trim()),
})

function revalidateApplication(tenantSlug: string, applicationId: string) {
  try {
    revalidatePath(`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}`)
    revalidatePath('/dashboard/mentions')
  } catch {
    /* non-fatal */
  }
}

/**
 * Resolve mention usernames → tenant members. Only users who are a CURRENT
 * active member of the application's tenant are returned; unknown usernames
 * and non-members are silently dropped. Self-mentions ARE included (caller
 * decides whether to notify).
 */
async function resolveMentionedUsers(
  tx: Prisma.TransactionClient,
  tenantId: string,
  usernames: string[],
): Promise<Array<{ id: string; username: string; name: string | null }>> {
  if (usernames.length === 0) return []
  const users = await tx.user.findMany({
    where: {
      username: { in: usernames, mode: 'insensitive' },
      tenants: {
        some: { tenantId, status: 'active' },
      },
    },
    select: { id: true, username: true, name: true },
  })
  return users.map((u) => ({
    id: u.id,
    username: u.username ?? '',
    name: u.name,
  }))
}

/**
 * Create a note (or a reply) on an application.
 *
 * Permission: caller must have `job.view` on the application's tenant.
 * Mention notifications: for each resolved tenant-member mention we insert a
 * Notification row of type APPLICATION_UPDATE (closest semantic in current
 * enum; MENTION isn't part of NotificationType). Self-mentions create a
 * mention row but skip the Notification (no notify-yourself spam).
 */
export async function createNote(
  input:
    | FormData
    | { applicationId: string; body: string; parentNoteId?: string },
): Promise<ActionResult<{ noteId: string; mentionCount: number }>> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].noteActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const actorId = session.user.id
  const { globalRole, tenants: viewerTenants } = session.user

  // Normalize FormData → plain object.
  const raw =
    input instanceof FormData
      ? {
          applicationId: String(input.get('applicationId') ?? ''),
          body: String(input.get('body') ?? ''),
          parentNoteId: input.get('parentNoteId')
            ? String(input.get('parentNoteId'))
            : undefined,
        }
      : input

  const parsed = await localizedParse(createSchema, raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? m.inputInvalid,
      field: first?.path?.[0]?.toString(),
    }
  }
  const { applicationId, body, parentNoteId } = parsed.data

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true,
        tenant: { select: { slug: true, name: true } },
      },
    })
    if (!application) {
      return { ok: false, error: m.applicationNotFound }
    }
    if (
      !hasTenantPermission(
        globalRole,
        viewerTenants,
        application.tenantId,
        'job.view',
      )
    ) {
      return { ok: false, error: m.noAccess }
    }

    // If a parent is supplied, verify it belongs to the SAME application.
    // Prevents cross-app reply forgery.
    if (parentNoteId) {
      const parent = await prisma.applicationNote.findUnique({
        where: { id: parentNoteId },
        select: { id: true, applicationId: true, parentNoteId: true },
      })
      if (!parent || parent.applicationId !== applicationId) {
        return { ok: false, error: m.parentNoteInvalid }
      }
      // Disallow nested replies past depth 1 — keep threads flat for UX.
      if (parent.parentNoteId) {
        return {
          ok: false,
          error: m.noNestedReplies,
        }
      }
    }

    const usernames = parseMentions(body)
    const meta = getRequestMeta()

    const result = await prisma.$transaction(async (tx) => {
      const note = await tx.applicationNote.create({
        data: {
          applicationId,
          authorId: actorId,
          parentNoteId: parentNoteId ?? null,
          body,
        },
        select: { id: true },
      })

      const mentioned = await resolveMentionedUsers(
        tx,
        application.tenantId,
        usernames,
      )

      let mentionCount = 0
      for (const u of mentioned) {
        try {
          await tx.applicationNoteMention.create({
            data: {
              noteId: note.id,
              mentionedUserId: u.id,
              notifiedAt: null,
            },
          })
          mentionCount++
        } catch (err) {
          // P2002 = unique violation; ignore (dedup), bubble anything else.
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            continue
          }
          throw err
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId: application.tenantId,
          userId: actorId,
          action: AuditAction.CREATE,
          resource: 'application.note',
          resourceId: note.id,
          metadata: {
            noteId: note.id,
            applicationId,
            mentionCount,
            isReply: Boolean(parentNoteId),
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })

      return { noteId: note.id, mentioned, mentionCount }
    })

    // POST-TRANSACTION: send mention notifications. Outside the txn so
    // Notification failure cannot roll back the note itself. Skip self-mention.
    const authorName = session.user.name ?? session.user.email ?? 'Rekruter'
    const link = `/dashboard/tenants/${application.tenant.slug}/lamaran/${applicationId}#note-${result.noteId}`
    const bodyPreview =
      body.length > 200 ? body.slice(0, 200) + '...' : body
    for (const u of result.mentioned) {
      if (u.id === actorId) continue // never notify yourself
      try {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: NotificationType.APPLICATION_UPDATE,
            title: m.mentionNotifTitle.replace('{authorName}', authorName),
            body: bodyPreview,
            link,
          },
        })
      } catch (err) {
        console.error('[createNote] notify mention failed', err)
      }
    }

    revalidateApplication(application.tenant.slug, applicationId)
    return {
      ok: true,
      data: { noteId: result.noteId, mentionCount: result.mentionCount },
    }
  } catch (err) {
    console.error('[createNote] failed', err)
    return { ok: false, error: m.saveFailed }
  }
}

/**
 * Update a note's body. Author-only, within 15 minutes of creation.
 *
 * Re-parses mentions: adds NEW mentioned tenant members, removes mention
 * rows whose username is no longer referenced. Pre-existing mentions that
 * are still referenced keep their `notifiedAt` value (so already-read
 * mentions don't reappear as unread).
 */
export async function updateNote(
  noteId: string,
  body: string,
): Promise<ActionResult> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].noteActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const actorId = session.user.id

  const parsed = await localizedParse(updateSchema, { noteId, body })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? m.inputInvalid,
      field: first?.path?.[0]?.toString(),
    }
  }
  const { noteId: id, body: newBody } = parsed.data

  try {
    const note = await prisma.applicationNote.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        createdAt: true,
        applicationId: true,
        application: {
          select: { tenantId: true, tenant: { select: { slug: true } } },
        },
        mentions: {
          select: {
            id: true,
            mentionedUserId: true,
            mentionedUser: { select: { username: true } },
          },
        },
      },
    })
    if (!note) return { ok: false, error: m.noteNotFound }
    if (note.authorId !== actorId) {
      return { ok: false, error: m.notAuthor }
    }
    if (Date.now() - note.createdAt.getTime() > EDIT_WINDOW_MS) {
      return {
        ok: false,
        error: m.editWindowExpired,
      }
    }

    const newUsernames = new Set(parseMentions(newBody))
    const meta = getRequestMeta()

    await prisma.$transaction(async (tx) => {
      await tx.applicationNote.update({
        where: { id },
        data: { body: newBody },
      })

      // Remove mentions whose username is no longer present.
      const toRemove = note.mentions.filter((m) => {
        const u = m.mentionedUser?.username?.toLowerCase()
        return !u || !newUsernames.has(u)
      })
      if (toRemove.length > 0) {
        await tx.applicationNoteMention.deleteMany({
          where: { id: { in: toRemove.map((m) => m.id) } },
        })
      }

      // Add mentions for usernames not already present.
      const existingUsernames = new Set(
        note.mentions
          .map((m) => m.mentionedUser?.username?.toLowerCase())
          .filter((v): v is string => Boolean(v)),
      )
      const toAddUsernames = [...newUsernames].filter(
        (u) => !existingUsernames.has(u),
      )
      if (toAddUsernames.length > 0) {
        const newlyResolved = await resolveMentionedUsers(
          tx,
          note.application.tenantId,
          toAddUsernames,
        )
        for (const u of newlyResolved) {
          try {
            await tx.applicationNoteMention.create({
              data: {
                noteId: id,
                mentionedUserId: u.id,
                notifiedAt: null,
              },
            })
          } catch (err) {
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2002'
            ) {
              continue
            }
            throw err
          }
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId: note.application.tenantId,
          userId: actorId,
          action: AuditAction.UPDATE,
          resource: 'application.note',
          resourceId: id,
          metadata: {
            noteId: id,
            addedMentions: toAddUsernames.length,
            removedMentions: toRemove.length,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    })

    revalidateApplication(note.application.tenant.slug, note.applicationId)
    return { ok: true }
  } catch (err) {
    console.error('[updateNote] failed', err)
    return { ok: false, error: m.updateFailed }
  }
}

/**
 * Delete a note. Author OR tenant admin (`team.remove` perm) may delete.
 * Cascades to replies and mentions via the schema's onDelete: Cascade.
 */
export async function deleteNote(noteId: string): Promise<ActionResult> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].noteActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const actorId = session.user.id
  const { globalRole, tenants: viewerTenants } = session.user

  if (!noteId) return { ok: false, error: m.noteIdInvalid }

  try {
    const note = await prisma.applicationNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        authorId: true,
        applicationId: true,
        parentNoteId: true,
        application: {
          select: { tenantId: true, tenant: { select: { slug: true } } },
        },
      },
    })
    if (!note) return { ok: false, error: m.noteNotFound }

    const isAuthor = note.authorId === actorId
    const isTenantAdmin = hasTenantPermission(
      globalRole,
      viewerTenants,
      note.application.tenantId,
      'team.remove',
    )
    if (!isAuthor && !isTenantAdmin) {
      return { ok: false, error: m.notAllowedDelete }
    }

    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.applicationNote.delete({ where: { id: noteId } }),
      prisma.auditLog.create({
        data: {
          tenantId: note.application.tenantId,
          userId: actorId,
          action: AuditAction.DELETE,
          resource: 'application.note',
          resourceId: noteId,
          metadata: {
            noteId,
            applicationId: note.applicationId,
            isReply: Boolean(note.parentNoteId),
            byAdmin: !isAuthor && isTenantAdmin,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidateApplication(note.application.tenant.slug, note.applicationId)
    return { ok: true }
  } catch (err) {
    console.error('[deleteNote] failed', err)
    return { ok: false, error: m.deleteFailed }
  }
}

/**
 * Toggle a note's pinned flag. Requires `job.update` (recruiter scope) on the
 * application's tenant — pin is a team-visible action, not author-only.
 * Only top-level notes (parentNoteId=null) may be pinned; pinning a reply
 * doesn't make sense for the surfaced list.
 */
export async function togglePinNote(noteId: string): Promise<ActionResult> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].noteActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const actorId = session.user.id
  const { globalRole, tenants: viewerTenants } = session.user

  if (!noteId) return { ok: false, error: m.noteIdInvalid }

  try {
    const note = await prisma.applicationNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        pinned: true,
        applicationId: true,
        parentNoteId: true,
        application: {
          select: { tenantId: true, tenant: { select: { slug: true } } },
        },
      },
    })
    if (!note) return { ok: false, error: m.noteNotFound }
    if (note.parentNoteId) {
      return { ok: false, error: m.replyOnlyTopLevel }
    }
    if (
      !hasTenantPermission(
        globalRole,
        viewerTenants,
        note.application.tenantId,
        'job.update',
      )
    ) {
      return { ok: false, error: m.noAccess }
    }

    const meta = getRequestMeta()
    const nextPinned = !note.pinned

    await prisma.$transaction([
      prisma.applicationNote.update({
        where: { id: noteId },
        data: { pinned: nextPinned },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: note.application.tenantId,
          userId: actorId,
          action: AuditAction.UPDATE,
          resource: nextPinned ? 'application.note.pinned' : 'application.note.unpinned',
          resourceId: noteId,
          metadata: {
            noteId,
            applicationId: note.applicationId,
            pinned: nextPinned,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidateApplication(note.application.tenant.slug, note.applicationId)
    return { ok: true }
  } catch (err) {
    console.error('[togglePinNote] failed', err)
    return { ok: false, error: m.togglePinFailed }
  }
}

/**
 * Mark a single mention notification as read (sets notifiedAt = now).
 * Caller must be the mentioned user — no admin override.
 */
export async function markMentionAsRead(
  mentionId: string,
): Promise<ActionResult> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].noteActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  if (!mentionId) return { ok: false, error: m.mentionIdInvalid }

  try {
    const mention = await prisma.applicationNoteMention.findUnique({
      where: { id: mentionId },
      select: { id: true, mentionedUserId: true, notifiedAt: true },
    })
    if (!mention) return { ok: false, error: m.mentionNotFound }
    if (mention.mentionedUserId !== session.user.id) {
      return { ok: false, error: m.noAccess }
    }
    if (mention.notifiedAt) {
      // Already marked — no-op success.
      return { ok: true }
    }
    await prisma.applicationNoteMention.update({
      where: { id: mentionId },
      data: { notifiedAt: new Date() },
    })
    try {
      revalidatePath('/dashboard/mentions')
      revalidatePath('/dashboard')
    } catch {
      /* non-fatal */
    }
    return { ok: true }
  } catch (err) {
    console.error('[markMentionAsRead] failed', err)
    return { ok: false, error: m.markMentionFailed }
  }
}

/**
 * Bulk-mark every unread mention for the current user as read.
 */
export async function markAllMentionsAsRead(): Promise<ActionResult> {
  const locale = await getServerLocale()
  const m = srvApplications[locale].noteActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  try {
    await prisma.applicationNoteMention.updateMany({
      where: { mentionedUserId: session.user.id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    })
    try {
      revalidatePath('/dashboard/mentions')
      revalidatePath('/dashboard')
    } catch {
      /* non-fatal */
    }
    return { ok: true }
  } catch (err) {
    console.error('[markAllMentionsAsRead] failed', err)
    return { ok: false, error: m.markAllMentionsFailed }
  }
}
