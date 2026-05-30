import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Briefcase } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { JobForm } from '@/components/organisms/tenant-job-form'

export const metadata = { title: 'Lowongan Baru — Dasbor' }

export default async function NewJobPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/jobs/new`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.create')) {
    notFound()
  }

  const categories = await prisma.jobCategory.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true },
  })

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/jobs` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar lowongan
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Lowongan baru</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Buat lowongan untuk tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <JobForm tenantSlug={tenant.slug} categories={categories} />
      </section>
    </div>
  )
}
