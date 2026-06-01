import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { listAdminArticles, type ArticleStatus } from '@/lib/blog/queries'
import { AdminArticleRowActions } from '@/components/organisms/admin-article-row-actions'

export const metadata = { title: 'Kelola Artikel — Admin' }

const PAGE_SIZE = 25

const STATUS_OPTIONS: { value: ''; label: string }[] | { value: string; label: string }[] = [
  { value: '', label: 'Semua status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Dipublikasikan' },
  { value: 'ARCHIVED', label: 'Diarsipkan' },
]

const STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Dipublikasikan',
  ARCHIVED: 'Diarsipkan',
}

const STATUS_TONE: Record<ArticleStatus, string> = {
  DRAFT: 'border-border bg-muted text-foreground/70',
  PUBLISHED: 'border-success/30 bg-success/10 text-success',
  ARCHIVED: 'border-border bg-muted/40 text-muted-foreground',
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await requireRole('SUPERADMIN', 'ADMIN')

  const status =
    typeof searchParams.status === 'string' &&
    ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(searchParams.status)
      ? (searchParams.status as ArticleStatus)
      : undefined
  const query =
    typeof searchParams.q === 'string' && searchParams.q.trim().length > 0
      ? searchParams.q.trim()
      : undefined
  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const { items, total } = await listAdminArticles({
    status,
    query,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (query) params.set('q', query)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin/articles?${qs}` : '/admin/articles'
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Kelola Artikel</h1>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString('id-ID')} artikel sesuai filter saat ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/admin/articles/new' as any}
            className="inline-flex items-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,50%,18%)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Buat artikel
          </Link>
        </div>
      </header>

      <form
        className="flex flex-wrap items-center gap-2"
        action="/admin/articles"
      >
        <input
          name="q"
          defaultValue={query ?? ''}
          placeholder="Cari judul, ringkasan, atau slug"
          className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm">
          Filter
        </button>
      </form>

      <section className="border-border overflow-hidden rounded-xl border">
        {items.length === 0 ? (
          <div className="text-muted-foreground p-10 text-center text-sm">
            Belum ada artikel sesuai filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Judul</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Diperbarui</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const articleStatus = (a.status as ArticleStatus) ?? 'DRAFT'
                return (
                  <tr
                    key={a.id}
                    className="border-border hover:bg-muted/30 border-t transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="text-muted-foreground text-xs">
                        /{a.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[articleStatus]}`}
                      >
                        {STATUS_LABEL[articleStatus]}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {dateFmt.format(a.publishedAt ?? a.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminArticleRowActions
                        articleId={a.id}
                        status={articleStatus}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <nav
          aria-label="Paginasi"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <span className="text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={pageHref(page - 1)}
                className="border-border rounded-md border px-3 py-1.5"
              >
                Sebelumnya
              </a>
            ) : null}
            {page < totalPages ? (
              <a
                href={pageHref(page + 1)}
                className="border-border rounded-md border px-3 py-1.5"
              >
                Berikutnya
              </a>
            ) : null}
          </div>
        </nav>
      )}
    </div>
  )
}
