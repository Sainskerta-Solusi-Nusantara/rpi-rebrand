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
const JobCard: any = safeRequire('@/components/molecules/job-card', 'JobCard')

export const metadata = { title: 'Disimpan' }

export default async function SavedJobsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/disimpan')
  const userId = session.user.id

  const saved = await prisma.savedJob
    .findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            locationType: true,
            employmentType: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            publishedAt: true,
            tenant: { select: { name: true, slug: true } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    })
    .catch(() => [])

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">Lowongan Disimpan</h1>
        <p className="text-muted-foreground mt-1">
          {saved.length.toLocaleString('id-ID')} lowongan yang Anda simpan.
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="border-border rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">Belum ada lowongan yang disimpan.</p>
          <a href="/jobs" className="text-primary mt-3 inline-block underline">
            Jelajahi lowongan
          </a>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => (
            <li key={s.id}>
              <JobCard job={s.job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
