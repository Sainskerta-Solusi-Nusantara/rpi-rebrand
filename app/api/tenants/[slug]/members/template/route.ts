import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { toCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const HEADERS = ['email', 'role', 'name'] as const

const SAMPLE_ROWS: string[][] = [
  ['admin@example.com', 'ADMIN', 'Admin Contoh'],
  ['recruiter@example.com', 'RECRUITER', 'Recruiter Contoh'],
]

/**
 * GET /api/tenants/:slug/members/template
 * Returns a CSV template (headers + two example rows) for the bulk member
 * importer. Requires an authenticated session with team.invite permission on
 * the tenant.
 */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  }

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true },
    })
    .catch(() => null)
  if (!tenant) {
    return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 })
  }

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const csv = toCsv([...HEADERS], SAMPLE_ROWS)
  const filename = `ssn-members-template.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
