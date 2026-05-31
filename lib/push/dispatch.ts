/**
 * Internal helper for dispatching Web Push to a user across all their devices.
 *
 * Integration guidance (NOT wired in this feature to avoid conflicts):
 *   - lib/messaging/actions.ts — after creating a Notification on inbound DM,
 *     call: dispatchPushToUser(recipientId, { title: 'Pesan baru', body: ..., url: '/dashboard/pesan/<threadId>' })
 *   - lib/applications/actions.ts — when application status changes, push to the
 *     applicant with the new status and a link to /dashboard/lamaran/<id>
 *   - lib/tenants/interview-actions.ts — when an interview is scheduled, push
 *     to the candidate with the schedule and url to /dashboard/lamaran/<id>
 *
 * Use dynamic import in those call sites to avoid coupling:
 *     const { dispatchPushToUser } = await import('@/lib/push/dispatch')
 *     dispatchPushToUser(userId, { title, body, url }).catch(() => {})
 *
 * This module is fire-and-forget: it never throws and never blocks the caller.
 */

import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'
import { sendWebPush, type WebPushPayload } from './web-push-client'

type Keys = { p256dh: string; auth: string }

function parseKeys(raw: unknown): Keys | null {
  if (!raw || typeof raw !== 'object') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any
  const p256dh = typeof r.p256dh === 'string' ? r.p256dh : null
  const auth = typeof r.auth === 'string' ? r.auth : null
  if (!p256dh || !auth) return null
  return { p256dh, auth }
}

/**
 * Dispatch a push notification to all of `userId`'s subscriptions.
 * Removes subscriptions returning 404/410. Logs successes via auditLog
 * `push.notification.sent`. Never throws.
 */
export async function dispatchPushToUser(
  userId: string,
  payload: WebPushPayload,
): Promise<{ sent: number; pruned: number; failed: number }> {
  try {
    if (!userId) return { sent: 0, pruned: 0, failed: 0 }

    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, keys: true },
    })
    if (subs.length === 0) return { sent: 0, pruned: 0, failed: 0 }

    let sent = 0
    let pruned = 0
    let failed = 0
    const toDelete: string[] = []

    await Promise.all(
      subs.map(async (s) => {
        const keys = parseKeys(s.keys)
        if (!keys) {
          toDelete.push(s.id)
          return
        }
        const res = await sendWebPush({
          subscription: { endpoint: s.endpoint, keys },
          payload,
        })
        if (res.ok) {
          sent++
        } else if (res.gone) {
          toDelete.push(s.id)
        } else {
          failed++
        }
      }),
    )

    if (toDelete.length > 0) {
      try {
        const result = await prisma.pushSubscription.deleteMany({
          where: { id: { in: toDelete } },
        })
        pruned = result.count
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[push.dispatch] prune failed', err)
      }
    }

    if (sent > 0) {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: AuditAction.UPDATE,
            resource: 'push.notification.sent',
            resourceId: userId,
            metadata: {
              sent,
              pruned,
              failed,
              title: payload.title?.slice(0, 200) ?? null,
              url: payload.url ?? null,
            },
          },
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[push.dispatch] audit failed', err)
      }
    }

    return { sent, pruned, failed }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push.dispatch] failed', err)
    return { sent: 0, pruned: 0, failed: 0 }
  }
}
