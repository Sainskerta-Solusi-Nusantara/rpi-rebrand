/**
 * GET   /api/users/[id]  — Read user details (admin).
 * PATCH /api/users/[id]  — Update role / status (admin).
 *
 * Reserved for SUPERADMIN/ADMIN. SUPERADMIN may change globalRole to any
 * value; ADMIN may only toggle status (cannot escalate roles).
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

const adminUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).nullable().optional(),
    globalRole: z.enum(['SUPERADMIN', 'ADMIN', 'PARTNER', 'USER']).optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED']).optional(),
  })
  .strict()

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)
    if (!['SUPERADMIN', 'ADMIN'].includes(session.user.globalRole)) {
      return apiError('FORBIDDEN', 'Insufficient role.', 403)
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        bio: true,
        headline: true,
        location: true,
        globalRole: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        tenants: {
          select: {
            tenantId: true,
            role: true,
            joinedAt: true,
            tenant: { select: { id: true, slug: true, name: true } },
          },
        },
      },
    })
    if (!user) return apiError('NOT_FOUND', 'User not found.', 404)

    return apiSuccess(user)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)
    if (!['SUPERADMIN', 'ADMIN'].includes(session.user.globalRole)) {
      return apiError('FORBIDDEN', 'Insufficient role.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = adminUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid update payload.', 400, parsed.error.issues)
    }

    const isAdmin = session.user.globalRole === 'ADMIN'
    if (isAdmin && parsed.data.globalRole) {
      return apiError('FORBIDDEN', 'Only SUPERADMIN may modify globalRole.', 403)
    }

    // Prevent users from suspending themselves through this endpoint.
    if (parsed.data.status && params.id === session.user.id && parsed.data.status !== 'ACTIVE') {
      return apiError('SELF_LOCKOUT', 'You cannot suspend or delete your own account here.', 400)
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        globalRole: true,
        status: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: parsed.data.globalRole ? 'PERMISSION_CHANGE' : 'UPDATE',
        resource: 'user',
        resourceId: params.id,
        metadata: { changed: Object.keys(parsed.data) },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}
