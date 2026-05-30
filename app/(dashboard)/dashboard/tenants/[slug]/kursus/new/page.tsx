import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, GraduationCap } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { CourseForm } from '@/components/organisms/tenant-course-form'

export const metadata = { title: 'Kursus Baru — Dasbor' }

export default async function NewCoursePage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/kursus/new`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'course.create')) {
    notFound()
  }

  const memberships = await prisma.userTenant.findMany({
    where: { tenantId: tenant.id, status: 'active' },
    orderBy: [{ joinedAt: 'asc' }],
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
  })
  const instructors = memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? '',
    email: m.user.email,
  }))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/kursus` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar kursus
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Kursus baru</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Buat kursus untuk tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <CourseForm tenantSlug={tenant.slug} instructors={instructors} />
      </section>
    </div>
  )
}
