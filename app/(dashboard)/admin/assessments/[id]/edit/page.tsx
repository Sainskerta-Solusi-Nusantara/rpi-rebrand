import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'

import { prisma } from '@/lib/db'
import { AssessmentEditor } from '@/components/organisms/assessment-editor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ubah Asesmen' }

export default async function EditAssessmentPage({
  params,
}: {
  params: { id: string }
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true, title: true, status: true },
  })
  if (!assessment) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={'/admin/assessments' as any}
        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Kembali ke daftar asesmen
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">
            Editor: {assessment.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Slug: <code>/{assessment.slug}</code>
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/assesmen/${assessment.slug}` as any}
          target="_blank"
          rel="noreferrer"
          className="border-border bg-background hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Pratinjau halaman kandidat
        </Link>
      </header>

      <AssessmentEditor assessmentId={assessment.id} />
    </div>
  )
}
