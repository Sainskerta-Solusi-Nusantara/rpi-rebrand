import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ClipboardList, Plus } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { listQuestions } from '@/lib/interview-questions/queries'
import { QUESTION_CATEGORIES } from '@/lib/interview-questions/constants'
import { InterviewQuestionCard } from '@/components/organisms/interview-question-card'
import { QuestionForm } from '@/components/organisms/interview-question-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Bank Pertanyaan Wawancara — Dasbor' }

const PAGE_SIZE = 25

function buildHref(
  base: string,
  params: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...params, ...overrides }
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v) usp.set(k, v)
  }
  const qs = usp.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function InterviewQuestionsPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const iq = t.pagesTenant3.interviewQuestions

  const CATEGORY_LABELS: Record<string, string> = {
    technical: iq.categoryTechnical,
    behavioral: iq.categoryBehavioral,
    situational: iq.categorySituational,
    culture: iq.categoryCulture,
    other: iq.categoryOther,
  }

  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/interview-questions`,
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

  const rawCategory =
    typeof searchParams.category === 'string' ? searchParams.category : undefined
  const category =
    rawCategory && (QUESTION_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory
      : undefined

  const difficultyRaw =
    typeof searchParams.difficulty === 'string'
      ? Number(searchParams.difficulty)
      : NaN
  const difficulty =
    Number.isFinite(difficultyRaw) && difficultyRaw >= 1 && difficultyRaw <= 5
      ? Math.floor(difficultyRaw)
      : undefined

  const query =
    typeof searchParams.q === 'string' && searchParams.q.trim()
      ? searchParams.q.trim()
      : undefined

  const tagsRaw =
    typeof searchParams.tags === 'string' ? searchParams.tags : undefined
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10)
    : undefined

  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const showForm = searchParams.new === '1'

  const { items, total } = await listQuestions({
    tenantId: tenant.id,
    category,
    difficulty,
    query,
    tags,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const baseHref = `/dashboard/tenants/${tenant.slug}/interview-questions`
  const sp: Record<string, string | undefined> = {
    category,
    difficulty: difficulty ? String(difficulty) : undefined,
    q: query,
    tags: tags?.join(','),
    page: String(page),
  }

  const hasFilters = Boolean(category || difficulty || query || (tags && tags.length))

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {iq.backTo.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">
              {iq.pageHeading}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {iq.totalCount
              .replace('{count}', total.toLocaleString('id-ID'))
              .replace('{tenant}', tenant.name)}
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={
            (showForm
              ? buildHref(baseHref, sp, { new: undefined, page: undefined })
              : buildHref(baseHref, sp, { new: '1', page: undefined })) as any
          }
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showForm ? iq.closeForm : iq.addQuestion}
        </Link>
      </header>

      {showForm && (
        <section
          aria-label={iq.addSectionHeading}
          className="border-border bg-card rounded-2xl border p-5"
        >
          <h2 className="font-heading mb-3 text-lg">{iq.newQuestionHeading}</h2>
          <QuestionForm tenantSlug={tenant.slug} />
        </section>
      )}

      <form
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action={baseHref as any}
        className="border-border bg-card grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-4"
      >
        <div className="space-y-1">
          <label htmlFor="f-category" className="text-muted-foreground text-xs uppercase">
            {iq.filterLabelCategory}
          </label>
          <select
            id="f-category"
            name="category"
            defaultValue={category ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">{iq.filterAllCategories}</option>
            {QUESTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="f-difficulty" className="text-muted-foreground text-xs uppercase">
            {iq.filterLabelDifficulty}
          </label>
          <select
            id="f-difficulty"
            name="difficulty"
            defaultValue={difficulty ? String(difficulty) : ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">{iq.filterAllLevels}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="f-q" className="text-muted-foreground text-xs uppercase">
            {iq.filterLabelSearch}
          </label>
          <input
            id="f-q"
            name="q"
            type="text"
            defaultValue={query ?? ''}
            placeholder={iq.filterSearchPlaceholder}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-tags" className="text-muted-foreground text-xs uppercase">
            {iq.filterLabelTags}
          </label>
          <input
            id="f-tags"
            name="tags"
            type="text"
            defaultValue={tags?.join(', ') ?? ''}
            placeholder={iq.filterTagsPlaceholder}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-4">
          <button
            type="submit"
            className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          >
            {iq.filterBtn}
          </button>
          {hasFilters && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={baseHref as any}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              {iq.filterReset}
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="border-border bg-muted/30 text-muted-foreground rounded-2xl border p-10 text-center text-sm">
          {hasFilters ? iq.emptyFiltered : iq.emptyBlank}
        </div>
      ) : (
        <ul className="space-y-3" aria-label={iq.listAriaLabel}>
          {items.map((q) => (
            <li key={q.id}>
              <InterviewQuestionCard
                tenantSlug={tenant.slug}
                question={{
                  id: q.id,
                  text: q.text,
                  category: q.category,
                  difficulty: q.difficulty,
                  tags: q.tags,
                  createdAt: q.createdAt,
                  createdBy: q.createdBy
                    ? { name: q.createdBy.name, email: q.createdBy.email }
                    : null,
                }}
                canManage
              />
            </li>
          ))}
        </ul>
      )}

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="text-muted-foreground">
          {iq.paginationPage
            .replace('{page}', String(page))
            .replace('{total}', String(totalPages))}
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref(baseHref, sp, { page: String(page - 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              {iq.prevPage}
            </Link>
          )}
          {page < totalPages && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref(baseHref, sp, { page: String(page + 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              {iq.nextPage}
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
