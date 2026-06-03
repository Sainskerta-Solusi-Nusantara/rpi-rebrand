import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, GraduationCap, Plus, FileSpreadsheet } from 'lucide-react'
import { CourseLevel, CourseStatus, Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { CourseRowActions } from '@/components/organisms/tenant-course-row-actions'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { parseQueryTerms } from '@/lib/search/relevance'

export const metadata = { title: 'Kursus Tenant — Dasbor' }

const PAGE_SIZE = 20

const STATUSES: CourseStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

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

export default async function TenantCoursesPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getServerT()
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/kursus`)

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'course.view')) {
    notFound()
  }

  const canCreate = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'course.create',
  )
  const canEdit = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'course.update',
  )
  const canDelete = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'course.delete',
  )
  const canChangeStatus = canEdit

  const statusRaw =
    typeof searchParams.status === 'string' ? searchParams.status : undefined
  const queryRaw =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : undefined
  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)
  const status =
    statusRaw && (STATUSES as string[]).includes(statusRaw)
      ? (statusRaw as CourseStatus)
      : undefined
  const query = queryRaw && queryRaw.length > 0 ? queryRaw : undefined

  const STATUS_LABELS: Record<CourseStatus, { label: string; tone: string }> = {
    DRAFT: { label: t.pagesTenant2.coursesList.statusDraft, tone: 'bg-muted text-muted-foreground' },
    PUBLISHED: { label: t.pagesTenant2.coursesList.statusPublished, tone: 'bg-green-100 text-green-800' },
    ARCHIVED: { label: t.pagesTenant2.coursesList.statusArchived, tone: 'bg-stone-200 text-stone-700' },
  }

  const LEVEL_LABELS: Record<CourseLevel, string> = {
    BEGINNER: t.pagesTenant2.coursesList.levelBeginner,
    INTERMEDIATE: t.pagesTenant2.coursesList.levelIntermediate,
    ADVANCED: t.pagesTenant2.coursesList.levelAdvanced,
  }

  const terms = parseQueryTerms(query)

  const courseAnd: Prisma.CourseWhereInput[] = terms.map((term) => ({
    OR: [
      { title: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
    ],
  }))

  const where: Prisma.CourseWhereInput = {
    tenantId: tenant.id,
    ...(status ? { status } : {}),
    ...(courseAnd.length ? { AND: courseAnd } : {}),
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        level: true,
        durationHours: true,
        publishedAt: true,
        createdAt: true,
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.course.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const sp: Record<string, string | undefined> = {
    status,
    q: query,
    page: String(page),
  }
  const baseHref = `/dashboard/tenants/${tenant.slug}/kursus`

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant2.coursesList.backTo.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">{t.pagesTenant2.coursesList.heading}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {t.pagesTenant2.coursesList.totalDesc.replace('{total}', total.toLocaleString('id-ID'))}{' '}
            <span className="font-medium text-foreground">{tenant.name}</span>.
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/kursus/import` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-foreground shadow-sm transition"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant2.coursesList.importCsv}
            </Link>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/kursus/new` as any}
              className="inline-flex items-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant2.coursesList.createCourse}
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
            {t.pagesTenant2.coursesList.filterLabelSearch}
          </label>
          <input
            id="f-q"
            name="q"
            type="text"
            defaultValue={query ?? ''}
            placeholder={t.pagesTenant2.coursesList.filterPlaceholder}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-status" className="text-muted-foreground text-xs uppercase">
            {t.pagesTenant2.coursesList.filterLabelStatus}
          </label>
          <select
            id="f-status"
            name="status"
            defaultValue={status ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">{t.pagesTenant2.coursesList.filterAllStatus}</option>
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
            {t.pagesTenant2.coursesList.filterSubmit}
          </button>
          {(status || query) && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={baseHref as any}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              {t.pagesTenant2.coursesList.filterReset}
            </Link>
          )}
        </div>
      </form>

      <div className="border-border overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colTitle}</th>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colLevel}</th>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colDuration}</th>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colInstructor}</th>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colStatus}</th>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colEnrollments}</th>
              <th className="p-3 font-medium">{t.pagesTenant2.coursesList.colPublished}</th>
              <th className="p-3 font-medium text-right">{t.pagesTenant2.coursesList.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {courses.map((c) => {
              const s = STATUS_LABELS[c.status]
              return (
                <tr key={c.id}>
                  <td className="p-3">
                    {canEdit ? (
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={
                          `/dashboard/tenants/${tenant.slug}/kursus/${c.id}/edit` as any
                        }
                        className="text-foreground hover:text-primary font-medium"
                      >
                        {c.title}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium">
                        {c.title}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs">{LEVEL_LABELS[c.level]}</td>
                  <td className="p-3 font-mono text-xs">
                    {c.durationHours.toLocaleString('id-ID')} {t.pagesTenant2.coursesList.durationUnit}
                  </td>
                  <td className="p-3 text-xs">
                    {c.instructor
                      ? c.instructor.name || c.instructor.email
                      : '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {c._count.enrollments.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs">
                    {c.publishedAt ? dateFmt.format(c.publishedAt) : '—'}
                  </td>
                  <td className="p-3 text-right">
                    {canEdit || canChangeStatus || canDelete ? (
                      <CourseRowActions
                        tenantSlug={tenant.slug}
                        courseId={c.id}
                        currentStatus={c.status}
                        canEdit={canEdit}
                        canChangeStatus={canChangeStatus}
                        canDelete={canDelete}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {courses.length === 0 && (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={8}>
                  {t.pagesTenant2.coursesList.emptyState}
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
          {t.pagesTenant2.coursesList.pageOf
            .replace('{page}', String(page))
            .replace('{totalPages}', String(totalPages))}
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref(baseHref, sp, { page: String(page - 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              {t.pagesTenant2.coursesList.prevPage}
            </Link>
          )}
          {page < totalPages && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref(baseHref, sp, { page: String(page + 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              {t.pagesTenant2.coursesList.nextPage}
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
