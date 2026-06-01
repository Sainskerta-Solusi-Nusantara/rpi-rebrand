'use client'

/**
 * QuizRunner — candidate-facing client component that renders the questions
 * for an in-progress attempt and submits the answers to the
 * `submitQuizAttempt` server action.
 *
 * Per spec we render all questions on one page (simpler UX, no pagination
 * state). We track answers in a local map keyed by questionId:
 *   - single-answer types: a 1-element Set
 *   - multi_select: a Set with 1+ elements (order-independent)
 *
 * After submission the result panel shows pass/fail + score + CTAs to either
 * retry (if attempts remain) or jump to the certificate when issued.
 */

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Award,
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react'

import { startQuizAttempt, submitQuizAttempt } from '@/lib/quiz/quiz-actions'
import { MAX_ATTEMPTS_PER_QUIZ } from '@/lib/quiz/quiz-constants'

const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondary =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

export type QuizRunnerQuiz = {
  id: string
  passingScore: number
  questions: Array<{
    id: string
    text: string
    type: string
    choices: Array<{ id: string; text: string }>
  }>
}

type SubmitResult = {
  score: number
  passed: boolean
  certificateIssued: boolean
  certificateId?: string
  certificateNumber?: string
}

export function QuizRunner({
  quiz,
  attemptId: initialAttemptId,
  alreadyTakenCount,
}: {
  quiz: QuizRunnerQuiz
  attemptId: string
  alreadyTakenCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [attemptId, setAttemptId] = useState(initialAttemptId)
  const [taken, setTaken] = useState(alreadyTakenCount)
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({})
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remaining = Math.max(0, MAX_ATTEMPTS_PER_QUIZ - taken)
  const hasQuestions = quiz.questions.length > 0

  const allAnswered = useMemo(() => {
    if (!hasQuestions) return false
    return quiz.questions.every((q) => (answers[q.id]?.size ?? 0) > 0)
  }, [answers, quiz.questions, hasQuestions])

  function toggleChoice(questionId: string, choiceId: string, multi: boolean) {
    setAnswers((prev) => {
      const next = { ...prev }
      const cur = new Set(next[questionId] ?? [])
      if (multi) {
        if (cur.has(choiceId)) cur.delete(choiceId)
        else cur.add(choiceId)
      } else {
        cur.clear()
        cur.add(choiceId)
      }
      next[questionId] = cur
      return next
    })
  }

  function handleSubmit() {
    setError(null)
    if (!hasQuestions) {
      setError('Kuis belum siap')
      return
    }
    const missing = quiz.questions.filter(
      (q) => (answers[q.id]?.size ?? 0) === 0,
    )
    if (missing.length > 0) {
      setError(
        `Mohon jawab semua pertanyaan (${missing.length} masih kosong).`,
      )
      return
    }

    // Build the JSON payload expected by submitQuizAttempt:
    //   { [questionId]: choiceId | choiceId[] }
    const payload: Record<string, string | string[]> = {}
    for (const q of quiz.questions) {
      const set = answers[q.id] ?? new Set<string>()
      const arr = Array.from(set)
      if (q.type === 'multi_select') {
        payload[q.id] = arr
      } else {
        payload[q.id] = arr[0] ?? ''
      }
    }

    startTransition(async () => {
      const r = await submitQuizAttempt(attemptId, payload)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setResult({
        score: r.score,
        passed: r.passed,
        certificateIssued: r.certificateIssued,
        certificateId: r.certificateId,
        certificateNumber: r.certificateNumber,
      })
      // Mark this attempt as counted toward the cap.
      setTaken((t) => t + 1)
      router.refresh()
    })
  }

  function handleRetry() {
    setError(null)
    startTransition(async () => {
      try {
        const newAttemptId = await startQuizAttempt(quiz.id)
        setAttemptId(newAttemptId)
        setAnswers({})
        setResult(null)
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : 'Gagal memulai percobaan baru.'
        setError(msg)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Result panel
  // ---------------------------------------------------------------------------

  if (result) {
    const passMsg = `Selamat! Anda lulus dengan skor ${result.score}%`
    const failMsg = `Belum lulus. Skor: ${result.score}%. Minimum: ${quiz.passingScore}%.`
    const canRetry = !result.passed && remaining > 0
    return (
      <div className="space-y-4">
        <div
          className={
            'border-border rounded-lg border p-6 text-center ' +
            (result.passed ? 'bg-emerald-50' : 'bg-rose-50')
          }
        >
          <div className="flex justify-center">
            {result.passed ? (
              <CheckCircle2
                className="h-10 w-10 text-emerald-600"
                aria-hidden
              />
            ) : (
              <XCircle className="h-10 w-10 text-rose-600" aria-hidden />
            )}
          </div>
          <p
            className={
              'mt-3 text-xl font-semibold ' +
              (result.passed ? 'text-emerald-800' : 'text-rose-800')
            }
          >
            {result.passed ? passMsg : failMsg}
          </p>
          {result.certificateIssued && (
            <p className="mt-2 text-sm font-medium text-emerald-800">
              Sertifikat penyelesaian telah diterbitkan!
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {canRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={pending}
              className={btnSecondary}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Coba lagi (sisa {remaining} percobaan)
            </button>
          )}
          {result.passed && !result.certificateIssued && (
            <button
              type="button"
              onClick={() => router.refresh()}
              disabled={pending}
              className={btnPrimary}
            >
              Lanjut ke pelajaran berikutnya
            </button>
          )}
          {result.certificateIssued && result.certificateNumber && (
            <>
              <Link
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                href={(`/sertifikat/${result.certificateNumber}`) as any}
                className={btnPrimary}
              >
                <Award className="h-4 w-4" aria-hidden />
                Unduh sertifikat
              </Link>
              <Link
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                href={(`/sertifikat/verify/${result.certificateNumber}`) as any}
                className={btnSecondary}
              >
                Verifikasi sertifikat
              </Link>
            </>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Question form
  // ---------------------------------------------------------------------------

  if (!hasQuestions) {
    return (
      <div className="border-border bg-muted/30 rounded-lg border p-6 text-center">
        <p className="text-foreground font-medium">Kuis belum siap</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Kuis ini belum memiliki pertanyaan. Hubungi pengajar Anda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-muted-foreground border-border border-l-4 bg-muted/30 px-4 py-2 text-xs">
        Skor lulus minimum: <strong>{quiz.passingScore}%</strong> · Sisa
        percobaan: <strong>{remaining}</strong> dari {MAX_ATTEMPTS_PER_QUIZ}.
      </div>

      <ol className="space-y-5">
        {quiz.questions.map((q, idx) => {
          const isMulti = q.type === 'multi_select'
          const selected = answers[q.id] ?? new Set<string>()
          return (
            <li
              key={q.id}
              className="border-border bg-card rounded-lg border p-4"
            >
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Pertanyaan {idx + 1} dari {quiz.questions.length}
              </p>
              <p className="text-foreground mt-1 font-medium">{q.text}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {isMulti
                  ? 'Pilih satu atau lebih jawaban'
                  : 'Pilih satu jawaban'}
              </p>
              <ul className="mt-3 space-y-2">
                {q.choices.map((c) => {
                  const checked = selected.has(c.id)
                  return (
                    <li key={c.id}>
                      <label
                        className={
                          'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ' +
                          (checked
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/40')
                        }
                      >
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          checked={checked}
                          onChange={() =>
                            toggleChoice(q.id, c.id, isMulti)
                          }
                          disabled={pending}
                          className="h-4 w-4"
                        />
                        <span>{c.text}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-muted-foreground text-xs">
          {allAnswered
            ? 'Semua pertanyaan terjawab.'
            : 'Beberapa pertanyaan belum dijawab.'}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !allAnswered}
          className={btnPrimary}
        >
          {pending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          Kirim jawaban
        </button>
      </div>
    </div>
  )
}
