import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { ArticleForm } from '@/components/organisms/article-form'

export const metadata = { title: 'Buat Artikel — Admin' }

export default async function AdminCreateArticlePage() {
  await requireRole('SUPERADMIN', 'ADMIN')

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
        <h1 className="font-heading text-2xl md:text-3xl">Buat Artikel</h1>
        <p className="text-muted-foreground text-sm">
          Artikel baru dibuat sebagai draft. Kamu bisa menerbitkannya kapan
          saja dari daftar artikel.
        </p>
      </header>

      <ArticleForm />
    </div>
  )
}
