/**
 * GET   /api/users/me  — Current user's profile (with tenant memberships).
 * PATCH /api/users/me  — Update profile fields (name, headline, bio, etc.).
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

const profileUpdateSchema = z
  .object({
    name: z.string().min(1).max(120),
    image: z.string().url().nullable(),
    phone: z.string().max(40).nullable(),
    bio: z.string().max(4000).nullable(),
    headline: z.string().max(200).nullable(),
    location: z.string().max(200).nullable(),
  })
  .partial()
  .strict()

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
            tenant: { select: { id: true, slug: true, name: true, planTier: true } },
          },
        },
      },
    })
    if (!user) return apiError('NOT_FOUND', 'User not found.', 404)

    // Compute simple completeness score for profile widgets.
    const fields = [user.name, user.image, user.phone, user.bio, user.headline, user.location]
    const filled = fields.filter((v) => v && String(v).trim().length > 0).length
    const completeness = Math.round((filled / fields.length) * 100)

    return apiSuccess({ ...user, completeness })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const body = await req.json().catch(() => null)
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid profile payload.', 400, parsed.error.issues)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        bio: true,
        headline: true,
        location: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'user.profile',
        resourceId: session.user.id,
        metadata: { changed: Object.keys(parsed.data) },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}
