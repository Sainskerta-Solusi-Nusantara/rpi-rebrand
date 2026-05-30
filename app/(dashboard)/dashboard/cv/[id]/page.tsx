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
import type { ResumeContent } from '@/lib/resumes/actions'

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

  return (
    <div className="max-w-3xl space-y-6 p-6">
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
      <ResumeBuilderForm resume={initial} />
    </div>
  )
}
