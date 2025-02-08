import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

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
const KanbanBoard: any = safeRequire('@/components/organisms/kanban-board', 'KanbanBoard')

export const metadata = { title: 'Lamaran Saya' }

export default async function ApplicationsKanbanPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/lamaran')
  const userId = session.user.id

  const [savedJobs, applications] = await Promise.all([
    prisma.savedJob
      .findMany({
        where: { userId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              location: true,
              tenant: { select: { name: true } },
            },
          },
        },
        orderBy: { savedAt: 'desc' },
      })
      .catch(() => []),
    prisma.application
      .findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              location: true,
              tenant: { select: { name: true } },
            },
          },
        },
      })
      .catch(() => []),
  ])

  const columns = [
    {
      id: 'SAVED',
      title: 'Disimpan',
      items: savedJobs.map((s) => ({
        id: s.id,
        title: s.job.title,
        meta: `${s.job.tenant?.name ?? ''} • ${s.job.location ?? ''}`,
        href: `/jobs/${s.job.slug}`,
      })),
    },
    {
      id: 'APPLIED',
      title: 'Dilamar',
      items: applications
        .filter((a) => a.status === 'APPLIED' || a.status === 'REVIEWED')
        .map((a) => ({
          id: a.id,
          title: a.job.title,
          meta: `${a.job.tenant?.name ?? ''} • ${a.status}`,
          href: `/jobs/${a.job.slug}`,
        })),
    },
    {
      id: 'INTERVIEW',
      title: 'Wawancara',
      items: applications
        .filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW')
        .map((a) => ({
          id: a.id,
          title: a.job.title,
          meta: `${a.job.tenant?.name ?? ''} • ${a.status}`,
          href: `/jobs/${a.job.slug}`,
        })),
    },
    {
      id: 'OFFER',
      title: 'Penawaran',
      items: applications
        .filter((a) => a.status === 'OFFERED' || a.status === 'HIRED')
        .map((a) => ({
          id: a.id,
          title: a.job.title,
          meta: `${a.job.tenant?.name ?? ''} • ${a.status}`,
          href: `/jobs/${a.job.slug}`,
        })),
    },
  ]

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">Lamaran Saya</h1>
        <p className="text-muted-foreground mt-1">
          Pantau status setiap lamaran dari disimpan hingga penawaran.
        </p>
      </header>
      <KanbanBoard columns={columns} />
    </div>
  )
}
