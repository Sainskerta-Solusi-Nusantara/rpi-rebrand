'use client'

import { btnSecondarySm as btnSecondary } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react'

import {
  startAssessmentAttempt,
  submitAssessmentAttempt,
  type SubmitAssessmentAttemptResult,
} from '@/lib/assessments/attempt-actions'

const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'


export type AssessmentTakerData = {
  id: string
  slug: string
  title: string
  passingScore: number
  durationMin: number
  questions: Array<{
    id: string
    text: string
    type: string
    choices: Array<{ id: string; text: string }>
  }>
}

export function AssessmentTaker({
  attemptId: initialAttemptId,
  assessment: initialAssessment,
}: {
  attemptId: string
  assessment: AssessmentTakerData
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState(initialAttemptId)
  const [assessment, setAssessment] = useState<AssessmentTakerData>(
    initialAssessment,
  )
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({})
  const [result, setResult] = useState<SubmitAssessmentAttemptResult | null>(
    null,
  )

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
    const unanswered = assessment.questions.filter(
      (q) => !answers[q.id] || answers[q.id]!.size === 0,
    )
    if (unanswered.length > 0) {
      setError(
        `Mohon jawab semua pertanyaan (${unanswered.length} masih kosong).`,
      )
      return
    }
    const payload = assessment.questions.map((q) => ({
      questionId: q.id,
      choiceIds: Array.from(answers[q.id] ?? []),
    }))
    startTransition(async () => {
      const r = await submitAssessmentAttempt({ attemptId, answers: payload })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setResult(r.data ?? null)
      router.refresh()
    })
  }

  function handleRetry() {
    setError(null)
    startTransition(async () => {
      const r = await startAssessmentAttempt({ assessmentId: assessment.id })
      if (!r.ok) {
        setError(r.error)
        return
      }
      if (r.data) {
        setAttemptId(r.data.attemptId)
        setAssessment(r.data.assessment)
        setAnswers({})
        setResult(null)
        // Navigate to the new attempt URL so refreshes keep working.
        router.replace(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `/dashboard/assesmen/${assessment.slug}/attempt/${r.data.attemptId}` as any,
        )
      }
    })
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div
          className={
            'border-border rounded-lg border p-6 text-center ' +
            (result.passed ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10')
          }
        >
          <div className="flex justify-center">
            {result.passed ? (
              <CheckCircle2
                className="h-10 w-10 text-emerald-600 dark:text-emerald-300"
                aria-hidden="true"
              />
            ) : (
              <XCircle className="h-10 w-10 text-rose-600 dark:text-rose-300" aria-hidden="true" />
            )}
          </div>
          <p
            className={
              'mt-3 text-xl font-semibold ' +
              (result.passed ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300')
            }
          >
            {result.passed ? 'Lulus!' : 'Belum lulus'}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Skor Anda: <strong>{result.score}/100</strong> ·{' '}
            {result.correctCount}/{result.totalCount} benar
          </p>
          <p className="text-muted-foreground text-xs">
            Skor lulus: {assessment.passingScore}
          </p>
          {result.passed && (
            <p className="text-emerald-700 dark:text-emerald-300 mt-3 text-xs">
              Lencana ini sekarang muncul di profil publik Anda (jika profil
              diaktifkan).
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`/dashboard/assesmen/${assessment.slug}` as any}
            className={btnSecondary}
          >
            Lihat ulang
          </Link>
          <button
            type="button"
            onClick={handleRetry}
            disabled={pending}
            className={btnSecondary}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Coba lagi
          </button>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/assesmen' as any}
            className={btnPrimary}
          >
            Ambil tes lain
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-muted-foreground border-border border-l-4 bg-muted/30 px-4 py-2 text-xs">
        Skor lulus minimum: <strong>{assessment.passingScore}</strong> dari 100
        · Estimasi durasi: <strong>{assessment.durationMin} menit</strong>.
      </div>

      <ol className="space-y-5">
        {assessment.questions.map((q, idx) => {
          const isMulti = q.type === 'multi_select'
          const selected = answers[q.id] ?? new Set<string>()
          return (
            <li
              key={q.id}
              className="border-border bg-card rounded-lg border p-4"
            >
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Pertanyaan {idx + 1} dari {assessment.questions.length}
              </p>
              <p className="text-foreground mt-1 font-medium">{q.text}</p>
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
                          onChange={() => toggleChoice(q.id, c.id, isMulti)}
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className={btnPrimary}
        >
          {pending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Kumpulkan jawaban
        </button>
      </div>
    </div>
  )
}
