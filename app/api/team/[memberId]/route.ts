/**
 * PATCH  /api/team/[memberId]  — Update a UserTenant role.
 * DELETE /api/team/[memberId]  — Remove a member from the current tenant.
 *
 * `memberId` is the UserTenant.id (membership row id), NOT the user id.
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'

const updateSchema = z
  .object({
    role: z.enum(['OWNER', 'ADMIN', 'RECRUITER', 'MEMBER']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .strict()

type Ctx = { params: { memberId: string } }

async function loadTenantAndMembership(req: NextRequest, memberId: string) {
  const slug = getTenantSlugFromHeaders(req)
  if (!slug) return { error: apiError('TENANT_REQUIRED', 'Tenant context is required.', 400) }
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, ownerUserId: true } })
  if (!tenant) return { error: apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404) }

  const membership = await prisma.userTenant.findUnique({
    where: { id: memberId },
    select: { id: true, userId: true, tenantId: true, role: true },
  })
  if (!membership || membership.tenantId !== tenant.id) {
    return { error: apiError('NOT_FOUND', 'Member not found in this tenant.', 404) }
  }
  return { tenant, membership }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const loaded = await loadTenantAndMembership(req, params.memberId)
    if ('error' in loaded) return loaded.error

    const { tenant, membership } = loaded
    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
      return apiError('FORBIDDEN', 'You do not have permission to update members.', 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid update payload.', 400, parsed.error.issues)
    }

    // Only the tenant OWNER (or SUPERADMIN) may promote another member to OWNER.
    if (parsed.data.role === 'OWNER') {
      const isOwner = membership.userId !== userId && tenant.ownerUserId === userId
      if (globalRole !== 'SUPERADMIN' && !isOwner) {
        return apiError('FORBIDDEN', 'Only the tenant OWNER may grant OWNER role.', 403)
      }
    }

    const updated = await prisma.userTenant.update({
      where: { id: membership.id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId,
        action: 'PERMISSION_CHANGE',
        resource: 'team.member',
        resourceId: membership.id,
        metadata: { changed: Object.keys(parsed.data) },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const loaded = await loadTenantAndMembership(req, params.memberId)
    if ('error' in loaded) return loaded.error

    const { tenant, membership } = loaded
    const { globalRole, tenants, id: userId } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.remove')) {
      return apiError('FORBIDDEN', 'You do not have permission to remove members.', 403)
    }
    if (tenant.ownerUserId === membership.userId) {
      return apiError('FORBIDDEN', 'Cannot remove the tenant OWNER.', 400)
    }

    await prisma.userTenant.delete({ where: { id: membership.id } })

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId,
        action: 'REVOKE',
        resource: 'team.member',
        resourceId: membership.id,
      },
    })

    return apiSuccess({ id: membership.id, removed: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
