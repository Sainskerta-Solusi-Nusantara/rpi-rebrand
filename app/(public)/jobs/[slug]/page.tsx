import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

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
const ApplyButton: any = safeRequire('@/components/molecules/apply-button', 'ApplyButton')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SaveJobButton: any = safeRequire('@/components/molecules/save-job-button', 'SaveJobButton')

async function resolveTenantId(): Promise<string | null> {
  const slug = headers().get('x-tenant-slug')
  if (!slug) return null
  const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } }).catch(() => null)
  return t?.id ?? null
}

async function findJob(slug: string) {
  const tenantId = await resolveTenantId()
  const job = await prisma.job
    .findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        postedBy: { select: { name: true, image: true } },
      },
    })
    .catch(() => null)
  return job
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const job = await findJob(params.slug)
  if (!job) return { title: 'Lowongan Tidak Ditemukan' }
  return {
    title: `${job.title} — ${job.tenant.name}`,
    description: job.description.slice(0, 160),
    openGraph: {
      title: `${job.title} — ${job.tenant.name}`,
      description: job.description.slice(0, 160),
      type: 'article',
    },
  }
}

function fmtIDR(n?: number | null) {
  if (n == null) return null
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: 'Penuh Waktu',
  PART_TIME: 'Paruh Waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Lepas',
}
const locationTypeLabels: Record<string, string> = {
  ONSITE: 'Di Tempat',
  HYBRID: 'Hibrida',
  REMOTE: 'Jarak Jauh',
}

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
  const job = await findJob(params.slug)
  if (!job) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt?.toISOString(),
    validThrough: job.expiredAt?.toISOString(),
    employmentType: job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.tenant.name,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'ID',
      },
    },
    ...(job.salaryMin && job.salaryMax
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency,
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: 'MONTH',
            },
          },
        }
      : {}),
  }

  return (
    <article className="mx-auto w-full max-w-7xl px-6 py-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-border border-b pb-6 mb-8">
        <div className="text-muted-foreground text-sm">
          {job.category?.name ?? 'Lowongan'}
        </div>
        <h1 className="font-heading text-3xl md:text-4xl mt-2">{job.title}</h1>
        <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{job.tenant.name}</span>
          <span>{job.location} • {locationTypeLabels[job.locationType] ?? job.locationType}</span>
          <span>{employmentTypeLabels[job.employmentType] ?? job.employmentType}</span>
          {job.salaryMin && job.salaryMax ? (
            <span>
              {fmtIDR(job.salaryMin)} – {fmtIDR(job.salaryMax)}/bulan
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex gap-3">
          <ApplyButton jobId={job.id} />
          <SaveJobButton jobId={job.id} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <div className="prose prose-neutral max-w-none">
          <section>
            <h2 className="font-heading text-2xl">Deskripsi</h2>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </section>
          {job.responsibilities ? (
            <section className="mt-8">
              <h2 className="font-heading text-2xl">Tanggung Jawab</h2>
              <p className="whitespace-pre-wrap">{job.responsibilities}</p>
            </section>
          ) : null}
          {job.requirements ? (
            <section className="mt-8">
              <h2 className="font-heading text-2xl">Kualifikasi</h2>
              <p className="whitespace-pre-wrap">{job.requirements}</p>
            </section>
          ) : null}
          {job.benefits ? (
            <section className="mt-8">
              <h2 className="font-heading text-2xl">Tunjangan</h2>
              <p className="whitespace-pre-wrap">{job.benefits}</p>
            </section>
          ) : null}
        </div>

        <aside aria-label="Ringkasan" className="border-border rounded-xl border p-6 h-fit">
          <h3 className="font-heading text-lg mb-4">Ringkasan</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tingkat</dt>
              <dd className="font-medium">{job.experienceLevel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lokasi</dt>
              <dd className="font-medium">{job.location}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Diposting</dt>
              <dd className="font-medium">
                {job.publishedAt
                  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(job.publishedAt)
                  : '—'}
              </dd>
            </div>
            {job.tags?.length ? (
              <div>
                <dt className="text-muted-foreground">Tag</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {job.tags.map((t) => (
                    <span key={t} className="bg-muted rounded-md px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </article>
  )
}
