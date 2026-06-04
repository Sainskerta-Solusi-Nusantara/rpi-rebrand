import Link from 'next/link'
import { Plus } from 'lucide-react'

import { listAdminAssessments } from '@/lib/assessments/queries'
import { AdminAssessmentRowActions } from '@/components/organisms/admin-assessment-row-actions'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatNumber, formatDate as formatDateI18n } from '@/lib/i18n/format'

export const metadata = { title: 'Manajemen Asesmen' }

const STATUS_TONES: Record<string, string> = {
  DRAFT: 'bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200',
  PUBLISHED: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  ARCHIVED: 'bg-stone-200 dark:bg-stone-500/20 text-stone-800 dark:text-stone-300',
}

const PAGE_SIZE = 20

export default async function AdminAssessmentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const ta = t.admin.assessments
  const CATEGORY_LABELS: Record<string, string> = ta.category
  const STATUS_LABELS: Record<string, string> = ta.status
  const formatDate = (d: Date): string =>
    formatDateI18n(d, locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const status =
    typeof searchParams.status === 'string' &&
    Object.prototype.hasOwnProperty.call(STATUS_LABELS, searchParams.status)
      ? searchParams.status
      : undefined
  const category =
    typeof searchParams.kategori === 'string' &&
    Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, searchParams.kategori)
      ? searchParams.kategori
      : undefined
  const query =
    typeof searchParams.q === 'string' && searchParams.q.trim().length > 0
      ? searchParams.q.trim()
      : undefined
  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const { items, total, totalPages } = await listAdminAssessments({
    status,
    category,
    query,
    page,
    pageSize: PAGE_SIZE,
  })

  function pageHref(p: number) {
    const sp = new URLSearchParams()
    if (status) sp.set('status', status)
    if (category) sp.set('kategori', category)
    if (query) sp.set('q', query)
    if (p > 1) sp.set('page', String(p))
    const s = sp.toString()
    return s ? `/admin/assessments?${s}` : '/admin/assessments'
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{ta.title}</h1>
          <p className="text-muted-foreground mt-1">
            {ta.subtitle.replace('{n}', formatNumber(total, locale))}
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/admin/assessments/new' as any}
          className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {ta.create}
        </Link>
      </header>

      <form className="flex flex-wrap gap-2" action="/admin/assessments">
        <input
          name="q"
          defaultValue={query ?? ''}
          placeholder={ta.searchPlaceholder}
          className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">{ta.allStatuses}</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          name="kategori"
          defaultValue={category ?? ''}
          className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">{ta.allCategories}</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm">
          {t.admin.common.filter}
        </button>
      </form>

      {items.length === 0 ? (
        <div className="border-border bg-card rounded-xl border p-10 text-center text-sm">
          {ta.empty}
        </div>
      ) : (
        <div className="border-border bg-card overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-foreground/80 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">{ta.colTitle}</th>
                <th className="px-4 py-2 text-left">{ta.colCategory}</th>
                <th className="px-4 py-2 text-left">{ta.colStatus}</th>
                <th className="px-4 py-2 text-right">{ta.colQuestions}</th>
                <th className="px-4 py-2 text-right">{ta.colAttempts}</th>
                <th className="px-4 py-2 text-left">{ta.colCreated}</th>
                <th className="px-4 py-2 text-right">{ta.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-muted-foreground text-xs">
                      /{a.slug}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {CATEGORY_LABELS[a.category] ?? a.category}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[10px] font-medium ' +
                        (STATUS_TONES[a.status] ?? 'bg-muted text-foreground')
                      }
                    >
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    {a.questionCount}
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    {a.attemptCount}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <AdminAssessmentRowActions
                      assessmentId={a.id}
                      status={a.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Paginasi"
          className="flex flex-wrap items-center justify-center gap-2 pt-4"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={pageHref(p) as any}
              className={
                'rounded-md border px-3 py-1.5 text-xs ' +
                (p === page
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted')
              }
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
