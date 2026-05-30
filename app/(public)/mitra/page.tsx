import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import {
  MITRA_PAGE_SIZE,
  MITRA_PLAN_TIERS,
  type MitraSort,
  type Partner,
  getMitraIndustries,
  getMitraPage,
  getMitraStats,
  sanitizeMitraPlan,
  sanitizeMitraSort,
} from '@/lib/mitra-data'

export const metadata: Metadata = {
  title: 'Mitra Perekrut',
  description:
    'Bergabung dengan ratusan mitra perekrut terverifikasi yang memanfaatkan platform Rumah Pekerja Indonesia.',
}

type FilterState = {
  q?: string
  industry?: string
  plan?: Partner['planTier']
  sort: MitraSort
  page: number
}

function buildUrl(
  current: FilterState,
  patch: Partial<{
    q: string | null
    industry: string | null
    plan: Partner['planTier'] | null
    sort: MitraSort
    keepPage: boolean
    page: number
  }>,
): string {
  const next = {
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    industry:
      'industry' in patch ? patch.industry ?? undefined : current.industry,
    plan: 'plan' in patch ? patch.plan ?? undefined : current.plan,
    sort: patch.sort ?? current.sort,
    page: patch.page ?? (patch.keepPage ? current.page : 1),
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.industry) params.push(`industry=${encodeURIComponent(next.industry)}`)
  if (next.plan) params.push(`plan=${next.plan}`)
  if (next.sort !== 'newest') params.push(`sort=${next.sort}`)
  if (next.page > 1) params.push(`page=${next.page}`)
  return params.length ? `/mitra?${params.join('&')}` : '/mitra'
}

const SORT_OPTIONS: { value: MitraSort; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'alpha', label: 'A–Z' },
  { value: 'jobs-high', label: 'Lowongan ↓' },
  { value: 'jobs-low', label: 'Lowongan ↑' },
]

