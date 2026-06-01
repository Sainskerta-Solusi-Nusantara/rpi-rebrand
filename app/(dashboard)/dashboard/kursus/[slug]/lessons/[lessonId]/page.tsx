/**
 * Single-lesson player page.
 *
 * Loaded when the user navigates directly to a lesson route. Renders the
 * lesson body (article/video/download URL) and — if the lesson has a quiz —
 * the QuizRunner client component below it. The CourseProgressCard sidebar
 * gives at-a-glance progress + the certificate CTA when complete.
 *
 * Lives at /dashboard/kursus/[slug]/lessons/[lessonId] (separate from the
 * existing course player at /dashboard/kursus/[slug], which uses ?lesson=).
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  PlayCircle,
} from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { CourseProgressCard } from '@/components/organisms/course-progress-card'
import { QuizRunner } from '@/components/organisms/quiz-runner'
import {
  getQuizForLesson,
  getQuizAttemptsForUser,
} from '@/lib/quiz/quiz-queries'
import { startQuizAttempt } from '@/lib/quiz/quiz-actions'
import { MAX_ATTEMPTS_PER_QUIZ } from '@/lib/quiz/quiz-constants'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Pelajaran' }

type Params = { slug: string; lessonId: string }

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

export default async function LessonPage({ params }: { params: Params }) {
  const callback = `/dashboard/kursus/${params.slug}/lessons/${params.lessonId}`
  const session = await requireAuth(callback)
  const userId = session.user.id
  const t = await getServerT()

  const course = await prisma.course.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    select: { id: true, slug: true, title: true },
  })
  if (!course) notFound()

  const lesson = await prisma.lesson.findFirst({
    where: { id: params.lessonId, module: { courseId: course.id } },
    select: {
      id: true,
      title: true,
      contentType: true,
      contentUrl: true,
      contentBody: true,
      quiz: { select: { id: true } },
    },
  })
  if (!lesson) notFound()

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  })
  if (!enrollment) notFound()

  // ---------------------------------------------------------------------------
  // Quiz panel: reuse an in-progress attempt if any, otherwise start fresh.
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
    takenCount: number
  } | null = null
  let quizUnavailable: string | null = null
  let attemptsExhausted = false

  if (lesson.quiz?.id) {
    const quiz = await getQuizForLesson(lesson.id)
    if (!quiz || quiz.questions.length === 0) {
      quizUnavailable = t.dashboard.courses.lesson.quizNotReady
    } else {
      const allAttempts = await getQuizAttemptsForUser(userId, quiz.id)
      const completed = allAttempts.filter((a) => a.completedAt !== null)
      const inProgress = allAttempts.find((a) => a.completedAt === null)

      if (
        !inProgress &&
        completed.length >= MAX_ATTEMPTS_PER_QUIZ
      ) {
        attemptsExhausted = true
      } else {
        let attemptId: string
        if (inProgress) {
          attemptId = inProgress.id
        } else {
          try {
            attemptId = await startQuizAttempt(quiz.id)
          } catch (e: unknown) {
            quizUnavailable =
              e instanceof Error ? e.message : t.dashboard.courses.lesson.quizCannotStart
            attemptId = ''
          }
        }
        if (attemptId) {
          quizPanel = {
            attemptId,
            quiz: {
              id: quiz.id,
              passingScore: quiz.passingScore,
              questions: quiz.questions.map((q) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
              })),
            },
            takenCount: completed.length,
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          href={(`/dashboard/kursus/${course.slug}`) as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.dashboard.courses.lesson.backTo.replace('{course}', course.title)}
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-foreground text-2xl font-semibold md:text-3xl">
          {lesson.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{course.title}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <div className="border-border bg-card rounded-2xl border p-6">
            {lesson.contentType === 'VIDEO' ? (
              lesson.contentUrl ? (
                (() => {
                  const embed = youtubeEmbed(lesson.contentUrl)
                  if (embed) {
                    return (
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                        <iframe
                          src={embed}
                          className="h-full w-full"
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )
                  }
                  return (
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                      <video
                        src={lesson.contentUrl}
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
            ) : lesson.contentType === 'QUIZ' ? (
              <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" aria-hidden />
                {t.dashboard.courses.lesson.quizDoBelow}
              </div>
            ) : (
              <article className="prose prose-sm max-w-none">
                {lesson.contentBody ? (
                  <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">
                    {lesson.contentBody}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {t.dashboard.courses.player.materialUnavailable}
                  </p>
                )}
                {lesson.contentUrl && (
                  <p className="mt-4">
                    <a
                      href={lesson.contentUrl}
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

          {lesson.quiz?.id && (
            <div className="border-border bg-card rounded-2xl border p-6">
              <h2 className="font-heading text-foreground text-lg font-semibold">
                {t.dashboard.courses.lesson.quizSectionTitle}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t.dashboard.courses.lesson.quizSectionDesc}
              </p>
              <div className="mt-5">
                {quizPanel ? (
                  <QuizRunner
                    quiz={quizPanel.quiz}
                    attemptId={quizPanel.attemptId}
                    alreadyTakenCount={quizPanel.takenCount}
                  />
                ) : attemptsExhausted ? (
                  <div className="border-border bg-rose-50 rounded-lg border p-4 text-sm text-rose-800">
                    {t.dashboard.courses.lesson.attemptsExhausted.replace('{n}', String(MAX_ATTEMPTS_PER_QUIZ))}
                  </div>
                ) : (
                  <div className="border-border bg-muted/30 rounded-lg border p-6 text-center">
                    <p className="text-foreground font-medium">
                      {t.dashboard.courses.player.quizUnavailable}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {quizUnavailable ?? t.dashboard.courses.player.notConfiguredFallback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <CourseProgressCard userId={userId} courseId={course.id} />
        </aside>
      </div>
    </div>
  )
}

