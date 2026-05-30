import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, GraduationCap } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  CourseForm,
  type CourseFormInitial,
} from '@/components/organisms/tenant-course-form'
import {
  CurriculumEditor,
  type CurriculumModule,
} from '@/components/organisms/tenant-course-curriculum-editor'

export const metadata = { title: 'Edit Kursus — Dasbor' }

export default async function EditCoursePage({
  params,
}: {
  params: { slug: string; courseId: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/kursus/${params.courseId}/edit`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'course.update')) {
    notFound()
  }

  const canEditCurriculum = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'course.update',
  )

  const [course, memberships] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.courseId },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        thumbnail: true,
        level: true,
        durationHours: true,
        instructorId: true,
        status: true,
        modules: {
          orderBy: [{ order: 'asc' }, { title: 'asc' }],
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              orderBy: [{ order: 'asc' }, { title: 'asc' }],
              select: {
                id: true,
                title: true,
                contentType: true,
                contentUrl: true,
                contentBody: true,
                order: true,
                durationMin: true,
              },
            },
          },
        },
      },
    }),
    prisma.userTenant.findMany({
      where: { tenantId: tenant.id, status: 'active' },
      orderBy: [{ joinedAt: 'asc' }],
      select: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  if (!course || course.tenantId !== tenant.id) notFound()

  const instructors = memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? '',
    email: m.user.email,
  }))

  const initial: CourseFormInitial = {
    title: course.title,
    description: course.description,
    level: course.level,
    durationHours: course.durationHours,
    instructorId: course.instructorId,
    thumbnail: course.thumbnail ?? '',
    status: course.status,
  }

  const modules: CurriculumModule[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      contentType: l.contentType,
      contentUrl: l.contentUrl,
      contentBody: l.contentBody,
      order: l.order,
      durationMin: l.durationMin,
    })),
  }))

  return (
    <div className="p-6 space-y-8 max-w-4xl">
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
          <h1 className="font-heading text-2xl md:text-3xl">Edit kursus</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Perbarui detail kursus{' '}
          <span className="font-medium text-foreground">{course.title}</span>.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <CourseForm
          tenantSlug={tenant.slug}
          courseId={course.id}
          initial={initial}
          instructors={instructors}
        />
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <CurriculumEditor
          courseId={course.id}
          modules={modules}
          canEdit={canEditCurriculum}
        />
      </section>
    </div>
  )
}
