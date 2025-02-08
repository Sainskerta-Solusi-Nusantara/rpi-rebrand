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
const ResumeUploader: any = safeRequire('@/components/molecules/resume-uploader', 'ResumeUploader')

export const metadata = { title: 'CV & Resume' }

export default async function ResumePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/cv')
  const userId = session.user.id

  const resumes = await prisma.resume
    .findMany({ where: { userId }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] })
    .catch(() => [])

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">CV & Resume</h1>
        <p className="text-muted-foreground mt-1">
          Kelola dokumen CV yang akan dikirim ke mitra perekrut.
        </p>
      </header>

      <ResumeUploader />

      <section>
        <h2 className="font-heading text-xl mb-4">Dokumen Anda</h2>
        {resumes.length === 0 ? (
          <div className="border-border rounded-xl border p-8 text-center">
            <p className="text-muted-foreground">Belum ada CV yang diunggah.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {resumes.map((r) => (
              <li
                key={r.id}
                className="border-border flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <div className="font-medium">
                    {r.name}{' '}
                    {r.isPrimary ? (
                      <span className="bg-primary text-primary-foreground ml-2 rounded px-2 py-0.5 text-xs">
                        Utama
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Diunggah{' '}
                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(r.createdAt)}
                  </div>
                </div>
                <a
                  href={r.fileUrl}
                  className="text-primary text-sm underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
