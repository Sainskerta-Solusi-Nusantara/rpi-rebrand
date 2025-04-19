/**
 * GET /api/admin/audit
 *
 * Paginated audit log feed. SUPERADMIN sees all tenants; ADMIN sees all.
 * PARTNER may scope to their tenant via x-tenant-slug — but is restricted
 * to that tenant only.
 */

import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
  paginated,
  parsePagination,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const sp = req.nextUrl.searchParams
    const resource = sp.get('resource')?.trim() ?? ''
    const action = sp.get('action')?.trim().toUpperCase() ?? ''
    const userIdFilter = sp.get('userId')?.trim() ?? ''
    const pagination = parsePagination(sp, 50, 200)

    const where: Prisma.AuditLogWhereInput = {}
    if (resource) where.resource = resource
    if (
      ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'INVITE', 'REVOKE', 'PERMISSION_CHANGE'].includes(
        action,
      )
    ) {
      where.action = action as Prisma.AuditLogWhereInput['action']
    }
    if (userIdFilter) where.userId = userIdFilter

    const role = session.user.globalRole

    // Tenant scoping: non-admins must be scoped to a tenant they belong to
    // with audit.view permission.
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      const slug = getTenantSlugFromHeaders(req)
      if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)
      const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
      if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)
      if (!canAccessTenant(role, session.user.tenants, tenant.id)) {
        return apiError('FORBIDDEN', 'You do not have access to this tenant.', 403)
      }
      if (!hasTenantPermission(role, session.user.tenants, tenant.id, 'audit.view')) {
        return apiError('FORBIDDEN', 'You do not have permission to view audit logs.', 403)
      }
      where.tenantId = tenant.id
    } else {
      // Admin/SuperAdmin may still optionally scope to a tenant via header.
      const slug = getTenantSlugFromHeaders(req)
      if (slug) {
        const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
        if (tenant) where.tenantId = tenant.id
      }
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          tenant: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return apiSuccess(paginated(items, total, pagination))
  } catch (err) {
    return handleRouteError(err)
  }
}
