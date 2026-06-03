import Image from 'next/image'
import Link from 'next/link'
import { Award, BookOpen, Clock, GraduationCap, PlayCircle } from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Kursus Saya' }

type StatusFilter = 'all' | 'IN_PROGRESS' | 'COMPLETED'

function parseFilter(value: string | string[] | undefined): StatusFilter {
  const v = Array.isArray(value) ? value[0] : value
  if (v === 'IN_PROGRESS' || v === 'COMPLETED') return v
  return 'all'
}

export default async function CandidateCoursesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await requireAuth('/dashboard/kursus')
  const userId = session.user.id
  const filter = parseFilter(searchParams.status)
  const t = await getServerT()

  const LEVEL_LABEL: Record<string, string> = {
    BEGINNER: t.dashboard.courses.level.BEGINNER,
    INTERMEDIATE: t.dashboard.courses.level.INTERMEDIATE,
    ADVANCED: t.dashboard.courses.level.ADVANCED,
  }

  const STATUS_LABEL: Record<string, string> = {
    IN_PROGRESS: t.dashboard.courses.status.IN_PROGRESS,
    COMPLETED: t.dashboard.courses.status.COMPLETED,
    EXPIRED: t.dashboard.courses.status.EXPIRED,
  }

  const [enrollments, certificates] = await Promise.all([
    prisma.enrollment
      .findMany({
        where: {
          userId,
          ...(filter === 'all' ? {} : { status: filter }),
        },
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              level: true,
              durationHours: true,
              _count: { select: { modules: true } },
            },
          },
        },
      })
      .catch(() => []),
    prisma.certificate
      .findMany({
        where: { userId },
        select: { id: true, courseId: true },
      })
      .catch(() => []),
  ])

  const certByCourse = new Map<string, string>()
  for (const c of certificates) {
    if (c.courseId) certByCourse.set(c.courseId, c.id)
  }

  const TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: t.dashboard.courses.tabs.all },
    { id: 'IN_PROGRESS', label: t.dashboard.courses.tabs.inProgress },
    { id: 'COMPLETED', label: t.dashboard.courses.tabs.completed },
  ]

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.courses.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.courses.subtitle}
        </p>
      </header>

      <nav
        aria-label={t.dashboard.courses.filterLabel}
        className="border-border flex flex-wrap gap-2 border-b pb-3"
      >
        {TABS.map((t) => {
          const active = filter === t.id
          const href =
            t.id === 'all' ? '/dashboard/kursus' : `/dashboard/kursus?status=${t.id}`
          return (
            <Link
              key={t.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={href as any}
              className={
                active
                  ? 'bg-primary text-primary-foreground inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold'
                  : 'border-border text-foreground/80 hover:bg-muted inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium'
              }
            >
              {t.label}
            </Link>
          )
        })}
      </nav>

      {enrollments.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-10 text-center">
          <GraduationCap
            className="text-muted-foreground mx-auto h-10 w-10"
            aria-hidden
          />
          <p className="text-foreground mt-3 font-medium">
            {t.dashboard.courses.empty}
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            {t.dashboard.courses.emptyDesc}{' '}
            <Link
              href="/courses"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              {t.dashboard.courses.emptyLink}
            </Link>{' '}
            {t.dashboard.courses.emptyDescTail}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => {
            const certId = certByCourse.get(e.course.id)
            const progressClamped = Math.max(0, Math.min(100, e.progress))
            return (
              <li
                key={e.id}
                className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
              >
                {e.course.thumbnail ? (
                  <Image
                    src={e.course.thumbnail}
                    alt={e.course.title}
                    className="aspect-video w-full object-cover"
                    width={640}
                    height={360}
                    unoptimized
                  />
                ) : (
                  <div
                    aria-hidden
                    className="from-primary/20 to-primary/5 grid aspect-video w-full place-items-center bg-gradient-to-br"
                  >
                    <BookOpen className="text-primary/70 h-10 w-10" aria-hidden />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h2 className="font-heading text-foreground line-clamp-2 text-base font-semibold">
                      {e.course.title}
                    </h2>
                    <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        {e.course.durationHours} {t.dashboard.courses.hoursSuffix}
                      </span>
                      <span>
                        {LEVEL_LABEL[e.course.level] ?? e.course.level}
                      </span>
                      <span>{e.course._count.modules} {t.dashboard.courses.modulesSuffix}</span>
                    </div>
                  </div>

                  <div>
                    <div
                      className="bg-muted h-2 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-valuenow={progressClamped}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${progressClamped}%` }}
                      />
                    </div>
                    <div className="text-muted-foreground mt-1.5 flex items-center justify-between text-xs">
                      <span>{progressClamped}%</span>
                      <span>{STATUS_LABEL[e.status] ?? e.status}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={(`/dashboard/kursus/${e.course.slug}`) as any}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
                    >
                      <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                      {e.status === 'COMPLETED' ? t.dashboard.courses.review : t.dashboard.courses.continue}
                    </Link>
                    {e.status === 'COMPLETED' && certId && (
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={(`/sertifikat/${certId}`) as any}
                        className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
                      >
                        <Award className="h-3.5 w-3.5" aria-hidden />
                        {t.dashboard.courses.viewCertificate}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
