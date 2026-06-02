import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { getServerT } from '@/lib/i18n/server-dictionary'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-48 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JobsTable: any = safeRequire('@/components/organisms/jobs-table', 'JobsTable')

export const metadata = { title: 'Lowongan Saya' }

async function resolveTenantId(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) {
    const t = await prisma.tenant.findUnique({ where: { slug: hSlug }, select: { id: true } }).catch(() => null)
    if (t?.id) return t.id
  }
  const ut = await prisma.userTenant
    .findFirst({ where: { userId }, select: { tenantId: true } })
    .catch(() => null)
  return ut?.tenantId ?? null
}

export default async function PartnerJobsPage() {
  const t = await getServerT()
  const session = await getServerSession(authOptions)
  const tenantId = await resolveTenantId(session!.user.id)
  const where = tenantId ? { tenantId } : {}

  const jobs = await prisma.job
    .findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        location: true,
        locationType: true,
        employmentType: true,
        views: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { applications: true } },
      },
    })
    .catch(() => [])

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{t.partner.jobs.title}</h1>
          <p className="text-muted-foreground mt-1">{t.partner.jobs.subtitle}</p>
        </div>
        <a
          href="/partner/lowongan/baru"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium"
        >
          {t.partner.jobs.createButton}
        </a>
      </header>

      <JobsTable jobs={jobs} editable />
    </div>
  )
}
