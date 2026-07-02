/**
 * Public certificate verification page.
 *
 * Anyone with a certificate number can land here to confirm the cert is real.
 * We do NOT require login — verification is by design a public lookup so an
 * employer can scan and verify without an SSN account.
 *
 * On 404 (unknown number) Next renders the closest not-found boundary.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, ShieldCheck } from 'lucide-react'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Verifikasi Sertifikat' }

type Params = { number: string }

export default async function VerifyCertificatePage({
  params,
}: {
  params: Params
}) {
  const number = decodeURIComponent(params.number ?? '').trim()
  if (!number) notFound()

  const cert = await prisma.certificate.findUnique({
    where: { certificateNumber: number },
    select: {
      id: true,
      certificateNumber: true,
      title: true,
      issuer: true,
      issuedAt: true,
      fileUrl: true,
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
  })

  if (!cert) notFound()

  const recipient =
    cert.user.name?.trim() ||
    cert.user.email?.split('@')[0] ||
    'Penerima Sertifikat'

  return (
    <main className="bg-muted/30 min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Sertifikat Sah
              </p>
              <h1 className="font-heading text-foreground mt-0.5 text-2xl font-semibold md:text-3xl">
                {cert.title}
              </h1>
            </div>
          </div>

          <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                Nama penerima
              </dt>
              <dd className="text-foreground mt-1 font-medium">{recipient}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                Penerbit
              </dt>
              <dd className="text-foreground mt-1 font-medium">
                {cert.issuer}
              </dd>
            </div>
            {cert.course && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  Kursus
                </dt>
                <dd className="text-foreground mt-1 font-medium">
                  {cert.course.title}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                Tanggal terbit
              </dt>
              <dd className="text-foreground mt-1 font-medium">
                {new Intl.DateTimeFormat('id-ID', {
                  dateStyle: 'long',
                }).format(cert.issuedAt)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                Nomor sertifikat
              </dt>
              <dd className="text-foreground mt-1 font-mono text-base font-semibold tracking-widest">
                {cert.certificateNumber}
              </dd>
            </div>
          </dl>

          <div className="border-border mt-8 flex flex-wrap gap-2 border-t pt-6">
            {cert.certificateNumber && (
              <Link
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                href={(`/sertifikat/${cert.certificateNumber}`) as any}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
              >
                Lihat sertifikat
              </Link>
            )}
            <Link
              href="/"
              className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium"
            >
              Beranda
            </Link>
          </div>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Halaman ini dapat diakses publik untuk memverifikasi keaslian
          sertifikat SSN Academy.
        </p>
      </div>
    </main>
  )
}
