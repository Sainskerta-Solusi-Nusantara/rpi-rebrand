import { NextResponse, type NextRequest } from 'next/server'
import { AuditAction } from '@prisma/client'
import { auth } from '@/lib/auth/session'
import { verifyBearerToken, hasScope } from '@/lib/auth/api-token'
import { exportActivity, type ActivityFilters } from '@/lib/auth/activity-queries'
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
 * GET /api/me/activity/export
 * Accepts a session cookie OR a Bearer Personal Access Token (`read` scope).
 * Streams a CSV of audit entries that the current user originated, applying
 * the same filters as the /dashboard/aktivitas page (action, resource, from, to).
 */
export async function GET(req: NextRequest) {
  let userId: string | null = null

  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const verified = await verifyBearerToken(authHeader, {
      ip:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        null,
    })
    if (!verified) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 })
    if (!hasScope(verified, 'read')) {
      return NextResponse.json({ error: 'INSUFFICIENT_SCOPE' }, { status: 403 })
    }
    userId = verified.userId
  } else {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    userId = session.user.id
  }

  const sp = req.nextUrl.searchParams
  const actionRaw = sp.get('action')
  const action =
    actionRaw && ACTIONS.has(actionRaw as AuditAction) ? (actionRaw as AuditAction) : undefined
  const resource = sp.get('resource')?.trim() || undefined
  const from = parseDate(sp.get('from'))
  const to = parseDate(sp.get('to'), true)

  const filters: ActivityFilters = { action, resource, from, to }
  const rows = await exportActivity(userId, filters, 10000)

  const headers = [
    'id',
    'createdAt',
    'action',
    'resource',
    'resourceId',
    'tenantSlug',
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
    r.tenantSlug ?? '',
    r.ip ?? '',
    r.userAgent ?? '',
    r.metadata ? JSON.stringify(r.metadata) : '',
  ])

  const csv = toCsv(headers, data)
  const dateTag = new Date().toISOString().slice(0, 10)
  const filename = `ssn-activity-${dateTag}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
