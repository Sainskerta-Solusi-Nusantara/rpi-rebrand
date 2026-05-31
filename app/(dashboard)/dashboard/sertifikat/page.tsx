import Link from 'next/link'
import { Award, Download, ExternalLink, GraduationCap } from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Sertifikat' }

export default async function CertificatesPage() {
  const session = await requireAuth('/dashboard/sertifikat')
  const userId = session.user.id

  const certificates = await prisma.certificate
    .findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: { course: { select: { id: true, title: true, slug: true } } },
    })
    .catch(() => [])

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Sertifikat Saya</h1>
        <p className="text-muted-foreground mt-1">
          {certificates.length} sertifikat terkumpul.
        </p>
      </header>

      {certificates.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-10 text-center">
          <GraduationCap
            className="text-muted-foreground mx-auto h-10 w-10"
            aria-hidden
          />
          <p className="text-foreground mt-3 font-medium">
            Belum ada sertifikat.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Selesaikan kursus untuk mendapatkan sertifikat resmi.
          </p>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={('/dashboard/kursus') as any}
            className="text-primary mt-4 inline-block text-sm font-medium underline-offset-2 hover:underline"
          >
            Lihat kursus saya
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <li
              key={c.id}
              className="border-border bg-card flex flex-col rounded-2xl border p-6"
            >
              <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                <Award className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                Sertifikat
              </div>
              <h2 className="font-heading text-foreground mt-1 line-clamp-2 text-lg">
                {c.title}
              </h2>
              <dl className="text-muted-foreground mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Penerbit</dt>
                  <dd className="text-foreground text-right">{c.issuer}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Diterbitkan</dt>
                  <dd className="text-foreground text-right">
                    {new Intl.DateTimeFormat('id-ID', {
                      dateStyle: 'medium',
                    }).format(c.issuedAt)}
                  </dd>
                </div>
                {c.course ? (
                  <div className="flex justify-between gap-3">
                    <dt>Kursus</dt>
                    <dd className="text-foreground text-right">{c.course.title}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={(`/sertifikat/${c.id}`) as any}
                  className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Halaman verifikasi
                </Link>
                {c.fileUrl ? (
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Unduh SVG
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
