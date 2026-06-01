import Link from 'next/link'
import {
  Award,
  Download,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Sertifikat' }

export default async function CertificatesPage() {
  const session = await requireAuth('/dashboard/sertifikat')
  const userId = session.user.id
  const t = await getServerT()

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
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.certificates.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.certificates.countLabel.replace('{n}', String(certificates.length))}
        </p>
      </header>

      {certificates.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-10 text-center">
          <GraduationCap
            className="text-muted-foreground mx-auto h-10 w-10"
            aria-hidden
          />
          <p className="text-foreground mt-3 font-medium">
            {t.dashboard.certificates.empty}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.dashboard.certificates.emptyDesc}
          </p>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={('/dashboard/kursus') as any}
            className="text-primary mt-4 inline-block text-sm font-medium underline-offset-2 hover:underline"
          >
            {t.dashboard.certificates.viewCourses}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => {
            // Prefer certificateNumber for routing — falls back to id for
            // legacy certificates issued before the number column existed.
            const slug = c.certificateNumber ?? c.id
            return (
              <li
                key={c.id}
                className="border-border bg-card flex flex-col rounded-2xl border p-6"
              >
                <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                  <Award className="text-[color:var(--ring)] h-3.5 w-3.5" aria-hidden />
                  {t.dashboard.certificates.badge}
                </div>
                <h2 className="font-heading text-foreground mt-1 line-clamp-2 text-lg">
                  {c.title}
                </h2>
                {c.certificateNumber && (
                  <p className="text-muted-foreground mt-1 font-mono text-xs tracking-wider">
                    {c.certificateNumber}
                  </p>
                )}
                <dl className="text-muted-foreground mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>{t.dashboard.certificates.issuer}</dt>
                    <dd className="text-foreground text-right">{c.issuer}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t.dashboard.certificates.issuedOn}</dt>
                    <dd className="text-foreground text-right">
                      {new Intl.DateTimeFormat('id-ID', {
                        dateStyle: 'medium',
                      }).format(c.issuedAt)}
                    </dd>
                  </div>
                  {c.course ? (
                    <div className="flex justify-between gap-3">
                      <dt>{t.dashboard.certificates.course}</dt>
                      <dd className="text-foreground text-right">
                        {c.course.title}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={(`/sertifikat/${slug}`) as any}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    {t.dashboard.certificates.downloadCertificate}
                  </Link>
                  {c.certificateNumber && (
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={(`/sertifikat/verify/${c.certificateNumber}`) as any}
                      className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      {t.dashboard.certificates.verifyCertificate}
                    </Link>
                  )}
                  {c.fileUrl ? (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {t.dashboard.certificates.openFile}
                    </a>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
