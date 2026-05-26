import type { Metadata } from 'next'
import Link from 'next/link'
import { X } from 'lucide-react'
import { JobCard } from '@/components/molecules/job-card'
import { getAllJobs, getJobCategories } from '@/lib/jobs-data'

export const metadata: Metadata = {
  title: 'Cari Lowongan Pekerjaan',
  description:
    'Telusuri ribuan lowongan kerja terverifikasi di seluruh Indonesia. Saring berdasarkan kategori, lokasi, jenis pekerjaan, dan rentang gaji.',
}

const EMPLOYMENT = ['Penuh Waktu', 'Paruh Waktu', 'Kontrak', 'Magang', 'Lepas']
const LOCATIONS = ['Di Tempat', 'Hibrida', 'Jarak Jauh']
const LEVELS = ['Pemula', 'Junior', 'Menengah', 'Senior', 'Lead', 'Eksekutif']

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const activeCategory =
    typeof searchParams.category === 'string' ? searchParams.category : undefined

  const [jobs, categories] = await Promise.all([
    getAllJobs({ categorySlug: activeCategory }),
    getJobCategories(),
  ])
  const total = jobs.length
  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name
    : undefined

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Lowongan Pekerjaan</h1>
        <p className="text-muted-foreground mt-2">
          {total.toLocaleString('id-ID')} lowongan tersedia
          {activeCategoryName && (
            <>
              {' '}di kategori{' '}
              <strong className="text-foreground font-medium">
                {activeCategoryName}
              </strong>
            </>
          )}
        </p>
        {activeCategoryName && (
          <Link
            href="/jobs"
            className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs font-medium"
          >
            <X className="h-3 w-3" aria-hidden />
            Bersihkan filter
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filter" className="space-y-8">
          <FilterGroup title="Kategori">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-xs">Belum ada kategori.</p>
            ) : (
              categories.map((c) => (
                <CategoryLink
                  key={c.slug}
                  slug={c.slug}
                  label={c.name}
                  count={c.count}
                  active={c.slug === activeCategory}
                />
              ))
            )}
          </FilterGroup>
          <FilterGroup title="Jenis Pekerjaan">
            {EMPLOYMENT.map((l) => (
              <DecorativeOption key={l} label={l} />
            ))}
          </FilterGroup>
          <FilterGroup title="Lokasi">
            {LOCATIONS.map((l) => (
              <DecorativeOption key={l} label={l} />
            ))}
          </FilterGroup>
          <FilterGroup title="Tingkat Pengalaman">
            {LEVELS.map((l) => (
              <DecorativeOption key={l} label={l} />
            ))}
          </FilterGroup>
          <FilterGroup title="Rentang Gaji (IDR/bulan)">
            <div className="text-muted-foreground text-xs">Rp 0 – Rp 50.000.000</div>
            <div className="bg-muted relative mt-3 h-1 rounded-full">
              <div className="bg-primary absolute left-[10%] right-[20%] h-1 rounded-full" />
            </div>
          </FilterGroup>
        </aside>

        <section aria-label="Daftar lowongan">
          {jobs.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                Tidak ada lowongan
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {activeCategoryName
                  ? `Belum ada lowongan di kategori ${activeCategoryName}.`
                  : 'Belum ada lowongan terdaftar.'}
              </p>
              {activeCategoryName && (
                <Link
                  href="/jobs"
                  className="text-foreground/80 hover:text-[color:var(--ring)] mt-4 inline-flex items-center gap-1 text-sm font-medium"
                >
                  Bersihkan filter
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.slug}`} className="block">
                    <JobCard
                      title={j.title}
                      company={j.company}
                      location={j.location}
                      locationType={j.locationType}
                      employmentType={j.employmentType}
                      salaryMin={j.salaryMin}
                      salaryMax={j.salaryMax}
                      tags={j.tags}
                      postedAt={j.postedAt}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CategoryLink({
  slug,
  label,
  count,
  active,
}: {
  slug: string
  label: string
  count: number
  active: boolean
}) {
  return (
    <Link
      href={active ? '/jobs' : `/jobs?category=${slug}`}
      className={
        active
          ? 'flex items-center justify-between gap-2 rounded-md bg-[color:var(--ring)]/10 px-2 py-1 text-sm font-medium text-[color:var(--ring)] transition'
          : 'text-foreground/80 hover:text-foreground flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-muted/50'
      }
      aria-current={active ? 'true' : undefined}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={
            active
              ? 'border-[color:var(--ring)] bg-[color:var(--ring)] grid size-4 place-items-center rounded border'
              : 'border-border bg-background grid size-4 place-items-center rounded border'
          }
        >
          {active && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-[color:var(--primary-foreground)] h-3 w-3"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
        {label}
      </span>
      <span
        className={
          active
            ? 'text-[color:var(--ring)] text-xs font-semibold'
            : 'text-muted-foreground text-xs'
        }
      >
        {count}
      </span>
    </Link>
  )
}

function DecorativeOption({ label }: { label: string }) {
  return (
    <label
      className="text-foreground/60 flex cursor-not-allowed items-center justify-between gap-2 text-sm"
      title="Filter ini belum aktif"
    >
      <span className="inline-flex items-center gap-2">
        <span className="border-border bg-background grid size-4 place-items-center rounded border" />
        {label}
      </span>
    </label>
  )
}
