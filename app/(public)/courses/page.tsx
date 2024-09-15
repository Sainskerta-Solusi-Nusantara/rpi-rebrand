import type { Metadata } from 'next'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-48 w-full animate-pulse rounded-xl"
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
const CourseCard: any = safeRequire('@/components/molecules/course-card', 'CourseCard')

export const metadata: Metadata = {
  title: 'Kursus & Pelatihan',
  description:
    'Tingkatkan keterampilan dengan kursus terstruktur, sertifikat, dan jalur karier yang dirancang untuk pekerja Indonesia.',
}

async function getTenantId(): Promise<string | null> {
  const slug = headers().get('x-tenant-slug')
  if (!slug) return null
  const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } }).catch(() => null)
  return t?.id ?? null
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const tenantId = await getTenantId()
  const level = typeof searchParams.level === 'string' ? searchParams.level : undefined

  const where: Prisma.CourseWhereInput = {
    status: 'PUBLISHED',
    ...(tenantId ? { tenantId } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(level ? ({ level: level as any } as Prisma.CourseWhereInput) : {}),
  }

  const courses = await prisma.course
    .findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 60,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        level: true,
        durationHours: true,
        instructor: { select: { name: true, image: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    })
    .catch(() => [])

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Kursus & Pelatihan</h1>
        <p className="text-muted-foreground mt-2">
          {courses.length} kursus tersedia untuk meningkatkan keterampilan Anda.
        </p>
      </header>

      <nav aria-label="Tingkat" className="mb-8 flex flex-wrap gap-2 text-sm">
        {[
          { v: '', l: 'Semua Tingkat' },
          { v: 'BEGINNER', l: 'Pemula' },
          { v: 'INTERMEDIATE', l: 'Menengah' },
          { v: 'ADVANCED', l: 'Lanjutan' },
        ].map((opt) => (
          <a
            key={opt.v || 'all'}
            href={opt.v ? `?level=${opt.v}` : '?'}
            className={`rounded-full border px-3 py-1 ${
              (level ?? '') === opt.v
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background'
            }`}
          >
            {opt.l}
          </a>
        ))}
      </nav>

      <Suspense fallback={<div className="bg-muted h-64 animate-pulse rounded-xl" />}>
        {courses.length === 0 ? (
          <div className="border-border rounded-xl border p-8 text-center">
            <p className="text-muted-foreground">Belum ada kursus tersedia.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        )}
      </Suspense>
    </div>
  )
}
