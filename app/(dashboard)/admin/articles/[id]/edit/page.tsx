import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  ArticleForm,
  type ArticleFormInitial,
} from '@/components/organisms/article-form'
import type { ArticleStatus } from '@/lib/blog/actions'

export const metadata = { title: 'Edit Artikel — Admin' }

export default async function AdminEditArticlePage({
  params,
}: {
  params: { id: string }
}) {
  await requireRole('SUPERADMIN', 'ADMIN')

  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      summary: true,
      body: true,
      coverImage: true,
      tags: true,
      status: true,
    },
  })
  if (!article) notFound()

  const initial: ArticleFormInitial = {
    title: article.title,
    summary: article.summary ?? '',
    body: article.body,
    coverImage: article.coverImage ?? '',
    tags: article.tags,
    status: (article.status as ArticleStatus) ?? 'DRAFT',
  }

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/admin/articles' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kembali ke daftar
        </Link>
        <h1 className="font-heading text-2xl md:text-3xl">Edit Artikel</h1>
        <p className="text-muted-foreground text-sm">
          Perubahan akan tersimpan ke artikel yang sudah ada. Jika status
          diubah menjadi “Dipublikasikan”, tanggal publikasi akan diisi otomatis
          (jika belum pernah).
        </p>
      </header>

      <ArticleForm articleId={article.id} initial={initial} />
    </div>
  )
}
