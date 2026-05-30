import { cache } from 'react'
import type { NotificationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type NotificationRow = {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  isRead: boolean
  createdAt: Date
}

const RECENT_LIMIT_MAX = 50
const PAGE_SIZE_MAX = 100

/**
 * Returns the unread count for the user, capped at 99 for display purposes.
 * If the DB call fails we surface 0 rather than throwing.
 */
export const getUnreadNotificationCount = cache(
  async (userId: string): Promise<number> => {
    if (!userId) return 0
    try {
      const n = await prisma.notification.count({
        where: { userId, isRead: false },
      })
      return Math.min(99, Math.max(0, n))
    } catch {
      return 0
    }
  },
)

/**
 * Most recent notifications (read + unread) for the dropdown panel.
 * Ordered by createdAt desc, limited.
 */
export const getRecentNotifications = cache(
  async (userId: string, limit = 10): Promise<NotificationRow[]> => {
    if (!userId) return []
    try {
      const rows = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(RECENT_LIMIT_MAX, limit)),
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          body: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      })
      return rows
    } catch {
      return []
    }
  },
)

export type ListNotificationsOpts = {
  page: number
  pageSize: number
  filter?: 'unread' | 'all'
}

/**
 * Paginated listing for the full feed page. Returns items + total + unreadTotal.
 */
export async function listNotifications(
  userId: string,
  opts: ListNotificationsOpts,
): Promise<{ items: NotificationRow[]; total: number; unreadTotal: number }> {
  if (!userId) return { items: [], total: 0, unreadTotal: 0 }

  const pageSize = Math.max(1, Math.min(PAGE_SIZE_MAX, opts.pageSize))
  const page = Math.max(1, opts.page)
  const where: Prisma.NotificationWhereInput = { userId }
  if (opts.filter === 'unread') where.isRead = false

  try {
    const [rows, total, unreadTotal] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          body: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])
    return { items: rows, total, unreadTotal }
  } catch {
    return { items: [], total: 0, unreadTotal: 0 }
  }
}
