'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { sendWebPush } from './web-push-client'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult = { ok: true } | { ok: false; error: string }
export type TestPushResult =
  | { ok: true; sent: number; pruned: number; failed: number; total: number }
  | { ok: false; error: string }

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

const keysSchema = z.object({
  p256dh: z.string().min(8, 'Kunci p256dh tidak valid'),
  auth: z.string().min(4, 'Kunci auth tidak valid'),
})

const subscribeSchema = z.object({
  endpoint: z.string().url('Endpoint push tidak valid').max(2048),
  keys: keysSchema,
  userAgent: z.string().max(500).optional(),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Endpoint push tidak valid').max(2048),
})

/**
 * Upsert a Web Push subscription for the current user. Idempotent on endpoint.
 */
export async function subscribeToPush(input: {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth4.push.mustSignIn }

  const parsed = subscribeSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? t.srvAuth4.push.invalidData
    return { ok: false, error: msg }
  }
  const { endpoint, keys, userAgent } = parsed.data
  const meta = getRequestMeta()
  const ua = (userAgent ?? meta.userAgent ?? '').slice(0, 500) || null

  try {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true, userId: true },
    })

    if (existing && existing.userId !== session.user.id) {
      // Endpoint reused on a different account — reassign.
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.user.id,
          keys,
          userAgent: ua,
          lastSeenAt: new Date(),
        },
      })
    } else {
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: {
          userId: session.user.id,
          endpoint,
          keys,
          userAgent: ua,
        },
        update: {
          keys,
          userAgent: ua,
          lastSeenAt: new Date(),
        },
      })
    }

    const row = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true },
    })

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.CREATE,
          resource: 'push.subscription',
          resourceId: row?.id ?? null,
          metadata: { endpoint: endpoint.slice(0, 300), userAgent: ua },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[subscribeToPush] audit failed', err)
    }

    return { ok: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[subscribeToPush] failed', err)
    return { ok: false, error: t.srvAuth4.push.subscribeError }
  }
}

/**
 * Delete the current user's subscription matching `endpoint`. Verifies ownership.
 */
export async function unsubscribeFromPush(input: {
  endpoint: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth4.push.mustSignIn }

  const parsed = unsubscribeSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? t.srvAuth4.push.invalidData
    return { ok: false, error: msg }
  }
  const { endpoint } = parsed.data
  const meta = getRequestMeta()

  try {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true, userId: true },
    })
    if (!existing) return { ok: true }
    if (existing.userId !== session.user.id) {
      return { ok: false, error: t.srvAuth4.push.notYours }
    }

    await prisma.pushSubscription.delete({ where: { id: existing.id } })

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.DELETE,
          resource: 'push.subscription',
          resourceId: existing.id,
          metadata: { endpoint: endpoint.slice(0, 300) },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[unsubscribeFromPush] audit failed', err)
    }

    return { ok: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[unsubscribeFromPush] failed', err)
    return { ok: false, error: t.srvAuth4.push.unsubscribeError }
  }
}

/**
 * Send a test notification to every active push subscription of the current user.
 * Returns a summary. Prunes any endpoints that come back 404/410.
 */
export async function sendTestPush(): Promise<TestPushResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth4.push.mustSignIn }

  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: { id: true, endpoint: true, keys: true },
    })
    if (subs.length === 0) {
      return { ok: false, error: t.srvAuth4.push.noActiveSubs }
    }

    const payload = {
      title: t.srvAuth4.push.testTitle,
      body: t.srvAuth4.push.testBody,
      url: '/dashboard/notifikasi',
      tag: 'rpi-test',
    }

    let sent = 0
    let failed = 0
    const toDelete: string[] = []

    await Promise.all(
      subs.map(async (s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = s.keys as any
        const p256dh = typeof raw?.p256dh === 'string' ? raw.p256dh : null
        const authKey = typeof raw?.auth === 'string' ? raw.auth : null
        if (!p256dh || !authKey) {
          toDelete.push(s.id)
          return
        }
        const res = await sendWebPush({
          subscription: { endpoint: s.endpoint, keys: { p256dh, auth: authKey } },
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

    let pruned = 0
    if (toDelete.length > 0) {
      try {
        const r = await prisma.pushSubscription.deleteMany({
          where: { id: { in: toDelete } },
        })
        pruned = r.count
      } catch {
        /* non-fatal */
      }
    }

    if (sent > 0) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: AuditAction.UPDATE,
            resource: 'push.notification.sent',
            resourceId: session.user.id,
            metadata: { sent, pruned, failed, kind: 'test' },
          },
        })
      } catch {
        /* non-fatal */
      }
    }

    return { ok: true, sent, pruned, failed, total: subs.length }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[sendTestPush] failed', err)
    return { ok: false, error: t.srvAuth4.push.sendTestError }
  }
}
