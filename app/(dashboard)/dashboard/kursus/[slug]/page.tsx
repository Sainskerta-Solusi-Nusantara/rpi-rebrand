import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  PlayCircle,
  Video,
} from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { LessonProgressControls } from '@/components/organisms/lesson-progress-controls'
import { ClaimCertificateButton } from '@/components/organisms/claim-certificate-button'
import { QuizTaker } from '@/components/organisms/quiz-taker'
import { getQuizForAttempt } from '@/lib/quizzes/queries'
import { startAttempt } from '@/lib/quizzes/attempt-actions'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Pemutar Kursus' }

type Params = { slug: string }
type Search = { lesson?: string }

const LESSON_TYPE_ICON = {
  VIDEO: Video,
  ARTICLE: FileText,
  QUIZ: Activity,
  ASSIGNMENT: FileText,
  DOWNLOAD: FileText,
} as const

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
  } catch {
    /* not a URL */
  }
  return null
}

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Search
}) {
  const session = await requireAuth(`/dashboard/kursus/${params.slug}`)
  const userId = session.user.id
  const t = await getServerT()

  const LESSON_TYPE_LABEL: Record<string, string> = {
    VIDEO: t.dashboard.courses.player.lessonTypes.VIDEO,
    ARTICLE: t.dashboard.courses.player.lessonTypes.ARTICLE,
    QUIZ: t.dashboard.courses.player.lessonTypes.QUIZ,
    ASSIGNMENT: t.dashboard.courses.player.lessonTypes.ASSIGNMENT,
    DOWNLOAD: t.dashboard.courses.player.lessonTypes.DOWNLOAD,
  }

  // Resolve the course by slug (PUBLISHED). Slug is tenant-scoped so we use
  // findFirst, mirroring `lib/courses-data.ts#findCourse`.
  const course = await prisma.course.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
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
              contentType: true,
              contentUrl: true,
              contentBody: true,
              order: true,
              durationMin: true,
              quiz: { select: { id: true } },
            },
          },
        },
      },
    },
  })
  if (!course) notFound()

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: {
      id: true,
      status: true,
      progress: true,
      lessonProgress: {
        where: { completedAt: { not: null } },
        select: { lessonId: true },
      },
    },
  })
  if (!enrollment) notFound()

  const completedSet = new Set(enrollment.lessonProgress.map((p) => p.lessonId))

  const flatLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  )
  if (flatLessons.length === 0) notFound()

  // Pick the lesson: ?lesson=id wins, otherwise first not-yet-completed,
  // otherwise the first lesson.
  const requested = searchParams.lesson
    ? flatLessons.find((l) => l.id === searchParams.lesson)
    : undefined
  const firstIncomplete = flatLessons.find((l) => !completedSet.has(l.id))
  const currentLesson = requested ?? firstIncomplete ?? flatLessons[0]!

  const existingCert = await prisma.certificate
    .findFirst({
      where: { userId, courseId: course.id },
      select: { id: true },
    })
    .catch(() => null)

  // ---------------------------------------------------------------------------
  // Quiz support: if the current lesson is a QUIZ with a configured quiz,
  // either resume the in-progress attempt or start a fresh one. We deliberately
  // only autostart when there's no completed attempt yet — otherwise we'd
  // create a new attempt on every page render. Already-passed attempts skip
  // autostart so the user lands directly on the "Lulus" screen via QuizTaker's
  // own retry button.
  // ---------------------------------------------------------------------------
  let quizPanel: {
    attemptId: string
    quiz: {
      id: string
      passingScore: number
      questions: Array<{
        id: string
        text: string
        type: string
        choices: Array<{ id: string; text: string }>
      }>
    }
  } | null = null
  let quizUnavailable: string | null = null

  if (
    currentLesson.contentType === 'QUIZ' &&
    'quiz' in currentLesson &&
    currentLesson.quiz?.id
  ) {
    const quizId = currentLesson.quiz.id
    const forAttempt = await getQuizForAttempt(quizId, userId)
    if (!forAttempt || forAttempt.questions.length === 0) {
      quizUnavailable = t.dashboard.courses.player.quizNoQuestions
    } else {
      // Reuse an in-progress (incomplete) attempt; otherwise start a new one.
      const incomplete = await prisma.quizAttempt.findFirst({
        where: { quizId, userId, completedAt: null },
        orderBy: { startedAt: 'desc' },
        select: { id: true },
      })
      if (incomplete) {
        quizPanel = {
          attemptId: incomplete.id,
          quiz: {
            id: forAttempt.id,
            passingScore: forAttempt.passingScore,
            questions: forAttempt.questions,
          },
        }
      } else {
        const r = await startAttempt({ quizId })
        if (r.ok && r.data) {
          quizPanel = {
            attemptId: r.data.attemptId,
            quiz: {
              id: r.data.quiz.id,
              passingScore: r.data.quiz.passingScore,
              questions: r.data.quiz.questions,
            },
          }
        } else if (!r.ok) {
          quizUnavailable = r.error
        }
      }
    }
  } else if (currentLesson.contentType === 'QUIZ') {
    quizUnavailable = t.dashboard.courses.player.quizNotConfigured
  }

  const progress = Math.max(0, Math.min(100, enrollment.progress))
  const isCompleted = enrollment.status === 'COMPLETED'

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={('/dashboard/kursus') as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.dashboard.courses.player.back}
        </Link>
        {isCompleted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {t.dashboard.courses.player.completedBadge}
          </span>
        )}
      </div>

      <header>
        <h1 className="font-heading text-foreground text-2xl font-semibold md:text-3xl">
          {course.title}
        </h1>
        <div className="mt-3">
          <div
            className="bg-muted h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-center justify-between text-xs">
            <span>{t.dashboard.courses.player.progress.replace('{n}', String(progress))}</span>
            <span>
              {t.dashboard.courses.player.lessonsDone
                .replace('{done}', String(completedSet.size))
                .replace('{total}', String(flatLessons.length))}
            </span>
          </div>
        </div>
      </header>

      {isCompleted && (
        <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <Award className="text-[color:var(--ring)] mt-0.5 h-6 w-6" aria-hidden />
            <div>
              <p className="text-foreground font-medium">{t.dashboard.courses.player.completedTitle}</p>
              <p className="text-muted-foreground text-sm">
                {existingCert
                  ? t.dashboard.courses.player.certificateAvailable
                  : t.dashboard.courses.player.certificateClaim}
              </p>
            </div>
          </div>
          {existingCert ? (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={(`/sertifikat/${existingCert.id}`) as any}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
            >
              <Award className="h-4 w-4" aria-hidden />
              {t.dashboard.courses.player.viewCertificate}
            </Link>
          ) : (
            <ClaimCertificateButton enrollmentId={enrollment.id} />
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar: modules + lessons */}
        <aside className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="border-border border-b px-4 py-3">
            <h2 className="font-heading text-sm font-semibold">{t.dashboard.courses.player.toc}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t.dashboard.courses.player.tocMeta
                .replace('{modules}', String(course.modules.length))
                .replace('{lessons}', String(flatLessons.length))}
            </p>
          </div>
          <ol className="divide-border divide-y">
            {course.modules.map((m, mi) => (
              <li key={m.id}>
                <details open={m.lessons.some((l) => l.id === currentLesson.id)}>
                  <summary className="hover:bg-muted/40 cursor-pointer px-4 py-3 text-sm font-medium">
                    {mi + 1}. {m.title}
                  </summary>
                  <ul className="border-border divide-border divide-y border-t">
                    {m.lessons.map((l) => {
                      const done = completedSet.has(l.id)
                      const active = l.id === currentLesson.id
                      const Icon = LESSON_TYPE_ICON[l.contentType] ?? FileText
                      return (
                        <li key={l.id}>
                          <Link
                            href={
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (`/dashboard/kursus/${course.slug}?lesson=${l.id}`) as any
                            }
                            className={
                              (active
                                ? 'bg-primary/10 text-primary '
                                : 'hover:bg-muted/40 text-foreground/85 ') +
                              'flex items-center gap-2.5 px-4 py-2.5 pl-6 text-xs transition'
                            }
                          >
                            {done ? (
                              <CheckCircle2
                                className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                                aria-hidden
                              />
                            ) : (
                              <Icon
                                className="text-muted-foreground h-4 w-4 shrink-0"
                                aria-hidden
                              />
                            )}
                            <span className="flex-1 truncate">{l.title}</span>
                            <span className="text-muted-foreground shrink-0 text-[10px]">
                              {l.durationMin} {t.dashboard.courses.player.minutesShort}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </details>
              </li>
            ))}
          </ol>
        </aside>

        {/* Main: current lesson */}
        <section className="space-y-5">
          <div className="border-border bg-card rounded-2xl border p-6">
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {LESSON_TYPE_LABEL[currentLesson.contentType] ?? currentLesson.contentType}
            </div>
            <h2 className="font-heading text-foreground mt-1 text-xl font-semibold md:text-2xl">
              {currentLesson.title}
            </h2>

            <div className="mt-5">
              {currentLesson.contentType === 'VIDEO' ? (
                currentLesson.contentUrl ? (
                  (() => {
                    const embed = youtubeEmbed(currentLesson.contentUrl)
                    if (embed) {
                      return (
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                          <iframe
                            src={embed}
                            className="h-full w-full"
                            title={currentLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )
                    }
                    return (
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                        <video
                          src={currentLesson.contentUrl}
                          controls
                          className="h-full w-full"
                        />
                      </div>
                    )
                  })()
                ) : (
                  <div className="border-border bg-muted/30 grid aspect-video place-items-center rounded-lg border">
                    <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                      <PlayCircle className="h-5 w-5" aria-hidden />
                      {t.dashboard.courses.player.videoUnavailable}
                    </span>
                  </div>
                )
              ) : currentLesson.contentType === 'QUIZ' ? (
                quizPanel ? (
                  <QuizTaker
                    attemptId={quizPanel.attemptId}
                    quiz={quizPanel.quiz}
                  />
                ) : (
                  <div className="border-border bg-muted/30 rounded-lg border p-6 text-center">
                    <Activity
                      className="text-muted-foreground mx-auto h-8 w-8"
                      aria-hidden
                    />
                    <p className="text-foreground mt-2 font-medium">
                      {t.dashboard.courses.player.quizUnavailable}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {quizUnavailable ?? t.dashboard.courses.player.notConfiguredFallback}
                    </p>
                  </div>
                )
              ) : (
                <article className="prose prose-sm max-w-none">
                  {currentLesson.contentBody ? (
                    <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">
                      {currentLesson.contentBody}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      {t.dashboard.courses.player.materialUnavailable}
                    </p>
                  )}
                  {currentLesson.contentUrl && (
                    <p className="mt-4">
                      <a
                        href={currentLesson.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
                      >
                        <BookOpen className="h-4 w-4" aria-hidden />
                        {t.dashboard.courses.player.openMaterial}
                      </a>
                    </p>
                  )}
                </article>
              )}
            </div>
          </div>

          <LessonProgressControls
            enrollmentId={enrollment.id}
            lessonId={currentLesson.id}
            completed={completedSet.has(currentLesson.id)}
          />
        </section>
      </div>
    </div>
  )
}