export default async function MitraPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeIndustryRaw =
    typeof searchParams.industry === 'string' ? searchParams.industry : undefined
  const activePlan = sanitizeMitraPlan(
    typeof searchParams.plan === 'string' ? searchParams.plan : undefined,
  )
  const activeSort = sanitizeMitraSort(
    typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  )
  const pageParam =
    typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const activePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const [pageResult, industries, stats] = await Promise.all([
    getMitraPage(
      {
        q: activeQuery || undefined,
        industry: activeIndustryRaw,
        plan: activePlan,
        sort: activeSort,
      },
      activePage,
    ),
    getMitraIndustries(),
    getMitraStats(),
  ])

  const partners = pageResult.items
  const total = pageResult.total
  const totalPages = pageResult.totalPages
  const safePage = pageResult.page

  // Drop ?industry= if the active value isn't in the current set (avoids
  // showing a chip for a stale industry).
  const activeIndustry = industries.some((i) => i.name === activeIndustryRaw)
    ? activeIndustryRaw
    : undefined

  const current: FilterState = {
    q: activeQuery || undefined,
    industry: activeIndustry,
    plan: activePlan,
    sort: activeSort,
    page: safePage,
  }
  const hasAnyFilter =
    !!activeQuery || !!activeIndustry || !!activePlan

  const paginationLinks = buildPaginationLinks(current, safePage, totalPages)

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8 text-center">
        <h1 className="font-heading text-3xl md:text-5xl">Mitra Perekrut Kami</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {stats.activeTenants.toLocaleString('id-ID')} perusahaan mempercayakan
          rekrutmen mereka kepada Rumah Pekerja Indonesia, dengan{' '}
          {stats.publishedJobs.toLocaleString('id-ID')} lowongan aktif.
        </p>

        <form method="get" action="/mitra" className="mx-auto mt-6 max-w-xl">
          <div className="border-border bg-card focus-within:border-[color:var(--ring)] flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery}
              placeholder="Cari nama mitra…"
              className="placeholder:text-muted-foreground/70 text-foreground w-full bg-transparent text-sm outline-none"
              aria-label="Cari mitra perekrut"
            />
            {activeQuery && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={buildUrl(current, { q: null }) as any}
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
          {activeIndustry && (
            <input type="hidden" name="industry" value={activeIndustry} />
          )}
          {activePlan && <input type="hidden" name="plan" value={activePlan} />}
          {activeSort !== 'newest' && (
            <input type="hidden" name="sort" value={activeSort} />
          )}
        </form>

        {hasAnyFilter && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {activeQuery && (
              <FilterChip
                label={`"${activeQuery}"`}
                clearHref={buildUrl(current, { q: null })}
              />
            )}
            {activeIndustry && (
              <FilterChip
                label={activeIndustry}
                clearHref={buildUrl(current, { industry: null })}
              />
            )}
            {activePlan && (
              <FilterChip
                label={
                  MITRA_PLAN_TIERS.find((t) => t.value === activePlan)?.label ??
                  activePlan
                }
                clearHref={buildUrl(current, { plan: null })}
              />
            )}
            <Link
              href="/mitra"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
            >
              <X className="h-3 w-3" aria-hidden />
              Bersihkan semua
            </Link>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filter" className="space-y-8">
          <FilterGroup title="Industri">
            {industries.length === 0 ? (
              <p className="text-muted-foreground text-xs">Belum ada data.</p>
            ) : (
              industries.map((i) => (
                <ToggleRow
                  key={i.name}
                  label={i.name}
                  count={i.count}
                  active={i.name === activeIndustry}
                  href={
                    i.name === activeIndustry
                      ? buildUrl(current, { industry: null })
                      : buildUrl(current, { industry: i.name })
                  }
                />
              ))
            )}
          </FilterGroup>

          <FilterGroup title="Plan Tier">
            {MITRA_PLAN_TIERS.map((t) => {
              const active = activePlan === t.value
              return (
                <ToggleRow
                  key={t.value}
                  label={t.label}
                  active={active}
                  href={
                    active
                      ? buildUrl(current, { plan: null })
                      : buildUrl(current, { plan: t.value })
                  }
                />
              )
            })}
          </FilterGroup>
        </aside>

        <section aria-label="Daftar mitra">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {total.toLocaleString('id-ID')} mitra
              {totalPages > 1 && (
                <>
                  {' '}· halaman{' '}
                  <strong className="text-foreground font-medium">{safePage}</strong>
                  {' '}dari {totalPages}
                </>
              )}
            </p>
            {partners.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                  Urutkan
                </span>
                {SORT_OPTIONS.map((o) => {
                  const active = activeSort === o.value
                  return (
                    <Link
                      key={o.value}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={buildUrl(current, { sort: o.value }) as any}
                      aria-current={active ? 'true' : undefined}
                      className={
                        active
                          ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition'
                          : 'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center rounded-full border px-3 py-1 text-xs transition'
                      }
                    >
                      {o.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {partners.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                Tidak ada mitra
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {hasAnyFilter
                  ? 'Belum ada mitra yang cocok dengan filter saat ini.'
                  : 'Belum ada mitra terdaftar.'}
              </p>
              {hasAnyFilter && (
                <Link
                  href="/mitra"
                  className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
                >
                  Bersihkan filter
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {partners.map((p) => (
                <li
                  key={p.id}
                  className="border-border bg-card rounded-xl border p-6 text-center transition hover:shadow-md"
                >
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/mitra/${p.slug}` as any}
                  >
                    <div
                      className="mx-auto mb-3 grid size-14 place-items-center rounded-lg"
                      style={{ background: p.primaryColor, color: '#fff' }}
                      aria-hidden
                    >
                      <span className="font-heading text-2xl">{p.name[0]}</span>
                    </div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {p.industry}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {p.jobsCount} lowongan aktif
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {paginationLinks.length > 0 && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
            >
              {paginationLinks.map((link, idx) => {
                if (link.kind === 'ellipsis') {
                  return (
                    <span
                      key={`el-${idx}`}
                      className="text-muted-foreground px-2 text-sm"
                    >
                      …
                    </span>
                  )
                }
                if (link.kind === 'prev' || link.kind === 'next') {
                  const Icon = link.kind === 'prev' ? ChevronLeft : ChevronRight
                  return link.disabled ? (
                    <span
                      key={link.kind}
                      className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs opacity-50"
                      aria-disabled="true"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {link.kind === 'prev' ? 'Sebelumnya' : 'Berikutnya'}
                    </span>
                  ) : (
                    <Link
                      key={link.kind}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={link.href as any}
                      className="border-border hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {link.kind === 'prev' ? 'Sebelumnya' : 'Berikutnya'}
                    </Link>
                  )
                }
                if (link.kind === 'page') {
                  return (
                    <Link
                      key={`p-${link.page}`}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={link.href as any}
                      aria-current={link.active ? 'page' : undefined}
                      className={
                        link.active
                          ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium'
                          : 'border-border hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs transition'
                      }
                    >
                      {link.page}
                    </Link>
                  )
                }
                return null
              })}
            </nav>
          )}
        </section>
      </div>

      <section className="border-border bg-muted/30 mt-16 rounded-2xl border p-10 text-center">
        <h2 className="font-heading text-2xl md:text-3xl">Jadi Mitra Perekrut</h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Pasang lowongan, kelola talent pool, dan bangun brand karier Anda di platform yang fokus
          pada pekerja Indonesia.
        </p>
        <a
          href="/register?role=partner"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded-md px-6 py-3 font-medium"
        >
          Daftar Sebagai Mitra
        </a>
      </section>
    </div>
  )
}

function FilterChip({
  label,
  clearHref,
}: {
  label: string
  clearHref: string
}) {
  return (
    <span className="border-border bg-muted/40 text-foreground/85 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
      {label}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={clearHref as any}
        aria-label={`Hapus filter ${label}`}
        className="text-muted-foreground hover:text-foreground -mr-0.5 inline-flex"
      >
        <X className="h-3 w-3" aria-hidden />
      </Link>
    </span>
  )
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  count,
  active,
  href,
}: {
  label: string
  count?: number
  active: boolean
  href: string
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={href as any}
      aria-current={active ? 'true' : undefined}
      className={
        active
          ? 'text-[color:var(--ring)] flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium'
          : 'text-foreground/80 hover:text-[color:var(--ring)] flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition'
      }
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="text-muted-foreground ml-2 text-xs">{count}</span>
      )}
    </Link>
  )
}

type PaginationLink =
  | { kind: 'page'; page: number; active: boolean; href: string }
  | { kind: 'ellipsis' }
  | { kind: 'prev' | 'next'; disabled: boolean; href: string }

function buildPaginationLinks(
  current: FilterState,
  page: number,
  totalPages: number,
): PaginationLink[] {
  if (totalPages <= 1) return []
  const links: PaginationLink[] = []

  links.push({
    kind: 'prev',
    disabled: page === 1,
    href: buildUrl(current, {
      page: Math.max(1, page - 1),
      keepPage: true,
    }),
  })

  const window = 1
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      links.push({
        kind: 'page',
        page: p,
        active: p === page,
        href: buildUrl(current, { page: p, keepPage: true }),
      })
    } else if (links[links.length - 1]?.kind !== 'ellipsis') {
      links.push({ kind: 'ellipsis' })
    }
  }

  links.push({
    kind: 'next',
    disabled: page === totalPages,
    href: buildUrl(current, {
      page: Math.min(totalPages, page + 1),
      keepPage: true,
    }),
  })

  return links
}
