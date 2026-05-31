import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getAssessmentForAttempt } from '@/lib/assessments/queries'
import { AssessmentTaker } from '@/components/organisms/assessment-taker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mengerjakan Asesmen' }

export default async function AssessmentAttemptPage({
  params,
}: {
  params: { slug: string; attemptId: string }
}) {
  const session = await requireAuth(
    `/dashboard/assesmen/${params.slug}/attempt/${params.attemptId}`,
  )
  const userId = session.user.id

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: params.attemptId },
    select: {
      id: true,
      userId: true,
      assessmentId: true,
      completedAt: true,
      score: true,
      passed: true,
      assessment: { select: { slug: true } },
    },
  })

  if (!attempt) notFound()
  // Slug guard: attempt must belong to the assessment in the URL.
  if (attempt.assessment.slug !== params.slug) notFound()
  // Ownership guard.
  if (attempt.userId !== userId) {
    redirect(`/dashboard/assesmen/${params.slug}`)
  }

  // Already-completed attempts: bounce to intro so user sees the result card.
  if (attempt.completedAt) {
    redirect(`/dashboard/assesmen/${params.slug}`)
  }

  const data = await getAssessmentForAttempt(attempt.assessmentId, userId)
  if (!data) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/dashboard/assesmen/${params.slug}` as any}
        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Batalkan dan kembali
      </Link>

      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{data.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih jawaban untuk setiap pertanyaan lalu kumpulkan di akhir halaman.
        </p>
      </header>

      <AssessmentTaker attemptId={attempt.id} assessment={data} />
    </div>
  )
}
