import Link from 'next/link'
import {
  BadgeCheck,
  Brain,
  ChevronRight,
  Languages,
  Lightbulb,
  Search,
  Timer,
  Wrench,
} from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { listPublishedAssessments } from '@/lib/assessments/queries'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Asesmen Keterampilan' }

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Teknis',
  soft: 'Soft skill',
  language: 'Bahasa',
  cognitive: 'Kognitif',
}

const CATEGORY_ICONS: Record<string, typeof Wrench> = {
  technical: Wrench,
  soft: Lightbulb,
  language: Languages,
  cognitive: Brain,
}

const PAGE_SIZE = 12

export default async function CandidateAssessmentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const session = await requireAuth('/dashboard/assesmen')
  const userId = session.user.id

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

  const { items, total, totalPages } = await listPublishedAssessments({
    category,
    query,
    page,
    pageSize: PAGE_SIZE,
  })

  // Determine which assessments the user has already PASSED — for the
  // "Sudah lulus" chip. Cheap single query keyed on the listed slugs.
  const listedIds = items.map((i) => i.id)
  const passedRows =
    listedIds.length === 0
      ? []
      : await prisma.assessmentAttempt
          .findMany({
            where: {
              userId,
              passed: true,
              assessmentId: { in: listedIds },
            },
            select: { assessmentId: true },
            distinct: ['assessmentId'],
          })
          .catch(() => [])
  const passedSet = new Set(passedRows.map((r) => r.assessmentId))

  function categoryHref(c?: string) {
    const sp = new URLSearchParams()
    if (c) sp.set('kategori', c)
    if (query) sp.set('q', query)
    const s = sp.toString()
    return s ? `/dashboard/assesmen?${s}` : '/dashboard/assesmen'
  }

  function pageHref(p: number) {
    const sp = new URLSearchParams()
    if (category) sp.set('kategori', category)
    if (query) sp.set('q', query)
    if (p > 1) sp.set('page', String(p))
    const s = sp.toString()
    return s ? `/dashboard/assesmen?${s}` : '/dashboard/assesmen'
  }

  const countLabel = category
    ? t.pagesDash.assesmen.countLabelCategory
        .replace('{total}', total.toLocaleString('id-ID'))
        .replace('{category}', CATEGORY_LABELS[category] ?? category)
    : t.pagesDash.assesmen.countLabel.replace('{total}', total.toLocaleString('id-ID'))

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">
          {t.pagesDash.assesmen.heading}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.pagesDash.assesmen.subheading}
        </p>
      </header>

      <form className="flex flex-wrap gap-2" action="/dashboard/assesmen">
        {category && <input type="hidden" name="kategori" value={category} />}
        <label className="border-border bg-background flex flex-1 items-center gap-2 rounded-md border px-3 text-sm">
          <Search
            className="text-muted-foreground h-4 w-4"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={query ?? ''}
            placeholder={t.pagesDash.assesmen.searchPlaceholder}
            className="h-9 w-full bg-transparent text-sm outline-none"
          />
        </label>
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          {t.pagesDash.assesmen.searchButton}
        </button>
      </form>

      <nav
        aria-label={t.pagesDash.assesmen.filterCategoryLabel}
        className="border-border flex flex-wrap gap-2 border-b pb-3"
      >
        {[undefined, ...Object.keys(CATEGORY_LABELS)].map((c) => {
          const active = (c ?? '') === (category ?? '')
          const label = c ? CATEGORY_LABELS[c] : t.pagesDash.assesmen.filterLabel
          return (
            <Link
              key={c ?? 'all'}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={categoryHref(c) as any}
              className={
                'rounded-full border px-3 py-1 text-xs ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted')
              }
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <p className="text-muted-foreground text-xs">{countLabel}</p>

      {items.length === 0 ? (
        <div className="border-border bg-card rounded-xl border p-10 text-center">
          <p className="text-foreground text-sm">
            {t.pagesDash.assesmen.emptyTitle}
          </p>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/assesmen' as any}
            className="text-primary mt-2 inline-block text-sm underline"
          >
            {t.pagesDash.assesmen.resetFilter}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const Icon = CATEGORY_ICONS[a.category] ?? Wrench
            const passed = passedSet.has(a.id)
            return (
              <li key={a.id}>
                <article className="border-border bg-card hover:border-primary/40 hover:shadow-md flex h-full flex-col rounded-xl border p-5 transition">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="bg-muted text-foreground grid size-10 place-items-center rounded-lg"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {passed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                        <BadgeCheck
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        {t.pagesDash.assesmen.passed}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading mt-3 text-base font-semibold leading-snug">
                    {a.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-relaxed">
                    {a.description}
                  </p>
                  <dl className="text-muted-foreground mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    <div className="inline-flex items-center gap-1">
                      <span className="font-medium">{t.pagesDash.assesmen.categoryLabel}</span>{' '}
                      {CATEGORY_LABELS[a.category] ?? a.category}
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <Timer className="h-3 w-3" aria-hidden="true" />
                      {a.durationMin} {t.pagesDash.assesmen.minutesSuffix}
                    </div>
                    <div>{a.questionCount} {t.pagesDash.assesmen.questionsSuffix}</div>
                    <div>{t.pagesDash.assesmen.passingScoreLabel.replace('{score}', String(a.passingScore))}</div>
                  </dl>
                  <div className="mt-4 flex-1" />
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/dashboard/assesmen/${a.slug}` as any}
                    className="bg-primary text-primary-foreground mt-3 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                  >
                    {passed ? t.pagesDash.assesmen.tryAgain : t.pagesDash.assesmen.tryButton}
                    <ChevronRight
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </Link>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label={t.pagesDash.assesmen.paginationLabel}
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
