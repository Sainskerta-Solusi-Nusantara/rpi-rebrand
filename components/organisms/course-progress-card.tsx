/**
 * CourseProgressCard — server component that summarises a user's progress on
 * a course: progress bar, lesson checklist with quiz pass status, and the
 * "Unduh sertifikat" CTA when the course is complete.
 *
 * Lookups go through `getCourseProgress` (cached) for the aggregate numbers
 * and a direct Prisma query for the per-lesson detail. Because this is a
 * Server Component we read the DB directly — no actions involved.
 */

import Link from 'next/link'
import {
  Award,
  CheckCircle2,
  Circle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'

import { prisma } from '@/lib/db'
import { getCourseProgress } from '@/lib/quiz/quiz-queries'

export async function CourseProgressCard({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}) {
  if (!userId || !courseId) return null

  const [progress, course] = await Promise.all([
    getCourseProgress(userId, courseId),
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                quiz: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
  ])

  if (!course) return null

  // Per-lesson completion + quiz-pass lookup.
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: {
      id: true,
      lessonProgress: {
        where: { completedAt: { not: null } },
        select: { lessonId: true },
      },
    },
  })
  const completedLessons = new Set(
    enrollment?.lessonProgress.map((p) => p.lessonId) ?? [],
  )

  const quizIds = course.modules
    .flatMap((m) => m.lessons.map((l) => l.quiz?.id))
    .filter((id): id is string => Boolean(id))

  let passedQuizzes = new Set<string>()
  if (quizIds.length > 0) {
    const rows = await prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds }, passed: true },
      select: { quizId: true },
      distinct: ['quizId'],
    })
    passedQuizzes = new Set(rows.map((r) => r.quizId))
  }

  const certificate = progress.certificate

  return (
    <div className="border-border bg-card space-y-4 rounded-2xl border p-5">
      <div>
        <h3 className="font-heading text-foreground text-base font-semibold">
          Progres Anda
        </h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {progress.completedLessons}/{progress.totalLessons} pelajaran selesai
          {progress.totalQuizzes > 0 && (
            <>
              {' '}· {progress.passedQuizzes}/{progress.totalQuizzes} kuis
              lulus
            </>
          )}
        </p>
      </div>

      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Persen penyelesaian"
      >
        <div
          className="bg-primary h-full transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="text-muted-foreground text-right text-xs">
        {progress.percent}%
      </p>

      {certificate && (
        <div className="border-border bg-emerald-50 flex flex-wrap items-start gap-3 rounded-lg border p-3">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 text-emerald-700"
            aria-hidden
          />
          <div className="flex-1">
            <p className="text-emerald-900 text-sm font-medium">
              Sertifikat tersedia
            </p>
            {certificate.certificateNumber && (
              <p className="font-mono text-emerald-800 text-xs">
                {certificate.certificateNumber}
              </p>
            )}
          </div>
          {certificate.certificateNumber && (
            <Link
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              href={(`/sertifikat/${certificate.certificateNumber}`) as any}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
            >
              <Award className="h-3.5 w-3.5" aria-hidden />
              Unduh sertifikat
            </Link>
          )}
        </div>
      )}

      <ol className="border-border divide-border divide-y rounded-md border">
        {course.modules.map((m) => (
          <li key={m.id} className="p-3">
            <p className="text-foreground text-sm font-medium">{m.title}</p>
            <ul className="mt-2 space-y-1">
              {m.lessons.map((l) => {
                const done = completedLessons.has(l.id)
                const quizPassed = l.quiz?.id
                  ? passedQuizzes.has(l.quiz.id)
                  : null
                return (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    {done ? (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                    ) : (
                      <Circle
                        className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                        aria-hidden
                      />
                    )}
                    <span
                      className={
                        done
                          ? 'text-foreground/85 flex-1 truncate'
                          : 'text-muted-foreground flex-1 truncate'
                      }
                    >
                      {l.title}
                    </span>
                    {quizPassed !== null && (
                      <span
                        className={
                          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ' +
                          (quizPassed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700')
                        }
                        title={quizPassed ? 'Kuis lulus' : 'Kuis belum lulus'}
                      >
                        <HelpCircle className="h-3 w-3" aria-hidden />
                        {quizPassed ? 'Lulus' : 'Belum'}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
