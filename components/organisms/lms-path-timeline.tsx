'use client'

import * as React from 'react'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CourseItem {
  id: string
  title: string
  slug?: string | null
  description?: string | null
  thumbnail?: string | null
  level?: string | null
  durationHours?: number | null
  instructor?: { name?: string | null; image?: string | null } | null
  _count?: { enrollments?: number }
}

export interface LMSPathTimelineProps {
  courses?: CourseItem[]
  className?: string
}

const FALLBACK_THUMBS = [
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=70',
]

const DEFAULT_COURSES: CourseItem[] = [
  {
    id: 'c1',
    title: 'React Dasar untuk Web Developer',
    slug: 'react-dasar',
    level: 'Pemula',
    durationHours: 12,
    instructor: { name: 'Andi Pratama' },
    _count: { enrollments: 2400 },
  },
  {
    id: 'c2',
    title: 'Data Analysis dengan Python',
    slug: 'data-analysis-python',
    level: 'Menengah',
    durationHours: 24,
    instructor: { name: 'Sari Wijaya' },
    _count: { enrollments: 1800 },
  },
  {
    id: 'c3',
    title: 'Public Speaking untuk Karier',
    slug: 'public-speaking',
    level: 'Lanjutan',
    durationHours: 8,
    instructor: { name: 'Budi Santoso' },
    _count: { enrollments: 920 },
  },
]

function formatNumber(n?: number): string {
  if (!n && n !== 0) return '0'
  if (n >= 1000) {
    const v = n / 1000
    return `${Number.isInteger(v) ? v : v.toFixed(1)}K`
  }
  return n.toLocaleString('id-ID')
}

export function LMSPathTimeline({ courses, className }: LMSPathTimelineProps) {
  const list = courses && courses.length > 0 ? courses.slice(0, 3) : DEFAULT_COURSES

  return (
    <section
      className={cn('bg-background py-16 md:py-20', className)}
      aria-labelledby="lms-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        {/* Eyebrow + heading + CTA */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Pelatihan
          </span>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.h2
              id="lms-heading"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Tingkatkan keterampilan.
            </motion.h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
              Kursus bersertifikat dari instruktur industri.
            </p>
          </div>
          <Link
            href="/courses"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-[color:var(--ring)]"
          >
            Lihat semua kursus
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Course grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((course, i) => {
            const thumb =
              course.thumbnail || FALLBACK_THUMBS[i % FALLBACK_THUMBS.length] || FALLBACK_THUMBS[0]!
            const level = course.level || 'Pemula'
            const duration = course.durationHours ?? 0
            const enrollments = course._count?.enrollments ?? 0
            const instructorName = course.instructor?.name || 'Instruktur SSN'
            const href = (course.slug ? `/courses/${course.slug}` : '/courses') as Route

            return (
              <motion.article
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-lift group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-[color:var(--ring)]"
              >
                <Link href={href} className="absolute inset-0 z-10" aria-label={course.title} />

                {/* Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={thumb}
                    alt={course.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span aria-hidden className="h-px w-4 bg-[color:var(--ring)]" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {level}
                    </span>
                  </div>

                  <h3 className="font-heading line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                    {course.title}
                  </h3>

                  <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {duration} jam
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {formatNumber(enrollments)} siswa
                    </div>
                  </dl>

                  <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    Instruktur:{' '}
                    <span className="font-medium text-foreground">{instructorName}</span>
                  </p>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LMSPathTimeline
