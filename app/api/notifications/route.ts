/**
 * GET   /api/notifications  — Current user's notifications.
 * PATCH /api/notifications  — Mark notifications as read.
 *
 * PATCH accepts `{ ids: string[] }` to mark a specific set, or
 * `{ all: true }` to mark all unread as read.
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  apiError,
  apiSuccess,
  handleRouteError,
  paginated,
  parsePagination,
} from '@/lib/api-helpers'

const markReadSchema = z
  .object({
    ids: z.array(z.string().cuid()).max(200).optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.all) || (Array.isArray(v.ids) && v.ids.length > 0), {
    message: 'Provide either `all: true` or a non-empty `ids` array.',
  })

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const sp = req.nextUrl.searchParams
    const onlyUnread = sp.get('unread') === '1' || sp.get('unread') === 'true'
    const pagination = parsePagination(sp, 25, 100)

    const where = {
      userId: session.user.id,
      ...(onlyUnread ? { isRead: false } : {}),
    }

    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    ])

    return apiSuccess({ ...paginated(items, total, pagination), unreadCount: unread })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const body = await req.json().catch(() => null)
    const parsed = markReadSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid payload.', 400, parsed.error.issues)
    }

    if (parsed.data.all) {
      const res = await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      })
      return apiSuccess({ updated: res.count })
    }

    const res = await prisma.notification.updateMany({
      where: { userId: session.user.id, id: { in: parsed.data.ids! } },
      data: { isRead: true },
    })

    return apiSuccess({ updated: res.count })
  } catch (err) {
    return handleRouteError(err)
  }
}
