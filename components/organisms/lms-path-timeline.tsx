'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  Users,
  Star,
  PlayCircle,
  Award,
  ArrowRight,
  GraduationCap,
} from 'lucide-react'
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

const FALLBACK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=70',
]

const DEFAULT_COURSES: CourseItem[] = [
  {
    id: 'c1',
    title: 'Fundamentals of Software Engineering',
    slug: 'fundamentals-of-software-engineering',
    description:
      'Pelajari dasar-dasar rekayasa perangkat lunak modern: algoritma, struktur data, hingga praktik kolaborasi tim.',
    level: 'Pemula',
    durationHours: 24,
    instructor: { name: 'Ahmad Wijaya' },
    _count: { enrollments: 1240 },
  },
  {
    id: 'c2',
    title: 'UI/UX Design Pro',
    slug: 'ui-ux-design-pro',
    description:
      'Bangun produk digital yang elegan dan ramah pengguna dengan pendekatan design thinking dan prototyping.',
    level: 'Menengah',
    durationHours: 18,
    instructor: { name: 'Sarah Putri' },
    _count: { enrollments: 980 },
  },
  {
    id: 'c3',
    title: 'Digital Marketing Mastery',
    slug: 'digital-marketing-mastery',
    description:
      'Strategi pemasaran digital end-to-end: SEO, SEM, social media, hingga performance analytics.',
    level: 'Pemula',
    durationHours: 12,
    instructor: { name: 'Budi Santoso' },
    _count: { enrollments: 2150 },
  },
  {
    id: 'c4',
    title: 'Data Analysis with Excel',
    slug: 'data-analysis-with-excel',
    description:
      'Kuasai analisis data praktis menggunakan Excel: pivot table, formula lanjutan, hingga dashboard interaktif.',
    level: 'Pemula',
    durationHours: 8,
    instructor: { name: 'Linda Hartono' },
    _count: { enrollments: 3400 },
  },
  {
    id: 'c5',
    title: 'Cloud DevOps Bootcamp',
    slug: 'cloud-devops-bootcamp',
    description:
      'Bootcamp intensif DevOps & cloud: CI/CD, Docker, Kubernetes, hingga deployment otomatis di AWS.',
    level: 'Lanjutan',
    durationHours: 40,
    instructor: { name: 'Rian Pratama' },
    _count: { enrollments: 540 },
  },
]

function getLevelStyle(level?: string | null) {
  const l = (level || '').toLowerCase()
  if (l.includes('lanjut')) {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'
  }
  if (l.includes('menengah')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
  }
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
}

function formatNumber(n?: number) {
  if (!n && n !== 0) return '0'
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
  }
  return n.toLocaleString('id-ID')
}

const STATS: { icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { icon: Award, label: 'Sertifikat Resmi' },
  { icon: Users, label: '120K+ siswa aktif' },
  { icon: BookOpen, label: '500+ kursus' },
  { icon: Star, label: 'Rating 4.8/5' },
]

export function LMSPathTimeline({ courses, className }: LMSPathTimelineProps) {
  const list = courses && courses.length > 0 ? courses.slice(0, 6) : DEFAULT_COURSES

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 md:py-28',
        className,
      )}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"
      />

      <div className="container relative mx-auto grid grid-cols-1 gap-12 px-4 md:grid-cols-2 md:gap-10 lg:gap-16">
        {/* LEFT — sticky intro */}
        <div className="md:max-w-md lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground/90 backdrop-blur">
              <GraduationCap className="h-4 w-4 text-secondary" />
              RPI Academy
            </span>

            <h2 className="mt-5 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              Tingkatkan Keterampilan,{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Dapat Pekerjaan Impian
              </span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              Belajar dari instruktur terbaik di industri. Bangun portofolio nyata,
              raih sertifikat resmi, dan tingkatkan peluang Anda diterima di
              perusahaan impian.
            </p>

            {/* Stat list */}
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {STATS.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.li
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 backdrop-blur"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {s.label}
                    </span>
                  </motion.li>
                )
              })}
            </ul>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href="/courses"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              >
                Jelajahi Semua Kursus
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Illustrative image */}
            <div className="mt-10 hidden overflow-hidden rounded-2xl ring-1 ring-border/60 shadow-xl shadow-primary/5 md:block">
              <div className="relative aspect-video w-full">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=70"
                  alt="Siswa belajar bersama di RPI Academy"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-background/85 px-3 py-2 backdrop-blur">
                  <PlayCircle className="h-5 w-5 text-secondary" />
                  <span className="text-xs font-semibold text-foreground">
                    Belajar fleksibel, kapan saja & di mana saja
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Timeline of courses */}
        <div className="relative">
          {/* Vertical dashed line — md+ only */}
          <div
            aria-hidden
            className="absolute left-4 top-2 bottom-2 hidden border-l-2 border-dashed border-secondary/40 md:block"
          />

          <ul className="space-y-6 md:space-y-7 md:pl-12">
            {list.map((course, i) => {
              const thumb =
                course.thumbnail || FALLBACK_THUMBNAILS[i % FALLBACK_THUMBNAILS.length]
              const level = course.level || 'Pemula'
              const duration = course.durationHours ?? 0
              const enrollments = course._count?.enrollments ?? 0
              const instructorName = course.instructor?.name || 'Instruktur RPI'
              const href = course.slug ? `/courses/${course.slug}` : '/courses'

              return (
                <motion.li
                  key={course.id}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: 'easeOut' }}
                  className="relative"
                >
                  {/* Numbered circle on timeline (md+) */}
                  <div
                    aria-hidden
                    className="absolute -left-12 top-6 hidden h-8 w-8 items-center justify-center rounded-full border border-secondary/40 bg-background text-xs font-bold text-secondary shadow-md shadow-primary/10 md:flex"
                  >
                    {i + 1}
                  </div>

                  <Link
                    href={href}
                    className="group block rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 md:p-4"
                  >
                    <div className="flex gap-4 md:gap-5">
                      {/* Thumbnail */}
                      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60 md:h-40 md:w-40">
                        <Image
                          src={thumb}
                          alt={course.title}
                          fill
                          sizes="(max-width: 768px) 128px, 160px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-transparent opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              getLevelStyle(level),
                            )}
                          >
                            {level}
                          </span>
                        </div>

                        <h3 className="mt-2 line-clamp-1 font-heading text-base font-semibold text-foreground transition-colors group-hover:text-primary md:text-lg">
                          {course.title}
                        </h3>

                        {course.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground md:text-sm">
                            {course.description}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground md:text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            {duration} jam
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-primary/70" />
                            {formatNumber(enrollments)} siswa
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                            4.8
                          </span>
                        </div>

                        {/* Bottom row */}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-border/60">
                              {course.instructor?.image ? (
                                <Image
                                  src={course.instructor.image}
                                  alt={instructorName}
                                  fill
                                  sizes="28px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-primary">
                                  {instructorName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="truncate text-xs font-medium text-foreground/80">
                              {instructorName}
                            </span>
                          </div>

                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-all group-hover:gap-2">
                            Mulai Belajar
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              )
            })}
          </ul>

          {/* Mobile CTA repeat */}
          <div className="mt-10 md:hidden">
            <Link
              href="/courses"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            >
              Lihat Semua Kursus
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LMSPathTimeline
