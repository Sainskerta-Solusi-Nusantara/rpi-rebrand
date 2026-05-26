import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CourseCard } from '@/components/molecules/course-card'
import { getAllCourses } from '@/lib/courses-data'

export const metadata: Metadata = {
  title: 'Kursus & Pelatihan',
  description:
    'Tingkatkan keterampilan dengan kursus terstruktur, sertifikat, dan jalur karier yang dirancang untuk pekerja Indonesia.',
}

const LEVELS = [
  { v: '', l: 'Semua Tingkat' },
  { v: 'beginner', l: 'Pemula' },
  { v: 'intermediate', l: 'Menengah' },
  { v: 'advanced', l: 'Lanjutan' },
]

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const level = typeof searchParams.level === 'string' ? searchParams.level.toLowerCase() : ''
  const all = await getAllCourses()
  const courses = level ? all.filter((c) => c.level === level) : all

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl">Kursus & Pelatihan</h1>
        <p className="text-muted-foreground mt-2">
          {courses.length} kursus tersedia untuk meningkatkan keterampilan Anda.
        </p>
      </header>

      <nav aria-label="Tingkat" className="mb-8 flex flex-wrap gap-2 text-sm">
        {LEVELS.map((opt) => (
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
                <Link href={`/courses/${c.slug}`} className="block">
                  <CourseCard
                    title={c.title}
                    instructor={c.instructor.name}
                    level={c.level}
                    durationHours={c.durationHours}
                    lessonsCount={c.lessonsCount}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Suspense>
    </div>
  )
}
