import type { Metadata } from 'next'
import Link from 'next/link'
import { JobCard } from '@/components/molecules/job-card'
import { getAllJobs } from '@/lib/jobs-data'

export const metadata: Metadata = {
  title: 'Cari Lowongan Pekerjaan',
  description:
    'Telusuri ribuan lowongan kerja terverifikasi di seluruh Indonesia. Saring berdasarkan kategori, lokasi, jenis pekerjaan, dan rentang gaji.',
}

const CATEGORIES = [
  { label: 'IT & Software',    count: 312 },
  { label: 'Marketing',        count: 142 },
  { label: 'Finance',          count: 98  },
  { label: 'Human Resources',  count: 64  },
  { label: 'Engineering',      count: 121 },
  { label: 'Design',           count: 87  },
  { label: 'Sales',            count: 134 },
  { label: 'Healthcare',       count: 45  },
  { label: 'Education',        count: 52  },
  { label: 'Logistics',        count: 41  },
]

const EMPLOYMENT = ['Penuh Waktu', 'Paruh Waktu', 'Kontrak', 'Magang', 'Lepas']
const LOCATIONS = ['Di Tempat', 'Hibrida', 'Jarak Jauh']
const LEVELS = ['Pemula', 'Junior', 'Menengah', 'Senior', 'Lead', 'Eksekutif']

export default async function JobsListPage() {
  const jobs = await getAllJobs()
  const total = jobs.length

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Lowongan Pekerjaan</h1>
        <p className="text-muted-foreground mt-2">
          {total.toLocaleString('id-ID')} lowongan tersedia
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filter" className="space-y-8">
          <FilterGroup title="Kategori">
            {CATEGORIES.map((c) => (
              <FilterOption key={c.label} label={c.label} count={c.count} />
            ))}
          </FilterGroup>
          <FilterGroup title="Jenis Pekerjaan">
            {EMPLOYMENT.map((l) => (
              <FilterOption key={l} label={l} />
            ))}
          </FilterGroup>
          <FilterGroup title="Lokasi">
            {LOCATIONS.map((l) => (
              <FilterOption key={l} label={l} />
            ))}
          </FilterGroup>
          <FilterGroup title="Tingkat Pengalaman">
            {LEVELS.map((l) => (
              <FilterOption key={l} label={l} />
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

          <nav
            aria-label="Pagination"
            className="text-muted-foreground mt-10 flex items-center justify-center gap-2 text-sm"
          >
            <span className="border-border rounded-md border px-3 py-1.5">‹ Sebelumnya</span>
            <span className="border-primary bg-primary text-primary-foreground rounded-md border px-3 py-1.5 font-medium">
              1
            </span>
            <span className="border-border rounded-md border px-3 py-1.5">2</span>
            <span className="border-border rounded-md border px-3 py-1.5">3</span>
            <span className="px-2">…</span>
            <span className="border-border rounded-md border px-3 py-1.5">68</span>
            <span className="border-border rounded-md border px-3 py-1.5">Berikutnya ›</span>
          </nav>
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

function FilterOption({ label, count }: { label: string; count?: number }) {
  return (
    <label className="text-foreground/80 hover:text-foreground flex cursor-pointer items-center justify-between gap-2 text-sm">
      <span className="inline-flex items-center gap-2">
        <span className="border-border bg-background grid size-4 place-items-center rounded border" />
        {label}
      </span>
      {count != null && <span className="text-muted-foreground text-xs">{count}</span>}
    </label>
  )
}
