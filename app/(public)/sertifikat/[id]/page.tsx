import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Award, CheckCircle2, Download } from 'lucide-react'

import { prisma } from '@/lib/db'
import { buildCertificateSvg } from '@/lib/enrollments/certificate-svg'

type Params = { id: string }

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const cert = await prisma.certificate
    .findUnique({
      where: { id: params.id },
      select: { title: true, issuer: true },
    })
    .catch(() => null)
  if (!cert) return { title: 'Sertifikat tidak ditemukan' }
  return {
    title: `${cert.title} — Verifikasi Sertifikat`,
    description: `Sertifikat resmi diterbitkan oleh ${cert.issuer}.`,
  }
}

export default async function CertificateVerifyPage({
  params,
}: {
  params: Params
}) {
  const cert = await prisma.certificate
    .findUnique({
      where: { id: params.id },
      include: {
        course: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    })
    .catch(() => null)
  if (!cert) notFound()

  const recipientName =
    cert.user.name ?? cert.user.email?.split('@')[0] ?? 'Peserta RPI'

  // Render the same SVG inline so verifiers see the exact document. We
  // rebuild from authoritative DB values to defeat any tampering with the
  // file on disk.
  const inlineSvg = buildCertificateSvg({
    recipientName,
    courseTitle: cert.course?.title ?? cert.title,
    issuerName: cert.issuer,
    issuedAt: cert.issuedAt,
    certificateId: cert.id,
  })

  const issuedAtFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(cert.issuedAt)

  return (
    <div className="container mx-auto w-full max-w-5xl space-y-8 px-6 py-12 md:py-16">
      <header className="space-y-2 text-center">
        <div className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Sertifikat terverifikasi
        </div>
        <h1 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          {cert.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          Diterbitkan oleh {cert.issuer} pada {issuedAtFormatted}.
        </p>
      </header>

      {/* Inline SVG render */}
      <div
        aria-label="Pratinjau sertifikat"
        className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: inlineSvg }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <dl className="border-border bg-card space-y-2 rounded-2xl border p-6 text-sm">
          <DLRow label="Diberikan kepada" value={recipientName} />
          <DLRow label="Kursus" value={cert.course?.title ?? '—'} />
          <DLRow label="Dikeluarkan oleh" value={cert.issuer} />
          <DLRow label="Tanggal terbit" value={issuedAtFormatted} />
          <DLRow label="ID Sertifikat" value={cert.id} mono />
        </dl>

        <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-6">
          <div className="flex items-start gap-3">
            <Award className="text-[color:var(--ring)] mt-0.5 h-6 w-6" aria-hidden />
            <div>
              <h2 className="font-heading text-foreground text-base font-semibold">
                Cara verifikasi
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                ID sertifikat ini unik dan dapat diverifikasi secara publik
                melalui halaman ini. Bandingkan informasi di atas dengan
                dokumen yang diberikan kepada Anda.
              </p>
            </div>
          </div>
          {cert.fileUrl && (
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-auto inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium"
            >
              <Download className="h-4 w-4" aria-hidden />
              Unduh
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function DLRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={
          (mono ? 'font-mono ' : '') + 'text-foreground text-right text-sm'
        }
      >
        {value}
      </dd>
    </div>
  )
}
