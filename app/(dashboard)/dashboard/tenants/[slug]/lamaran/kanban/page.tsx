import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FileText, Table2 } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { getKanbanData } from '@/lib/applications/kanban-queries'
import { ApplicationKanbanBoard } from '@/components/organisms/application-kanban-board'

export const metadata = { title: 'Kanban Lamaran — Dasbor' }

function buildHref(
  base: string,
  params: Record<string, string | undefined>,
): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v)
  }
  const qs = usp.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function TenantApplicationsKanbanPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/lamaran/kanban`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  // Kanban is a recruiter tool — gated on the mutating permission since the
  // board's primary affordance is drag-and-drop status change.
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    notFound()
  }

  const jobIdFilter =
    typeof searchParams.jobId === 'string' && searchParams.jobId.trim()
      ? searchParams.jobId.trim()
      : undefined
  const q =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''

  const [jobs, data] = await Promise.all([
    prisma.job
      .findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
        take: 100,
      })
      .catch(() => []),
    getKanbanData({
      tenantId: tenant.id,
      jobId: jobIdFilter,
      searchQuery: q || undefined,
    }),
  ])

  const tableHref = buildHref(`/dashboard/tenants/${tenant.slug}/lamaran`, {
    jobId: jobIdFilter,
    q: q || undefined,
  })

  return (
    <div className="space-y-6 p-6">
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
              Kanban Lamaran
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Tarik kartu antar kolom untuk mengubah status lamaran di{' '}
            <span className="text-foreground font-medium">{tenant.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={tableHref as any}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <Table2 className="size-4" aria-hidden="true" />
            Tampilan tabel
          </Link>
        </div>
      </header>

      <ApplicationKanbanBoard
        tenantSlug={tenant.slug}
        initial={data}
        jobs={jobs}
        filters={{ jobId: jobIdFilter, q: q || undefined }}
      />
    </div>
  )
}
