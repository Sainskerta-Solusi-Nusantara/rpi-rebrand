import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { CourseCard } from '@/components/molecules/course-card'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { getAllCourses } from '@/lib/courses-data'
import {
  COURSE_TOPICS,
  findCourseTopic,
  matchesTopic,
} from '@/lib/courses-topics'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return COURSE_TOPICS.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const topic = findCourseTopic(params.slug)
  if (!topic) return { title: 'Topik Tidak Ditemukan' }
  return {
    title: `${topic.name} — Kursus RPI`,
    description: topic.description,
  }
}

export default async function TopicPage({ params }: { params: Params }) {
  const t = await getServerT()
  const topic = findCourseTopic(params.slug)
  if (!topic) notFound()

  const allCourses = await getAllCourses()
  const courses = allCourses.filter((c) => matchesTopic(c, topic))
  const otherTopics = COURSE_TOPICS.filter((tp) => tp.slug !== topic.slug)

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="topic-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)',
            backgroundSize: '100% 96px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 16%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/courses"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.pagesCareers.coursesTopic.back}
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px w-8 bg-[color:var(--ring)]"
                />
                <span className="text-[color:var(--ring)] text-xs font-medium uppercase tracking-[0.2em]">
                  {t.pagesCareers.coursesTopic.eyebrow}
                </span>
              </div>
              <h1
                id="topic-heading"
                className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
              >
                {topic.name}
              </h1>
              <p className="text-muted-foreground mt-5 text-balance text-lg leading-relaxed md:text-xl">
                {topic.description}
              </p>
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap
                    className="text-[color:var(--ring)] h-4 w-4"
                    aria-hidden
                  />
                  <strong className="text-foreground font-medium">
                    {courses.length}
                  </strong>{' '}
                  {t.pagesCareers.coursesTopic.coursesSuffix}
                </span>
              </div>
            </div>

            {/* Big emoji visual */}
            <div
              aria-hidden
              className="hidden h-40 w-40 shrink-0 place-items-center rounded-3xl text-6xl shadow-xl lg:grid"
              style={{
                background:
                  'linear-gradient(135deg, var(--ring) 0%, color-mix(in oklab, var(--ring) 65%, black) 100%)',
              }}
            >
              <span className="grid place-items-center">{topic.emoji}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Courses list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          {courses.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <GraduationCap
                className="text-muted-foreground mx-auto h-8 w-8"
                aria-hidden
              />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                {t.pagesCareers.coursesTopic.emptyHeading}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t.pagesCareers.coursesTopic.emptyBody}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/courses">{t.pagesCareers.coursesTopic.emptyButton}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/courses/${c.slug}` as any}
                    className="block"
                  >
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
        </div>
      </section>

      {/* Other topics */}
      <section className="bg-muted/30 py-20 md:py-24" aria-label="Topik lain">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                  <Compass className="inline h-3.5 w-3.5" aria-hidden />{' '}
                  {t.pagesCareers.coursesTopic.otherEyebrow}
                </span>
              </div>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                {t.pagesCareers.coursesTopic.otherHeading}
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
            >
              {t.pagesCareers.coursesTopic.otherAllLink}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ul className="flex flex-wrap gap-2">
            {otherTopics.map((tp) => (
              <li key={tp.slug}>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/courses/topic/${tp.slug}` as any}
                  className="border-border bg-card hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] text-foreground/80 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
                >
                  <span aria-hidden>{tp.emoji}</span>
                  {tp.name}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherTopics.map((tp) => {
              const count = allCourses.filter((c) => matchesTopic(c, tp)).length
              return (
                <li key={tp.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/courses/topic/${tp.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-5 transition"
                  >
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-xl bg-[color:var(--ring)]/10 text-[color:var(--ring)] text-xl"
                    >
                      {tp.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                        {tp.name}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                        {tp.description}
                      </p>
                      <div className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                        <BookOpen className="h-3 w-3" aria-hidden />
                        {t.pagesCareers.coursesTopic.otherCount.replace('{n}', String(count))}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
