'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult = { ok: true } | { ok: false; error: string }

const FEED_PATH = '/dashboard/notifikasi/feed'
const DASHBOARD_PATH = '/dashboard'

function revalidateFeed() {
  try {
    revalidatePath(DASHBOARD_PATH)
    revalidatePath(FEED_PATH)
  } catch {
    /* revalidatePath can throw in odd contexts; non-fatal */
  }
}

/**
 * Mark a single notification as read. Verifies ownership.
 */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth4.notifications.mustSignIn }
  if (!id || typeof id !== 'string') return { ok: false, error: t.srvAuth4.notifications.invalidId }

  try {
    const existing = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true, isRead: true },
    })
    if (!existing) return { ok: false, error: t.srvAuth4.notifications.notFound }
    if (existing.userId !== session.user.id) {
      return { ok: false, error: t.srvAuth4.notifications.noAccess }
    }
    if (!existing.isRead) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      })
    }
    revalidateFeed()
    return { ok: true }
  } catch (err) {
    console.error('[markNotificationRead] failed', err)
    return { ok: false, error: t.srvAuth4.notifications.updateError }
  }
}

/**
 * Mark every unread notification for the current user as read.
 */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth4.notifications.mustSignIn }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    })
    revalidateFeed()
    return { ok: true }
  } catch (err) {
    console.error('[markAllNotificationsRead] failed', err)
    return { ok: false, error: t.srvAuth4.notifications.markAllError }
  }
}

/**
 * Delete a single notification. Verifies ownership.
 */
export async function deleteNotification(id: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth4.notifications.mustSignIn }
  if (!id || typeof id !== 'string') return { ok: false, error: t.srvAuth4.notifications.invalidId }

  try {
    const existing = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) return { ok: false, error: t.srvAuth4.notifications.notFound }
    if (existing.userId !== session.user.id) {
      return { ok: false, error: t.srvAuth4.notifications.noAccess }
    }
    await prisma.notification.delete({ where: { id } })
    revalidateFeed()
    return { ok: true }
  } catch (err) {
    console.error('[deleteNotification] failed', err)
    return { ok: false, error: t.srvAuth4.notifications.deleteError }
  }
}
