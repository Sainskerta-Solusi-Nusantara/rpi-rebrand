import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ClipboardList } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { QuestionForm } from '@/components/organisms/interview-question-form'

export const metadata = { title: 'Ubah Pertanyaan — Dasbor' }

export default async function EditInterviewQuestionPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/interview-questions/${params.id}/edit`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    notFound()
  }

  const question = await prisma.interviewQuestion
    .findUnique({
      where: { id: params.id },
      select: {
        id: true,
        tenantId: true,
        text: true,
        category: true,
        difficulty: true,
        tags: true,
      },
    })
    .catch(() => null)
  if (!question || question.tenantId !== tenant.id) notFound()

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/interview-questions` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar pertanyaan
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Ubah pertanyaan</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Perbarui pertanyaan untuk{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-5">
        <QuestionForm
          tenantSlug={tenant.slug}
          initial={{
            id: question.id,
            text: question.text,
            category: question.category,
            difficulty: question.difficulty,
            tags: question.tags ?? [],
          }}
        />
      </section>
    </div>
  )
}
