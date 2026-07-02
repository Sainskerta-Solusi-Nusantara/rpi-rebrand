import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { toCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const HEADERS = [
  'title',
  'location',
  'description',
  'employmentType',
  'experienceLevel',
  'locationType',
  'salaryMin',
  'salaryMax',
  'status',
  'tags',
  'responsibilities',
  'requirements',
  'benefits',
  'categorySlug',
] as const

const SAMPLE_ROW: string[] = [
  'Senior Backend Engineer',
  'Jakarta',
  'Kami mencari backend engineer berpengalaman untuk membangun layanan inti produk konsumen. Anda akan memimpin desain API dan kolaborasi lintas tim.',
  'FULL_TIME',
  'SENIOR',
  'HYBRID',
  '20000000',
  '35000000',
  'DRAFT',
  'go, postgres, kubernetes',
  'Memimpin desain layanan inti, mentoring engineer junior, kolaborasi dengan tim produk.',
  '5+ tahun pengalaman backend, kuat di Go atau Java, paham distributed systems.',
  'Asuransi kesehatan keluarga, opsi remote 2 hari/minggu, anggaran pelatihan.',
  '',
]

/**
 * GET /api/tenants/:slug/jobs/template
 * Returns a CSV template (headers + one example row) for the bulk job importer.
 * Requires an authenticated session with job.create permission on the tenant.
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
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.create')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const csv = toCsv([...HEADERS], [SAMPLE_ROW])
  const filename = `ssn-jobs-template.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
