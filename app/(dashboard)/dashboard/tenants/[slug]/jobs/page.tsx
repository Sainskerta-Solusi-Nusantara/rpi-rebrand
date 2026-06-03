import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Briefcase, Plus, FileSpreadsheet } from 'lucide-react'
import { JobStatus, Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { JobRowActions } from '@/components/organisms/tenant-job-row-actions'
import { parseQueryTerms } from '@/lib/search/relevance'

export const metadata = { title: 'Lowongan Tenant — Dasbor' }

const PAGE_SIZE = 20

const STATUSES: JobStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'PAUSED',
  'CLOSED',
  'ARCHIVED',
]

const STATUS_LABELS: Record<JobStatus, { label: string; tone: string }> = {
  DRAFT: { label: 'Draft', tone: 'bg-muted text-muted-foreground' },
  PUBLISHED: { label: 'Dipublikasikan', tone: 'bg-green-100 text-green-800' },
  PAUSED: { label: 'Dijeda', tone: 'bg-amber-100 text-amber-800' },
  CLOSED: { label: 'Ditutup', tone: 'bg-red-100 text-red-800' },
  ARCHIVED: { label: 'Diarsipkan', tone: 'bg-stone-200 text-stone-700' },
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Penuh waktu',
  PART_TIME: 'Paruh waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Freelance',
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

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

export default async function TenantJobsPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/jobs`)

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    notFound()
  }

  const canCreate = hasTenantPermission(globalRole, tenants, tenant.id, 'job.create')
  const canEdit = hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')
  const canPublish = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'job.publish',
  )
  const canDelete = hasTenantPermission(globalRole, tenants, tenant.id, 'job.delete')
  const canChangeStatus = canEdit || canPublish

  const statusRaw =
    typeof searchParams.status === 'string' ? searchParams.status : undefined
  const queryRaw =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : undefined
  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)
  const status =
    statusRaw && (STATUSES as string[]).includes(statusRaw)
      ? (statusRaw as JobStatus)
      : undefined
  const query = queryRaw && queryRaw.length > 0 ? queryRaw : undefined

  const terms = parseQueryTerms(query)
  const termFilters: Prisma.JobWhereInput[] = terms.map((term) => ({
    OR: [
      { title: { contains: term, mode: 'insensitive' as const } },
      { location: { contains: term, mode: 'insensitive' as const } },
      { tags: { has: term } },
    ],
  }))

  const where: Prisma.JobWhereInput = {
    tenantId: tenant.id,
    ...(status ? { status } : {}),
    ...(termFilters.length ? { AND: termFilters } : {}),
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        location: true,
        employmentType: true,
        views: true,
        publishedAt: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const sp: Record<string, string | undefined> = {
    status,
    q: query,
    page: String(page),
  }
  const baseHref = `/dashboard/tenants/${tenant.slug}/jobs`

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">Lowongan</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString('id-ID')} lowongan di{' '}
            <span className="font-medium text-foreground">{tenant.name}</span>.
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/jobs/import` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-foreground shadow-sm transition"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              Impor CSV
            </Link>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/jobs/new` as any}
              className="inline-flex items-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Buat lowongan
            </Link>
          </div>
        )}
      </header>

      <form
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action={baseHref as any}
        className="border-border bg-card grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-4"
      >
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="f-q" className="text-muted-foreground text-xs uppercase">
            Cari judul
          </label>
          <input
            id="f-q"
            name="q"
            type="text"
            defaultValue={query ?? ''}
            placeholder="contoh: backend engineer"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-status" className="text-muted-foreground text-xs uppercase">
            Status
          </label>
          <select
            id="f-status"
            name="status"
            defaultValue={status ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          >
            Filter
          </button>
          {(status || query) && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={baseHref as any}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="border-border overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Judul</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Lokasi</th>
              <th className="p-3 font-medium">Tipe</th>
              <th className="p-3 font-medium">Views</th>
              <th className="p-3 font-medium">Dipublikasi</th>
              <th className="p-3 font-medium">Lamaran</th>
              <th className="p-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {jobs.map((j) => {
              const s = STATUS_LABELS[j.status]
              return (
                <tr key={j.id}>
                  <td className="p-3">
                    {canEdit ? (
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={
                          `/dashboard/tenants/${tenant.slug}/jobs/${j.id}/edit` as any
                        }
                        className="text-foreground hover:text-primary font-medium"
                      >
                        {j.title}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium">{j.title}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{j.location}</td>
                  <td className="p-3 text-xs">
                    {EMPLOYMENT_LABELS[j.employmentType] ?? j.employmentType}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {j.views.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs">
                    {j.publishedAt ? dateFmt.format(j.publishedAt) : '—'}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {j._count.applications.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right">
                    {canEdit || canChangeStatus || canDelete ? (
                      <JobRowActions
                        tenantSlug={tenant.slug}
                        jobId={j.id}
                        currentStatus={j.status}
                        canEdit={canEdit}
                        canChangeStatus={canChangeStatus}
                        canPublish={canPublish}
                        canDelete={canDelete}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {jobs.length === 0 && (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={8}>
                  Tidak ada lowongan yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref(baseHref, sp, { page: String(page - 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              ← Sebelumnya
            </Link>
          )}
          {page < totalPages && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref(baseHref, sp, { page: String(page + 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              Selanjutnya →
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
