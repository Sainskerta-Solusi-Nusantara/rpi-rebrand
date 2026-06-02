import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server-dictionary'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-72 w-full animate-pulse rounded-xl"
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
const JobForm: any = safeRequire('@/components/organisms/job-form', 'JobForm')

export const metadata = { title: 'Buat Lowongan Baru' }

export default async function NewJobPage() {
  const t = await getServerT()
  const categories = await prisma.jobCategory
    .findMany({ orderBy: { name: 'asc' } })
    .catch(() => [])

  return (
    <div className="p-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">{t.partner.newJob.title}</h1>
        <p className="text-muted-foreground mt-1">{t.partner.newJob.subtitle}</p>
      </header>

      <JobForm mode="create" categories={categories} />
    </div>
  )
}
