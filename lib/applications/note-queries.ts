import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, canAccessTenant } from '@/lib/auth/rbac'

export type NoteAuthor = {
  id: string
  name: string | null
  email: string
  image: string | null
  username: string | null
}

export type NoteMention = {
  id: string
  notifiedAt: Date | null
  mentionedUser: {
    id: string
    name: string | null
    email: string
    username: string | null
  }
}

export type NoteRow = {
  id: string
  applicationId: string
  authorId: string
  parentNoteId: string | null
  body: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
  author: NoteAuthor
  mentions: NoteMention[]
  replies: NoteRow[]
}

/**
 * Top-level notes for an application, hierarchical (replies nested under
 * their parent). Internal-only — caller must have `application.view` or
 * `job.view` on the application's tenant. Returns [] when access is denied
 * or the application doesn't exist; logs at console.error for diagnostics.
 *
 * Ordering: pinned-first, then newest-first. Replies always chronological
 * (oldest-first) since threads read naturally top-down.
 *
 * Cached per-render via `react.cache` — the same tuple of args within one
 * Server Component render returns the same Promise.
 */
export const getNotesForApplication = cache(
  async (applicationId: string): Promise<NoteRow[]> => {
    if (!applicationId) return []

    const session = await auth()
    if (!session?.user?.id) return []
    const { globalRole, tenants } = session.user

    // Verify the application exists and the viewer has access to its tenant.
    const application = await prisma.application
      .findUnique({
        where: { id: applicationId },
        select: { id: true, tenantId: true },
      })
      .catch(() => null)
    if (!application) return []

    if (
      !canAccessTenant(globalRole, tenants, application.tenantId) ||
      !hasTenantPermission(globalRole, tenants, application.tenantId, 'job.view')
    ) {
      return []
    }

    try {
      // Single round-trip: fetch ALL notes for the application + relations,
      // then assemble the tree in memory. Avoids N+1 on replies/mentions.
      const rows = await prisma.applicationNote.findMany({
        where: { applicationId },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          applicationId: true,
          authorId: true,
          parentNoteId: true,
          body: true,
          pinned: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
          mentions: {
            select: {
              id: true,
              notifiedAt: true,
              mentionedUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
      })

      // Build tree: replies attach to their parent. Orphan replies (parent
      // missing) are silently dropped because the schema cascades on delete.
      const byId = new Map<string, NoteRow>()
      for (const r of rows) {
        byId.set(r.id, { ...r, replies: [] })
      }
      const roots: NoteRow[] = []
      for (const r of rows) {
        const node = byId.get(r.id)!
        if (r.parentNoteId) {
          const parent = byId.get(r.parentNoteId)
          if (parent) {
            parent.replies.push(node)
          }
          // else: orphan reply — drop silently.
        } else {
          roots.push(node)
        }
      }
      // Reply chronological order — flip child arrays to oldest-first for
      // natural reading.
      for (const node of byId.values()) {
        node.replies.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        )
      }
      return roots
    } catch (err) {
      console.error('[getNotesForApplication] failed', err)
      return []
    }
  },
)

/**
 * Unread mention count for a user — drives the nav badge.
 * Capped at 99 for display; returns 0 on any failure to avoid blocking UI.
 */
export const countUnreadMentionsForUser = cache(
  async (userId: string): Promise<number> => {
    if (!userId) return 0
    try {
      const n = await prisma.applicationNoteMention.count({
        where: { mentionedUserId: userId, notifiedAt: null },
      })
      return Math.min(99, Math.max(0, n))
    } catch {
      return 0
    }
  },
)

export type RecentMentionRow = {
  id: string
  notifiedAt: Date | null
  createdAt: Date
  note: {
    id: string
    body: string
    applicationId: string
    author: { id: string; name: string | null; email: string }
    application: {
      id: string
      tenantId: string
      tenant: { slug: string; name: string }
      job: { id: string; title: string }
      user: { id: string; name: string | null; email: string }
    }
  }
}

/**
 * Recent mentions for a user across all tenants they can still access.
 *
 * Tenant access check is enforced AT QUERY time — we filter by the user's
 * UserTenant memberships, so a mention created while the user was a member
 * but then revoked won't leak. SUPERADMIN/ADMIN bypass via the early-return
 * branch (they see everything).
 */
export async function getRecentMentionsForUser(
  userId: string,
  limit = 20,
): Promise<RecentMentionRow[]> {
  if (!userId) return []
  const take = Math.max(1, Math.min(100, limit))

  try {
    const session = await auth()
    const globalRole = session?.user?.globalRole

    // Determine the tenant set the user can read. For most users this is
    // their active UserTenant memberships. For SUPER/ADMIN we don't filter
    // by tenant (they see everything).
    const allowAll = globalRole === 'SUPERADMIN' || globalRole === 'ADMIN'

    let tenantIds: string[] | null = null
    if (!allowAll) {
      const memberships = await prisma.userTenant.findMany({
        where: { userId, status: 'active' },
        select: { tenantId: true },
      })
      tenantIds = memberships.map((m) => m.tenantId)
      if (tenantIds.length === 0) return []
    }

    const rows = await prisma.applicationNoteMention.findMany({
      where: {
        mentionedUserId: userId,
        ...(tenantIds
          ? { note: { application: { tenantId: { in: tenantIds } } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        notifiedAt: true,
        createdAt: true,
        note: {
          select: {
            id: true,
            body: true,
            applicationId: true,
            author: { select: { id: true, name: true, email: true } },
            application: {
              select: {
                id: true,
                tenantId: true,
                tenant: { select: { slug: true, name: true } },
                job: { select: { id: true, title: true } },
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    })

    return rows
  } catch (err) {
    console.error('[getRecentMentionsForUser] failed', err)
    return []
  }
}
