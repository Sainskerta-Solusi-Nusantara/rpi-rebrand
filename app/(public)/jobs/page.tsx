import type { Metadata } from 'next'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-32 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JobCard: any = safeRequire('@/components/molecules/job-card', 'JobCard')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CheckboxList: any = safeRequire('@/components/molecules/checkbox-list', 'CheckboxList')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PriceRangeSlider: any = safeRequire('@/components/molecules/price-range-slider', 'PriceRangeSlider')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Pagination: any = safeRequire('@/components/molecules/pagination', 'Pagination')

export const metadata: Metadata = {
  title: 'Cari Lowongan Pekerjaan',
  description:
    'Telusuri ribuan lowongan kerja terverifikasi di seluruh Indonesia. Saring berdasarkan kategori, lokasi, jenis pekerjaan, dan rentang gaji.',
}

const PAGE_SIZE = 20

function parseList(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : v.split(',').filter(Boolean)
}

function parseNumber(v: string | string[] | undefined): number | undefined {
  if (!v) return undefined
  const s = Array.isArray(v) ? v[0] : v
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

async function getTenantId(): Promise<string | null> {
  const slug = headers().get('x-tenant-slug')
  if (!slug) return null
  const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } }).catch(() => null)
  return t?.id ?? null
}

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const tenantId = await getTenantId()
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const categories = parseList(searchParams.category)
  const employmentTypes = parseList(searchParams.type)
  const locationTypes = parseList(searchParams.location)
  const experienceLevels = parseList(searchParams.level)
  const salaryMin = parseNumber(searchParams.salaryMin)
  const salaryMax = parseNumber(searchParams.salaryMax)
  const page = Math.max(1, parseNumber(searchParams.page) ?? 1)

  const where: Prisma.JobWhereInput = {
    status: 'PUBLISHED',
    ...(tenantId ? { tenantId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ],
        }
      : {}),
    ...(categories.length ? { category: { slug: { in: categories } } } : {}),
    ...(employmentTypes.length
      ? { employmentType: { in: employmentTypes as Prisma.JobWhereInput['employmentType'] extends infer X ? never : never } }
      : {}),
    ...(locationTypes.length
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ locationType: { in: locationTypes as any } } as Prisma.JobWhereInput)
      : {}),
    ...(experienceLevels.length
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ experienceLevel: { in: experienceLevels as any } } as Prisma.JobWhereInput)
      : {}),
    ...(salaryMin !== undefined ? { salaryMin: { gte: salaryMin } } : {}),
    ...(salaryMax !== undefined ? { salaryMax: { lte: salaryMax } } : {}),
  }
  // The above two ts-expect cast lanes for enums; Prisma client accepts the string values directly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (employmentTypes.length) (where as any).employmentType = { in: employmentTypes }

  const [jobs, total, allCategories] = await Promise.all([
    prisma.job
      .findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          locationType: true,
          employmentType: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          publishedAt: true,
          tags: true,
          tenant: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
      })
      .catch(() => []),
    prisma.job.count({ where }).catch(() => 0),
    prisma.jobCategory
      .findMany({
        where: { parentId: null },
        include: { _count: { select: { jobs: true } } },
        orderBy: { name: 'asc' },
      })
      .catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Lowongan Pekerjaan</h1>
        <p className="text-muted-foreground mt-2">
          {total.toLocaleString('id-ID')} lowongan tersedia
          {q ? ` untuk "${q}"` : ''}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filter" className="space-y-6">
          <Suspense fallback={<div className="bg-muted h-32 animate-pulse rounded-xl" />}>
            <CheckboxList
              name="category"
              label="Kategori"
              options={allCategories.map((c) => ({
                value: c.slug,
                label: c.name,
                count: c._count?.jobs ?? 0,
              }))}
              selected={categories}
            />
          </Suspense>
          <CheckboxList
            name="type"
            label="Jenis Pekerjaan"
            options={[
              { value: 'FULL_TIME', label: 'Penuh Waktu' },
              { value: 'PART_TIME', label: 'Paruh Waktu' },
              { value: 'CONTRACT', label: 'Kontrak' },
              { value: 'INTERNSHIP', label: 'Magang' },
              { value: 'FREELANCE', label: 'Lepas' },
            ]}
            selected={employmentTypes}
          />
          <CheckboxList
            name="location"
            label="Lokasi"
            options={[
              { value: 'ONSITE', label: 'Di Tempat' },
              { value: 'HYBRID', label: 'Hibrida' },
              { value: 'REMOTE', label: 'Jarak Jauh' },
            ]}
            selected={locationTypes}
          />
          <CheckboxList
            name="level"
            label="Tingkat Pengalaman"
            options={[
              { value: 'ENTRY', label: 'Pemula' },
              { value: 'JUNIOR', label: 'Junior' },
              { value: 'MID', label: 'Menengah' },
              { value: 'SENIOR', label: 'Senior' },
              { value: 'LEAD', label: 'Lead' },
              { value: 'EXECUTIVE', label: 'Eksekutif' },
            ]}
            selected={experienceLevels}
          />
          <PriceRangeSlider
            name="salary"
            label="Rentang Gaji (IDR/bulan)"
            min={0}
            max={50000000}
            step={500000}
            defaultMin={salaryMin}
            defaultMax={salaryMax}
          />
        </aside>

        <section aria-label="Daftar lowongan">
          {jobs.length === 0 ? (
            <div className="border-border rounded-xl border p-8 text-center">
              <p className="text-muted-foreground">
                Tidak ada lowongan yang cocok dengan filter saat ini.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {jobs.map((j) => (
                <li key={j.id}>
                  <JobCard job={j} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} />
          </div>
        </section>
      </div>
    </div>
  )
}
