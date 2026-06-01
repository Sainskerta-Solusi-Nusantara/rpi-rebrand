import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FileText, LayoutGrid } from 'lucide-react'
import { ApplicationStatus, Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { BulkScreeningButton } from '@/components/organisms/bulk-screening-button'
import {
  ApplicationsCheckboxList,
  type ApplicationRow,
} from '@/components/organisms/applications-checkbox-list'

export const metadata = { title: 'Lamaran Tenant — Dasbor' }

const PAGE_SIZE = 25

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Dilamar',
  REVIEWED: 'Ditinjau',
  SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Wawancara',
  OFFERED: 'Penawaran',
  HIRED: 'Diterima',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Dibatalkan',
}

// Options surfaced in the inline recruiter dropdown (no WITHDRAWN — that's
// a candidate-side action and the server action rejects it).
const SELECT_OPTIONS = (
  [
    'APPLIED',
    'REVIEWED',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFERED',
    'HIRED',
    'REJECTED',
  ] as const
).map((v) => ({ value: v, label: STATUS_LABELS[v] }))

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

const STATUS_KEYS = Object.keys(STATUS_LABELS) as ApplicationStatus[]

export default async function TenantApplicationsPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/lamaran`,
  )

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

  const canManage = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'job.update',
  )

  const statusFilterRaw =
    typeof searchParams.status === 'string' ? searchParams.status : undefined
  const statusFilter =
    statusFilterRaw && STATUS_KEYS.includes(statusFilterRaw as ApplicationStatus)
      ? (statusFilterRaw as ApplicationStatus)
      : undefined

  const jobIdFilter =
    typeof searchParams.jobId === 'string' && searchParams.jobId.trim()
      ? searchParams.jobId.trim()
      : undefined

  const search =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''

  const minScoreRaw =
    typeof searchParams.minScore === 'string'
      ? Number(searchParams.minScore)
      : NaN
  const minScore =
    Number.isFinite(minScoreRaw) && minScoreRaw >= 0 && minScoreRaw <= 100
      ? Math.floor(minScoreRaw)
      : undefined

  const sortByScore =
    typeof searchParams.sort === 'string' && searchParams.sort === 'score'

  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const where: Prisma.ApplicationWhereInput = { tenantId: tenant.id }
  if (statusFilter) where.status = statusFilter
  if (jobIdFilter) where.jobId = jobIdFilter
  if (typeof minScore === 'number') where.aiScore = { gte: minScore }
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  // Sort priority — recruiters care most about REVIEWED/SHORTLISTED, then HIRED,
  // then everything else, with REJECTED/WITHDRAWN at the bottom. We do priority
  // in JS after fetching the page; secondary order is appliedAt desc.
  const PRIORITY: Record<ApplicationStatus, number> = {
    REVIEWED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 1,
    OFFERED: 1,
    APPLIED: 2,
    HIRED: 3,
    REJECTED: 4,
    WITHDRAWN: 4,
  }

  // Bulk-toolbar feed data — only loaded when the recruiter can act on it.
  // We keep selects lean; the toolbar only needs id+label per option.
  const [jobs, total, rawItems, templatesRaw, reviewersRaw] = await Promise.all([
    prisma.job
      .findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
        take: 200,
      })
      .catch(() => []),
    prisma.application.count({ where }).catch(() => 0),
    prisma.application
      .findMany({
        where,
        orderBy: sortByScore
          ? [{ aiScore: { sort: 'desc', nulls: 'last' } }, { appliedAt: 'desc' }]
          : [{ appliedAt: 'desc' }],
        skip: Math.max(0, (page - 1) * PAGE_SIZE),
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          updatedAt: true,
          aiScore: true,
          aiTags: true,
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          job: { select: { id: true, title: true, slug: true } },
        },
      })
      .catch(() => []),
    canManage
      ? prisma.tenantEmailTemplate
          .findMany({
            where: { tenantId: tenant.id, enabled: true },
            select: { id: true, status: true, subject: true },
            orderBy: { status: 'asc' },
          })
          .catch(() => [])
      : Promise.resolve([] as Array<{ id: string; status: string; subject: string }>),
    canManage
      ? prisma.userTenant
          .findMany({
            where: {
              tenantId: tenant.id,
              role: { in: ['OWNER', 'ADMIN', 'RECRUITER'] },
              status: 'active',
            },
            select: {
              userId: true,
              user: { select: { id: true, name: true, email: true } },
            },
            take: 200,
          })
          .catch(
            () =>
              [] as Array<{
                userId: string
                user: { id: string; name: string | null; email: string }
              }>,
          )
      : Promise.resolve(
          [] as Array<{
            userId: string
            user: { id: string; name: string | null; email: string }
          }>,
        ),
  ])

  // When a single status filter is active, or the user explicitly asked to
  // sort by AI score, ordering is already meaningful from the DB query;
  // otherwise apply the priority grouping.
  const items =
    statusFilter || sortByScore
      ? rawItems
      : [...rawItems].sort((a, b) => {
          const pa = PRIORITY[a.status]
          const pb = PRIORITY[b.status]
          if (pa !== pb) return pa - pb
          return b.appliedAt.getTime() - a.appliedAt.getTime()
        })

  // Shape rows for the client checkbox list. Dates are serialized to ISO so
  // the client receives plain JSON (Date objects don't survive the server →
  // client boundary cleanly without conversion).
  const rows: ApplicationRow[] = items.map((a) => ({
    id: a.id,
    status: a.status,
    appliedAt: a.appliedAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    aiScore: a.aiScore,
    aiTags: a.aiTags,
    user: {
      id: a.user.id,
      name: a.user.name,
      email: a.user.email,
      image: a.user.image,
    },
    job: { id: a.job.id, title: a.job.title, slug: a.job.slug },
  }))

  // Bulk-toolbar status options exclude WITHDRAWN (candidate-only).
  const bulkStatuses = SELECT_OPTIONS.map((o) => ({
    value: o.value as ApplicationStatus,
    label: o.label,
  }))
  const bulkTemplates = templatesRaw.map((t) => ({
    id: t.id,
    label: `${STATUS_LABELS[t.status as ApplicationStatus] ?? t.status}: ${t.subject}`,
  }))
  const bulkReviewers = reviewersRaw.map((m) => ({
    id: m.user.id,
    label: m.user.name ?? m.user.email,
  }))

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const sp: Record<string, string | undefined> = {
    status: statusFilter,
    jobId: jobIdFilter,
    q: search || undefined,
    minScore: typeof minScore === 'number' ? String(minScore) : undefined,
    sort: sortByScore ? 'score' : undefined,
    page: String(page),
  }
  const baseHref = `/dashboard/tenants/${tenant.slug}/lamaran`

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
            <FileText className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">
              Lamaran Masuk
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString('id-ID')} lamaran tercatat untuk{' '}
            <span className="text-foreground font-medium">{tenant.name}</span>.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2">
            {jobIdFilter ? (
              <BulkScreeningButton
                tenantSlug={tenant.slug}
                jobId={jobIdFilter}
                jobTitle={
                  jobs.find((j) => j.id === jobIdFilter)?.title ?? 'Lowongan'
                }
              />
            ) : null}
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={
                buildHref(
                  `/dashboard/tenants/${tenant.slug}/lamaran/kanban`,
                  { jobId: jobIdFilter, q: search || undefined },
                  {},
                ) as any
              }
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
              Tampilan Kanban
            </Link>
          </div>
        ) : null}
      </header>

      <form
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action={baseHref as any}
        className="border-border bg-card grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-4"
      >
        <div className="space-y-1">
          <label
            htmlFor="f-status"
            className="text-muted-foreground text-xs uppercase"
          >
            Status
          </label>
          <select
            id="f-status"
            name="status"
            defaultValue={statusFilter ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Semua status</option>
            {STATUS_KEYS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="f-job"
            className="text-muted-foreground text-xs uppercase"
          >
            Lowongan
          </label>
          <select
            id="f-job"
            name="jobId"
            defaultValue={jobIdFilter ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Semua lowongan</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label
            htmlFor="f-q"
            className="text-muted-foreground text-xs uppercase"
          >
            Cari pelamar
          </label>
          <input
            id="f-q"
            name="q"
            type="text"
            defaultValue={search}
            placeholder="Nama atau email pelamar"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="f-min-score"
            className="text-muted-foreground text-xs uppercase"
          >
            Min AI score
          </label>
          <input
            id="f-min-score"
            name="minScore"
            type="number"
            min={0}
            max={100}
            step={5}
            defaultValue={typeof minScore === 'number' ? minScore : ''}
            placeholder="0 - 100"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="f-sort"
            className="text-muted-foreground text-xs uppercase"
          >
            Urutkan
          </label>
          <select
            id="f-sort"
            name="sort"
            defaultValue={sortByScore ? 'score' : ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Prioritas status</option>
            <option value="score">Skor AI tertinggi</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-4">
          <button
            type="submit"
            className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          >
            Terapkan filter
          </button>
          {(statusFilter ||
            jobIdFilter ||
            search ||
            typeof minScore === 'number' ||
            sortByScore) && (
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

      <ApplicationsCheckboxList
        tenantSlug={tenant.slug}
        rows={rows}
        statusOptions={SELECT_OPTIONS}
        availableStatuses={bulkStatuses}
        availableTemplates={bulkTemplates}
        availableReviewers={bulkReviewers}
        canManage={canManage}
      />

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
