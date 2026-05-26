import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { CourseCard } from '@/components/molecules/course-card'
import {
  type CourseLevel,
  getCoursesPage,
} from '@/lib/courses-data'

export const metadata: Metadata = {
  title: 'Kursus & Pelatihan',
  description:
    'Tingkatkan keterampilan dengan kursus terstruktur, sertifikat, dan jalur karier yang dirancang untuk pekerja Indonesia.',
}

const LEVELS: { v: '' | CourseLevel; l: string }[] = [
  { v: '', l: 'Semua Tingkat' },
  { v: 'beginner', l: 'Pemula' },
  { v: 'intermediate', l: 'Menengah' },
  { v: 'advanced', l: 'Lanjutan' },
]

type CoursesState = {
  level: '' | CourseLevel
  q?: string
  page: number
}

function buildCoursesUrl(
  current: CoursesState,
  patch: Partial<{
    level: '' | CourseLevel
    q: string | null
    page: number
    keepPage: boolean
  }>,
): string {
  const next = {
    level: patch.level ?? current.level,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    page: patch.page ?? (patch.keepPage ? current.page : 1),
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.level) params.push(`level=${next.level}`)
  if (next.page > 1) params.push(`page=${next.page}`)
  return params.length ? `/courses?${params.join('&')}` : '/courses'
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rawLevel =
    typeof searchParams.level === 'string' ? searchParams.level.toLowerCase() : ''
  const level: '' | CourseLevel =
    rawLevel === 'beginner' || rawLevel === 'intermediate' || rawLevel === 'advanced'
      ? rawLevel
      : ''
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const pageParam =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const activePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const current: CoursesState = {
    level,
    q: activeQuery || undefined,
    page: activePage,
  }
  const result = await getCoursesPage(
    {
      ...(level ? { level } : {}),
      ...(activeQuery ? { q: activeQuery } : {}),
    },
    activePage,
  )
  const courses = result.items
  const totalPages = result.totalPages

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Kursus & Pelatihan</h1>
        <p className="text-muted-foreground mt-2">
          {result.total.toLocaleString('id-ID')} kursus tersedia
          {activeQuery && (
            <>
              {' '}untuk &ldquo;
              <strong className="text-foreground font-medium">{activeQuery}</strong>
              &rdquo;
            </>
          )}
          {totalPages > 1 && (
            <>
              {' '}· halaman{' '}
              <strong className="text-foreground font-medium">{activePage}</strong>{' '}
              dari {totalPages}
            </>
          )}
        </p>

        {/* Search form — submits as GET, preserves level via hidden input */}
        <form method="get" action="/courses" className="mt-5 max-w-2xl">
          <div className="border-border bg-card focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery}
              placeholder="Cari kursus, topik, atau instruktur…"
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label="Cari kursus"
            />
            {activeQuery && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={buildCoursesUrl(current, { q: null }) as any}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                <X className="h-3 w-3" aria-hidden />
                Bersihkan
              </Link>
            )}
            <button
              type="submit"
              className="bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition hover:opacity-90"
            >
              Cari
            </button>
          </div>
          {/* Preserve other filters on submit */}
          {level && <input type="hidden" name="level" value={level} />}
        </form>
      </header>

      <nav aria-label="Tingkat" className="mb-8 flex flex-wrap gap-2 text-sm">
        {LEVELS.map((opt) => {
          const active = level === opt.v
          return (
            <Link
              key={opt.v || 'all'}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildCoursesUrl(current, { level: opt.v }) as any}
              className={
                active
                  ? 'border-primary bg-primary text-primary-foreground rounded-full border px-3 py-1'
                  : 'border-border bg-background hover:border-[color:var(--ring)] rounded-full border px-3 py-1 transition'
              }
              aria-current={active ? 'true' : undefined}
            >
              {opt.l}
            </Link>
          )
        })}
      </nav>

      {courses.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-12 text-center">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            Tidak ada kursus
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {activeQuery
              ? `Tidak ada kursus yang cocok dengan "${activeQuery}".`
              : level
                ? 'Belum ada kursus di tingkat ini.'
                : 'Belum ada kursus terdaftar.'}
          </p>
          {(level || activeQuery) && (
            <Link
              href="/courses"
              className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
            >
              Bersihkan filter
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/courses/${c.slug}`} className="block">
                <CourseCard
                  title={c.title}
                  instructor={c.instructor.name}
                  level={c.level}
                  durationHours={c.durationHours}
                  lessonsCount={c.lessonsCount}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <CoursesPagination
          current={current}
          page={activePage}
          totalPages={totalPages}
        />
      )}
    </div>
  )
}

function CoursesPagination({
  current,
  page,
  totalPages,
}: {
  current: CoursesState
  page: number
  totalPages: number
}) {
  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  const pages: (number | 'ellipsis')[] = []
  const window = 1
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-2 text-sm"
    >
      <PageLink current={current} page={prevPage} disabled={page === 1} aria="Sebelumnya">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Sebelumnya</span>
      </PageLink>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-xs">
            …
          </span>
        ) : (
          <PageLink
            key={p}
            current={current}
            page={p}
            active={p === page}
            aria={`Halaman ${p}`}
          >
            {p}
          </PageLink>
        ),
      )}

      <PageLink
        current={current}
        page={nextPage}
        disabled={page === totalPages}
        aria="Berikutnya"
      >
        <span className="hidden sm:inline">Berikutnya</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </PageLink>
    </nav>
  )
}

function PageLink({
  current,
  page,
  active,
  disabled,
  aria,
  children,
}: {
  current: CoursesState
  page: number
  active?: boolean
  disabled?: boolean
  aria: string
  children: React.ReactNode
}) {
  const className = active
    ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium'
    : disabled
      ? 'border-border text-muted-foreground/40 inline-flex min-w-[36px] cursor-not-allowed items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm'
      : 'border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex min-w-[36px] items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm transition'
  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={buildCoursesUrl(current, { page, keepPage: true }) as any}
      className={className}
      aria-label={aria}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}
