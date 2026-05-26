import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Languages,
  PlayCircle,
  Sparkles,
  Star,
  Target,
  Users,
  Video,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import {
  LESSON_TYPE_LABEL,
  LEVEL_COLOR,
  LEVEL_LABEL,
  type CourseLesson,
  type DummyCourse,
  findCourse,
  getAllCourses,
  relatedCourses,
} from '@/lib/courses-data'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const courses = await getAllCourses()
  return courses.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const c = await findCourse(params.slug)
  if (!c) return { title: 'Kursus Tidak Ditemukan' }
  return {
    title: `${c.title} — RPI Academy`,
    description: c.description.slice(0, 160),
    openGraph: {
      title: c.title,
      description: c.description.slice(0, 160),
      type: 'article',
    },
  }
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mnt`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} jam` : `${h} jam ${m} mnt`
}

function lessonIcon(type: CourseLesson['type']) {
  switch (type) {
    case 'video': return Video
    case 'article': return FileText
    case 'quiz': return Activity
    case 'project': return Zap
  }
}

export default async function CourseDetailPage({ params }: { params: Params }) {
  const course = await findCourse(params.slug)
  if (!course) notFound()

  const related = await relatedCourses(params.slug, 3)
  const totalMinutes = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMin, 0),
    0,
  )
  const projectCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.type === 'project').length,
    0,
  )
  const isFree = course.priceIdr === 'free'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'Rumah Pekerja Indonesia',
    },
    instructor: {
      '@type': 'Person',
      name: course.instructor.name,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: course.rating,
      reviewCount: course.reviewsCount,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="course-detail-heading"
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
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 14%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-6xl px-6 pt-12 md:pt-16">
          <Link
            href="/courses"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke semua kursus
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-6xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Hero text */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {course.category}
                </span>
              </div>
              <h1
                id="course-detail-heading"
                className="font-heading text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl lg:text-5xl"
              >
                {course.title}
              </h1>
              <p className="text-muted-foreground mt-3 text-balance text-lg md:text-xl">
                {course.subtitle}
              </p>

              {/* Rating + stats */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Star
                    className="text-[color:var(--ring)] h-4 w-4 fill-current"
                    aria-hidden
                  />
                  <strong className="text-foreground font-semibold">
                    {course.rating.toFixed(1)}
                  </strong>
                  <span className="text-muted-foreground">
                    ({course.reviewsCount.toLocaleString('id-ID')} ulasan)
                  </span>
                </span>
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden />
                  {course.studentsCount.toLocaleString('id-ID')} pelajar
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    background: `color-mix(in oklab, ${LEVEL_COLOR[course.level]} 14%, transparent)`,
                    color: LEVEL_COLOR[course.level],
                  }}
                >
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ background: LEVEL_COLOR[course.level] }}
                  />
                  {LEVEL_LABEL[course.level]}
                </span>
              </div>

              {/* Instructor preview */}
              <div className="text-muted-foreground mt-6 flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className="font-heading grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${course.instructor.color} 0%, color-mix(in oklab, ${course.instructor.color} 70%, black) 100%)`,
                  }}
                >
                  {course.instructor.initial}
                </span>
                <span>
                  Pengajar{' '}
                  <strong className="text-foreground font-medium">
                    {course.instructor.name}
                  </strong>{' '}
                  · {course.instructor.role}
                </span>
              </div>
            </div>

            {/* Hero visual */}
            <div
              aria-hidden
              className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${course.gradient[0]} 0%, ${course.gradient[1]} 100%)`,
              }}
            >
              <div className="absolute inset-0 grid place-items-center text-7xl opacity-90">
                {course.emoji}
              </div>
              <div className="absolute left-4 top-4">
                <span className="bg-background/90 text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                  <PlayCircle className="h-3 w-3" aria-hidden />
                  Preview
                </span>
              </div>
              <div className="absolute bottom-4 right-4">
                <span className="bg-background/90 text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium backdrop-blur">
                  <Clock className="h-3 w-3" aria-hidden />
                  {course.durationHours} jam · {course.lessonsCount} pelajaran
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Main */}
            <article className="space-y-12">
              <Block heading="Tentang kursus ini">
                <p className="text-foreground/85 text-base leading-relaxed">
                  {course.longDescription}
                </p>
              </Block>

              {course.whatYouLearn.length > 0 && (
              <Block heading="Yang akan Anda pelajari">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.whatYouLearn.map((it) => (
                    <li
                      key={it}
                      className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-sm"
                    >
                      <CheckCircle2
                        className="text-[color:var(--ring)] mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="text-foreground/85">{it}</span>
                    </li>
                  ))}
                </ul>
              </Block>
              )}

              <Block heading="Materi kursus">
                <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    {course.modules.length} modul
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" aria-hidden />
                    {course.lessonsCount} pelajaran
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {formatDuration(totalMinutes)} total
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    {projectCount} proyek hands-on
                  </span>
                </div>
                <ol className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
                  {course.modules.map((m, i) => (
                    <li key={m.title}>
                      <details className="group" open={i === 0}>
                        <summary className="hover:bg-muted/30 flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              aria-hidden
                              className="bg-[color:var(--ring)]/10 text-[color:var(--ring)] font-heading grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-heading text-foreground text-sm font-semibold sm:text-base">
                                {m.title}
                              </div>
                              <div className="text-muted-foreground mt-0.5 text-xs">
                                {m.lessons.length} pelajaran ·{' '}
                                {formatDuration(m.durationMin)}
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            className="text-muted-foreground h-4 w-4 shrink-0 transition group-open:rotate-90"
                            aria-hidden
                          />
                        </summary>
                        <ul className="border-border divide-border divide-y border-t">
                          {m.lessons.map((l) => {
                            const Icon = lessonIcon(l.type)
                            return (
                              <li
                                key={l.title}
                                className="hover:bg-muted/20 flex items-center gap-3 px-5 py-3 pl-16 text-sm transition"
                              >
                                <Icon
                                  className="text-muted-foreground h-4 w-4 shrink-0"
                                  aria-hidden
                                />
                                <span className="text-foreground/85 flex-1 truncate">
                                  {l.title}
                                </span>
                                <span className="text-muted-foreground hidden text-[10px] uppercase tracking-wider sm:inline-block">
                                  {LESSON_TYPE_LABEL[l.type]}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {l.durationMin} mnt
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </details>
                    </li>
                  ))}
                </ol>
              </Block>

              {course.requirements.length > 0 && (
                <Block heading="Prasyarat">
                  <BulletList items={course.requirements} />
                </Block>
              )}

              {course.targetAudience.length > 0 && (
                <Block heading="Kursus ini untuk Anda jika">
                  <BulletList items={course.targetAudience} muted />
                </Block>
              )}

              <Block heading="Tentang pengajar">
                <div className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-start">
                  <span
                    aria-hidden
                    className="font-heading grid size-20 shrink-0 place-items-center rounded-full text-2xl font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${course.instructor.color} 0%, color-mix(in oklab, ${course.instructor.color} 70%, black) 100%)`,
                    }}
                  >
                    {course.instructor.initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-foreground text-lg font-semibold">
                      {course.instructor.name}
                    </h3>
                    <p className="text-[color:var(--ring)] mt-0.5 text-xs font-medium uppercase tracking-wider">
                      {course.instructor.role}
                    </p>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {course.instructor.bio}
                    </p>
                    <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        {course.instructor.coursesCount} kursus
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {course.instructor.studentsCount} pelajar
                      </span>
                    </div>
                  </div>
                </div>
              </Block>

              {course.tags.length > 0 && (
                <Block heading="Skill & topik">
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((t) => (
                      <span
                        key={t}
                        className="border-border bg-muted/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Block>
              )}
            </article>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border-border bg-card rounded-2xl border p-6">
                {/* Price */}
                <div className="border-border border-b pb-5">
                  {isFree ? (
                    <div>
                      <div className="font-heading text-foreground text-3xl font-semibold tracking-tight">
                        Gratis
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Selamanya · termasuk sertifikat
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="font-heading text-foreground text-3xl font-semibold tracking-tight">
                          {formatRupiah(course.priceIdr as number)}
                        </span>
                        {course.originalPriceIdr && (
                          <span className="text-muted-foreground text-sm line-through">
                            {formatRupiah(course.originalPriceIdr)}
                          </span>
                        )}
                      </div>
                      {course.originalPriceIdr && (
                        <div className="text-[color:var(--ring)] mt-1 text-xs font-medium">
                          Hemat {Math.round((1 - (course.priceIdr as number) / course.originalPriceIdr) * 100)}% — penawaran terbatas
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button asChild size="lg" className="mt-5 w-full">
                  <a href="/login?next=/enroll">
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                    {isFree ? 'Daftar Sekarang' : 'Beli & Mulai Belajar'}
                  </a>
                </Button>
                <Button asChild variant="outline" className="mt-3 w-full">
                  <a href={`/courses/${course.slug}#preview`}>
                    <PlayCircle className="mr-2 h-4 w-4" aria-hidden />
                    Preview Gratis
                  </a>
                </Button>

                <dl className="border-border mt-6 space-y-3 border-t pt-5 text-xs">
                  <SidebarRow icon={Clock} label="Durasi" value={`${course.durationHours} jam`} />
                  <SidebarRow icon={BookOpen} label="Pelajaran" value={`${course.lessonsCount}`} />
                  <SidebarRow icon={Zap} label="Proyek hands-on" value={`${projectCount}`} />
                  <SidebarRow
                    icon={Target}
                    label="Tingkat"
                    value={LEVEL_LABEL[course.level]}
                  />
                  <SidebarRow icon={Languages} label="Bahasa" value={course.language} />
                  {course.certificate && (
                    <SidebarRow
                      icon={Award}
                      label="Sertifikat"
                      value="Tersedia setelah lulus"
                    />
                  )}
                  <SidebarRow
                    icon={Users}
                    label="Pelajar"
                    value={course.studentsCount.toLocaleString('id-ID')}
                  />
                </dl>

                <div className="border-border bg-muted/20 mt-5 rounded-lg border p-4">
                  <p className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                    Garansi 14 hari
                  </p>
                  <p className="text-foreground/80 mt-2 text-xs leading-relaxed">
                    Tidak puas? Klaim refund penuh dalam 14 hari pertama tanpa
                    pertanyaan.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Enroll CTA */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Siap memulai perjalanan belajar Anda?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm">
            Bergabung dengan{' '}
            {course.studentsCount.toLocaleString('id-ID')} pelajar lain yang
            sudah mengikuti kursus ini. Sertifikat tersedia setelah lulus.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="/login?next=/enroll">
                <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                {isFree ? 'Daftar Gratis Sekarang' : 'Beli & Mulai Belajar'}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">
                Jelajahi kursus lain
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-background py-20 md:py-24" aria-label="Kursus terkait">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Kursus Terkait
                  </span>
                </div>
                <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  Lanjutkan perjalanan belajar Anda
                </h2>
              </div>
              <Link
                href="/courses"
                className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
              >
                Lihat semua
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-6 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <RelatedCourseCard course={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}

function Block({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-foreground text-xl font-semibold tracking-tight md:text-2xl">
        {heading}
      </h2>
      <div>{children}</div>
    </section>
  )
}

function BulletList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-3">
          <span
            aria-hidden
            className={
              muted
                ? 'border-border text-muted-foreground mt-1.5 size-1.5 shrink-0 rounded-full border-2'
                : 'bg-[color:var(--ring)] mt-2 size-1.5 shrink-0 rounded-full'
            }
          />
          <span
            className={
              muted
                ? 'text-muted-foreground text-sm leading-relaxed'
                : 'text-foreground/85 text-sm leading-relaxed'
            }
          >
            {it}
          </span>
        </li>
      ))}
    </ul>
  )
}

function SidebarRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-[color:var(--ring)] mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          {label}
        </dt>
        <dd className="text-foreground text-xs font-medium">{value}</dd>
      </div>
    </div>
  )
}

function RelatedCourseCard({ course }: { course: DummyCourse }) {
  const isFree = course.priceIdr === 'free'
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full flex-col overflow-hidden rounded-2xl border transition"
    >
      <div
        aria-hidden
        className="relative aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${course.gradient[0]} 0%, ${course.gradient[1]} 100%)`,
        }}
      >
        <div className="absolute inset-0 grid place-items-center text-5xl opacity-90 transition group-hover:scale-110">
          {course.emoji}
        </div>
        <div className="absolute left-3 top-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur"
            style={{ background: `${LEVEL_COLOR[course.level]}E0` }}
          >
            {LEVEL_LABEL[course.level]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] line-clamp-2 text-base font-semibold leading-snug transition">
          {course.title}
        </h3>
        <p className="text-muted-foreground text-xs">
          oleh {course.instructor.name}
        </p>
        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {course.durationHours} jam
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="text-[color:var(--ring)] h-3 w-3 fill-current" aria-hidden />
            {course.rating.toFixed(1)}
          </span>
          <span className="ml-auto">
            <Badge variant="secondary" size="sm">
              {isFree ? 'Gratis' : formatRupiah(course.priceIdr as number)}
            </Badge>
          </span>
        </div>
      </div>
    </Link>
  )
}
