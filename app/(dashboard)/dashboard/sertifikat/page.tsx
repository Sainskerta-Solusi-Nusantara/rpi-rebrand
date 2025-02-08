import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Sertifikat' }

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/sertifikat')
  const userId = session.user.id

  const certificates = await prisma.certificate
    .findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: { course: { select: { id: true, title: true, slug: true } } },
    })
    .catch(() => [])

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Sertifikat Saya</h1>
        <p className="text-muted-foreground mt-1">
          {certificates.length} sertifikat terkumpul.
        </p>
      </header>

      {certificates.length === 0 ? (
        <div className="border-border rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">
            Belum ada sertifikat. Selesaikan kursus untuk mendapatkannya.
          </p>
          <a href="/lms" className="text-primary mt-3 inline-block underline">
            Lihat pembelajaran
          </a>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <li
              key={c.id}
              className="border-border bg-card rounded-xl border p-6"
            >
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Sertifikat
              </div>
              <h2 className="font-heading mt-1 text-lg">{c.title}</h2>
              <dl className="text-muted-foreground mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt>Penerbit</dt>
                  <dd className="text-foreground">{c.issuer}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Diterbitkan</dt>
                  <dd className="text-foreground">
                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(c.issuedAt)}
                  </dd>
                </div>
                {c.course ? (
                  <div className="flex justify-between">
                    <dt>Kursus</dt>
                    <dd className="text-foreground">{c.course.title}</dd>
                  </div>
                ) : null}
              </dl>
              <a
                href={c.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary mt-4 inline-block text-sm underline"
              >
                Unduh PDF
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
