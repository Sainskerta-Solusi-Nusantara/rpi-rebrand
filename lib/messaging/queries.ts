import { cache } from 'react'
import { prisma } from '@/lib/db'

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

export type ThreadWithMessages = {
  id: string
  applicationId: string
  lastMessageAt: Date | null
  createdAt: Date
  messages: MessageRow[]
}

/**
 * Fetch the message thread for an application, including all messages with
 * sender info. Returns null if no thread exists yet (no messages sent).
 *
 * IMPORTANT: This does NOT enforce authorization — callers are expected to
 * have already verified the viewer's relationship to the application (via
 * the page-level auth + ownership/tenant-permission checks). The viewerId
 * parameter is passed for future use (e.g. per-message visibility) but is
 * currently informational only.
 */
export const getThreadForApplication = cache(
  async (
    applicationId: string,
    _viewerId: string,
  ): Promise<ThreadWithMessages | null> => {
    if (!applicationId) return null
    try {
      const thread = await prisma.messageThread.findUnique({
        where: { applicationId },
        select: {
          id: true,
          applicationId: true,
          lastMessageAt: true,
          createdAt: true,
          messages: {
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
          },
        },
      })
      return thread
    } catch {
      return null
    }
  },
)

/**
 * Count messages the user hasn't read yet, scoped to their role.
 *
 * Candidate scope:
 *   Messages in threads of applications they own where readByCandidateAt is
 *   null AND senderId !== userId (don't count own messages).
 *
 * Recruiter scope (complexity note):
 *   A user can be a recruiter on multiple tenants. We must scope to messages
 *   in threads on applications that belong to a tenant where the user holds
 *   OWNER/ADMIN/RECRUITER membership. The DB query joins:
 *     messages → thread → application → tenant
 *   filtering application.tenantId IN (user's recruiter-tenant ids) AND
 *   readByRecruiterAt is null AND senderId !== userId.
 *
 *   This count is naturally fan-out: every recruiter on the tenant sees the
 *   same unread badge until anyone (or the candidate via thread visit) reads
 *   it. We accept that — recruiter-side unread is a team queue indicator,
 *   not a per-user inbox. SUPERADMIN/global ADMIN are NOT counted here
 *   because they aren't UserTenant members and would otherwise see every
 *   thread platform-wide.
 */
export const countUnreadMessages = cache(
  async (
    userId: string,
    role: 'candidate' | 'recruiter',
  ): Promise<number> => {
    if (!userId) return 0
    try {
      if (role === 'candidate') {
        return await prisma.message.count({
          where: {
            readByCandidateAt: null,
            senderId: { not: userId },
            thread: {
              application: { userId },
            },
          },
        })
      }

      // Recruiter side — find tenants where user holds job.update via
      // UserTenant role membership.
      const memberships = await prisma.userTenant.findMany({
        where: {
          userId,
          role: { in: ['OWNER', 'ADMIN', 'RECRUITER'] },
          status: 'active',
        },
        select: { tenantId: true },
      })
      if (memberships.length === 0) return 0

      return await prisma.message.count({
        where: {
          readByRecruiterAt: null,
          senderId: { not: userId },
          thread: {
            application: {
              tenantId: { in: memberships.map((m) => m.tenantId) },
            },
          },
        },
      })
    } catch {
      return 0
    }
  },
)

/**
 * Returns true if a thread exists for the given application id. Cheap
 * existence-check used by listing pages to decide whether to show a "Pesan"
 * link.
 */
export const threadExistsForApplication = cache(
  async (applicationId: string): Promise<boolean> => {
    if (!applicationId) return false
    try {
      const t = await prisma.messageThread.findUnique({
        where: { applicationId },
        select: { id: true },
      })
      return Boolean(t)
    } catch {
      return false
    }
  },
)

/**
 * Returns the set of application ids (from the provided list) that already
 * have a message thread. Batched single query for use in listing pages.
 */
export async function applicationsWithThread(
  applicationIds: string[],
): Promise<Set<string>> {
  if (applicationIds.length === 0) return new Set()
  try {
    const rows = await prisma.messageThread.findMany({
      where: { applicationId: { in: applicationIds } },
      select: { applicationId: true },
    })
    return new Set(rows.map((r) => r.applicationId))
  } catch {
    return new Set()
  }
}
