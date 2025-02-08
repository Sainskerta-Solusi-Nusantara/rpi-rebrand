import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

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
const TalentList: any = safeRequire('@/components/organisms/talent-list', 'TalentList')

export const metadata = { title: 'Talent Pool' }

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

export default async function PartnerTalentPage() {
  const session = await getServerSession(authOptions)
  const tenantId = await resolveTenantId(session!.user.id)

  // Talent pool: users who applied to any of this tenant's jobs.
  const applications = tenantId
    ? await prisma.application
        .findMany({
          where: { tenantId },
          distinct: ['userId'],
          orderBy: { appliedAt: 'desc' },
          take: 100,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                headline: true,
                location: true,
              },
            },
            job: { select: { title: true } },
          },
        })
        .catch(() => [])
    : []

  const talents = applications.map((a) => ({
    id: a.user.id,
    name: a.user.name,
    email: a.user.email,
    image: a.user.image,
    headline: a.user.headline,
    location: a.user.location,
    lastApplication: a.job.title,
    lastStatus: a.status,
    lastAppliedAt: a.appliedAt,
  }))

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">Talent Pool</h1>
        <p className="text-muted-foreground mt-1">
          {talents.length} kandidat berinteraksi dengan lowongan Anda.
        </p>
      </header>

      <TalentList talents={talents} />
    </div>
  )
}
