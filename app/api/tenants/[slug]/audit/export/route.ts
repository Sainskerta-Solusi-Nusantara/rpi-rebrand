import { NextResponse, type NextRequest } from 'next/server'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { verifyTenantBearerToken, hasScope } from '@/lib/tenants/api-key'
import { exportTenantAudit, type TenantAuditFilters } from '@/lib/tenants/audit-queries'
import { toCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const ACTIONS = new Set<AuditAction>([
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'INVITE',
  'REVOKE',
  'PERMISSION_CHANGE',
])

function parseDate(v: string | null, endOfDay = false): Date | undefined {
  if (!v) return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    d.setHours(23, 59, 59, 999)
  }
  return d
}

/**
 * GET /api/tenants/:slug/audit/export
 * Accepts a session cookie (user must have audit.view in that tenant) OR a
 * Tenant API Key with `read` scope (scoped to its tenant — must match :slug).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const tenant = await prisma.tenant
    .findUnique({ where: { slug: params.slug }, select: { id: true, slug: true } })
    .catch(() => null)
  if (!tenant) {
    return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 })
  }

  const authHeader = req.headers.get('authorization')
  let authorized = false

  if (authHeader) {
    const verified = await verifyTenantBearerToken(authHeader, {
      ip:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        null,
    })
    if (!verified) {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 })
    }
    if (verified.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'TENANT_MISMATCH' }, { status: 403 })
    }
    if (!hasScope(verified, 'read')) {
      return NextResponse.json({ error: 'INSUFFICIENT_SCOPE' }, { status: 403 })
    }
    authorized = true
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const { globalRole, tenants } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'audit.view')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    authorized = true
  }
  if (!authorized) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const actionRaw = sp.get('action')
  const action =
    actionRaw && ACTIONS.has(actionRaw as AuditAction) ? (actionRaw as AuditAction) : undefined
  const resource = sp.get('resource')?.trim() || undefined
  const actorEmail = sp.get('actor')?.trim() || undefined
  const from = parseDate(sp.get('from'))
  const to = parseDate(sp.get('to'), true)

  const filters: TenantAuditFilters = { action, resource, actorEmail, from, to }
  const rows = await exportTenantAudit(tenant.id, filters, 10000)

  const headers = [
    'id',
    'createdAt',
    'action',
    'resource',
    'resourceId',
    'actorEmail',
    'actorName',
    'ip',
    'userAgent',
    'metadata',
  ]
  const data = rows.map((r) => [
    r.id,
    r.createdAt,
    r.action,
    r.resource,
    r.resourceId ?? '',
    r.actor?.email ?? '',
    r.actor?.name ?? '',
    r.ip ?? '',
    r.userAgent ?? '',
    r.metadata ? JSON.stringify(r.metadata) : '',
  ])

  const csv = toCsv(headers, data)
  const dateTag = new Date().toISOString().slice(0, 10)
  const filename = `rpi-tenant-${tenant.slug}-audit-${dateTag}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
