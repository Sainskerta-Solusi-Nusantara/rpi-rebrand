import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { toCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const HEADERS = [
  'title',
  'description',
  'level',
  'durationHours',
  'instructorEmail',
  'thumbnail',
  'status',
] as const

const SAMPLE_ROW: string[] = [
  'Pengantar React',
  'Pelajari dasar-dasar React dari nol — komponen, state, props, dan hooks dengan studi kasus nyata. Kursus ini cocok untuk pemula yang ingin masuk ke ekosistem front-end modern.',
  'BEGINNER',
  '12',
  'instructor@example.com',
  '',
  'DRAFT',
]

/**
 * GET /api/tenants/:slug/kursus/template
 * Returns a CSV template (headers + one example row) for the bulk course importer.
 * Requires an authenticated session with course.create permission on the tenant.
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
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'course.create')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const csv = toCsv([...HEADERS], [SAMPLE_ROW])
  const filename = `rpi-courses-template.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
