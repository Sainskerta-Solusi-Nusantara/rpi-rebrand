import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import {
  ResumeBuilderForm,
  type ResumeBuilderInitial,
} from '@/components/organisms/resume-builder-form'
import { ResumeSuggestionsPanel } from '@/components/organisms/resume-suggestions-panel'
import type { ResumeContent } from '@/lib/resumes/actions'
import { analyzeResume, type AnalyzerResume } from '@/lib/resume/analyzer'

export const metadata = { title: 'Edit CV' }

export default async function ResumeEditPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user)
    redirect(`/login?callbackUrl=/dashboard/cv/${params.id}`)
  const userId = session.user.id

  const resume = await prisma.resume
    .findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        name: true,
        fileUrl: true,
        content: true,
      },
    })
    .catch(() => null)

  if (!resume || resume.userId !== userId) {
    notFound()
  }

  const initial: ResumeBuilderInitial = {
    id: resume.id,
    name: resume.name,
    fileUrl: resume.fileUrl,
    content:
      resume.content && typeof resume.content === 'object'
        ? (resume.content as ResumeContent)
        : null,
  }

  // Pull contact info for analyzer (NOT persisted as part of resume.content).
  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    })
    .catch(() => null)

  const analyzerInput: AnalyzerResume = {
    name: resume.name,
    fileUrl: resume.fileUrl,
    summary: initial.content?.summary ?? undefined,
    experiences: initial.content?.experiences ?? [],
    educations: initial.content?.educations ?? [],
    skills: initial.content?.skills ?? [],
    languages: initial.content?.languages ?? [],
    email: user?.email ?? undefined,
    phone: user?.phone ?? undefined,
    links: [],
  }
  const initialAnalysis = analyzeResume(analyzerInput)

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/cv"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar CV
        </Link>
      </div>
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Edit CV</h1>
        <p className="text-muted-foreground mt-1">
          Perbarui detail CV, unggah dokumen, dan susun konten builder.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ResumeBuilderForm resume={initial} />
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ResumeSuggestionsPanel
            resumeId={resume.id}
            initialAnalysis={initialAnalysis}
          />
        </aside>
      </div>
    </div>
  )
}
