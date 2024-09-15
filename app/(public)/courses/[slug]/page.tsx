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
const EnrollButton: any = safeRequire('@/components/molecules/enroll-button', 'EnrollButton')

async function resolveTenantId(): Promise<string | null> {
  const slug = headers().get('x-tenant-slug')
  if (!slug) return null
  const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } }).catch(() => null)
  return t?.id ?? null
}

async function findCourse(slug: string) {
  const tenantId = await resolveTenantId()
  return prisma.course
    .findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, name: true, image: true, headline: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, contentType: true, durationMin: true, order: true },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    })
    .catch(() => null)
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const course = await findCourse(params.slug)
  if (!course) return { title: 'Kursus Tidak Ditemukan' }
  return {
    title: course.title,
    description: course.description.slice(0, 160),
    openGraph: {
      title: course.title,
      description: course.description.slice(0, 160),
      images: course.thumbnail ? [{ url: course.thumbnail }] : undefined,
    },
  }
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Pemula',
  INTERMEDIATE: 'Menengah',
  ADVANCED: 'Lanjutan',
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await findCourse(params.slug)
  if (!course) notFound()

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.tenant.name,
    },
    ...(course.instructor
      ? {
          instructor: { '@type': 'Person', name: course.instructor.name ?? 'Pengajar' },
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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <header className="mb-6">
            <div className="text-muted-foreground text-sm">
              {levelLabels[course.level] ?? course.level} •{' '}
              {course.durationHours} jam • {totalLessons} pelajaran
            </div>
            <h1 className="font-heading text-3xl md:text-4xl mt-2">{course.title}</h1>
            <p className="text-muted-foreground mt-3 text-lg">{course.description}</p>
          </header>

          {course.instructor ? (
            <section className="mb-8 flex items-center gap-3">
              {course.instructor.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.instructor.image}
                  alt={course.instructor.name ?? 'Pengajar'}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <div className="bg-muted size-12 rounded-full" />
              )}
              <div>
                <div className="font-medium">{course.instructor.name}</div>
                <div className="text-muted-foreground text-sm">
                  {course.instructor.headline ?? 'Pengajar'}
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="font-heading text-2xl mb-4">Materi Kursus</h2>
            <ol className="space-y-4">
              {course.modules.map((m, i) => (
                <li key={m.id} className="border-border rounded-xl border p-4">
                  <div className="font-medium">
                    Modul {i + 1}: {m.title}
                  </div>
                  <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex justify-between">
                        <span>
                          {l.order}. {l.title}
                        </span>
                        <span className="ml-4 shrink-0">{l.durationMin} mnt</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="border-border rounded-xl border p-6 h-fit space-y-4">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="aspect-video w-full rounded-lg object-cover"
            />
          ) : (
            <div className="bg-muted aspect-video w-full rounded-lg" />
          )}
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Peserta</dt>
              <dd className="font-medium">{course._count.enrollments.toLocaleString('id-ID')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Durasi</dt>
              <dd className="font-medium">{course.durationHours} jam</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tingkat</dt>
              <dd className="font-medium">{levelLabels[course.level] ?? course.level}</dd>
            </div>
          </dl>
          <EnrollButton courseId={course.id} />
        </aside>
      </div>
    </article>
  )
}
