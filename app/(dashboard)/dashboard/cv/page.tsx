import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { ResumeList, type ResumeListItem } from '@/components/organisms/resume-list'

export const metadata = { title: 'CV & Resume' }

export default async function ResumePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/dashboard/cv')
  const userId = session.user.id

  const rows = await prisma.resume
    .findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        fileUrl: true,
        content: true,
        isPrimary: true,
        createdAt: true,
      },
    })
    .catch(() => [])

  const resumes: ResumeListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    fileUrl: r.fileUrl,
    hasContent: Boolean(
      r.content && typeof r.content === 'object' && Object.keys(r.content as object).length > 0,
    ),
    isPrimary: r.isPrimary,
    createdAt: r.createdAt,
  }))

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">CV & Resume</h1>
        <p className="text-muted-foreground mt-1">
          Buat dan kelola CV. Anda dapat menambahkan konten langsung melalui builder
          atau mengunggah dokumen PDF/DOC.
        </p>
      </header>

      <ResumeList resumes={resumes} />
    </div>
  )
}
