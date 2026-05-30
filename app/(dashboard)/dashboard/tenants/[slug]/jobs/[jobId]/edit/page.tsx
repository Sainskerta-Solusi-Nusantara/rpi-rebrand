import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Briefcase } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  JobForm,
  type JobFormInitial,
} from '@/components/organisms/tenant-job-form'

export const metadata = { title: 'Edit Lowongan — Dasbor' }

export default async function EditJobPage({
  params,
}: {
  params: { slug: string; jobId: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/jobs/${params.jobId}/edit`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    notFound()
  }

  const [job, categories] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        responsibilities: true,
        requirements: true,
        benefits: true,
        salaryMin: true,
        salaryMax: true,
        employmentType: true,
        experienceLevel: true,
        location: true,
        locationType: true,
        categoryId: true,
        tags: true,
        status: true,
      },
    }),
    prisma.jobCategory.findMany({
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true },
    }),
  ])

  if (!job || job.tenantId !== tenant.id) notFound()

  const initial: JobFormInitial = {
    title: job.title,
    description: job.description,
    responsibilities: job.responsibilities ?? '',
    requirements: job.requirements ?? '',
    benefits: job.benefits ?? '',
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    location: job.location,
    locationType: job.locationType,
    categoryId: job.categoryId,
    tags: job.tags,
    status: job.status,
  }

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
          <h1 className="font-heading text-2xl md:text-3xl">Edit lowongan</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Perbarui detail lowongan{' '}
          <span className="font-medium text-foreground">{job.title}</span>.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <JobForm
          tenantSlug={tenant.slug}
          jobId={job.id}
          initial={initial}
          categories={categories}
        />
      </section>
    </div>
  )
}
