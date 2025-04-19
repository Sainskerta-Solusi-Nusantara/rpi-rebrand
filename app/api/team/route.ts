/**
 * GET  /api/team   — List members of the current tenant.
 * POST /api/team   — Create an invitation to join the current tenant.
 *
 * Tenant scope is derived from `x-tenant-slug` (middleware injected).
 */

import { randomBytes } from 'node:crypto'
import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'

const inviteSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(['ADMIN', 'RECRUITER', 'MEMBER']),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const slug = getTenantSlugFromHeaders(req)
    if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)

    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)

    const { globalRole, tenants } = session.user
    if (!canAccessTenant(globalRole, tenants, tenant.id)) {
      return apiError('FORBIDDEN', 'You do not have access to this tenant.', 403)
    }
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.view')) {
      return apiError('FORBIDDEN', 'You do not have permission to view the team.', 403)
    }

    const [members, invitations] = await Promise.all([
      prisma.userTenant.findMany({
        where: { tenantId: tenant.id },
        orderBy: { joinedAt: 'asc' },
        select: {
          id: true,
          role: true,
          status: true,
          joinedAt: true,
          user: { select: { id: true, email: true, name: true, image: true, status: true } },
        },
      }),
      prisma.invitation.findMany({
        where: { tenantId: tenant.id, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      }),
    ])

    return apiSuccess({ members, invitations })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const slug = getTenantSlugFromHeaders(req)
    if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)

    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true } })
    if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)

    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')) {
      return apiError('FORBIDDEN', 'You do not have permission to invite members.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid invitation payload.', 400, parsed.error.issues)
    }

    const token = randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        tenantId: tenant.id,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        token,
        expiresAt,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId,
        action: 'INVITE',
        resource: 'invitation',
        resourceId: invitation.id,
        metadata: { email: invitation.email, role: invitation.role },
      },
    })

    // Token is intentionally returned to the caller so the UI can render a
    // shareable link. Email sending is handled by a separate worker.
    return apiSuccess(invitation, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
