'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-provider'

import {
  addQuestion,
  deleteQuestion,
  deleteQuiz,
  fetchQuizForEditor,
  reorderQuestion,
  updateQuestion,
  upsertQuiz,
  type QuizQuestionType,
} from '@/lib/quizzes/actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

const btnPrimarySm =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondarySm =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

const btnGhostSm =
  'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-60'

export type QuizEditorQuestion = {
  id: string
  text: string
  type: string
  order: number
  choices: Array<{ id: string; text: string; isCorrect: boolean; order: number }>
}

export type QuizEditorQuiz = {
  id: string
  passingScore: number
  shuffle: boolean
  questions: QuizEditorQuestion[]
}

export function QuizEditor({ lessonId }: { lessonId: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tq = t.formsQuizEditors.quizEditor
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [quiz, setQuiz] = useState<QuizEditorQuiz | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [passingScore, setPassingScore] = useState<string>('70')
  const [shuffle, setShuffle] = useState<boolean>(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Initial load + reload after every mutation. Keeps this component self
  // contained so the parent curriculum editor can drop it in with just the
  // lessonId — no extra server query plumbing.
  async function load() {
    const r = await fetchQuizForEditor({ lessonId })
    if (!r.ok) {
      setError(r.error)
      setLoaded(true)
      return
    }
    const next = r.data?.quiz ?? null
    setQuiz(next)
    setPassingScore(String(next?.passingScore ?? 70))
    setShuffle(next?.shuffle ?? false)
    setLoaded(true)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  function refresh() {
    load()
    router.refresh()
  }

  function handleSaveSettings() {
    setError(null)
    const score = Number(passingScore)
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setError(tq.errorPassingScore)
      return
    }
    startTransition(async () => {
      const r = await upsertQuiz({
        lessonId,
        passingScore: score,
        shuffle,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      refresh()
    })
  }

  function handleDeleteQuiz() {
    if (!window.confirm(tq.confirmDeleteQuiz)) {
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await deleteQuiz(lessonId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      refresh()
    })
  }

  function handleDeleteQuestion(qid: string) {
    if (!window.confirm(tq.confirmDeleteQuestion)) return
    setError(null)
    startTransition(async () => {
      const r = await deleteQuestion(qid)
      if (!r.ok) {
        setError(r.error)
        return
      }
      refresh()
    })
  }

  function handleReorder(qid: string, direction: 'up' | 'down') {
    setError(null)
    startTransition(async () => {
      const r = await reorderQuestion({ questionId: qid, direction })
      if (!r.ok) {
        setError(r.error)
        return
      }
      refresh()
    })
  }

  const hasQuiz = Boolean(quiz)

  if (!loaded) {
    return (
      <div className="text-muted-foreground text-xs">{tq.loading}</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">{tq.heading}</h3>
          <p className="text-muted-foreground text-xs">
            {tq.subheading}
          </p>
        </div>
        {hasQuiz && (
          <button
            type="button"
            onClick={handleDeleteQuiz}
            disabled={pending}
            className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {tq.deleteQuiz}
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <label htmlFor={`pscore-${lessonId}`} className={labelClass}>
            {tq.passingScoreLabel}
          </label>
          <input
            id={`pscore-${lessonId}`}
            type="number"
            min={0}
            max={100}
            step={1}
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            disabled={pending}
            className={inputClass}
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-border"
            />
            {tq.shuffleLabel}
          </label>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={pending}
            className={btnPrimarySm}
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {hasQuiz ? tq.saveSettings : tq.activateQuiz}
          </button>
        </div>
      </div>

      {hasQuiz && (
        <>
          <div className="border-border border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">
                {tq.questionsHeading.replace('{count}', String(quiz!.questions.length))}
              </h4>
              {!creating && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  disabled={pending}
                  className={btnSecondarySm}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {tq.addQuestion}
                </button>
              )}
            </div>

            {creating && (
              <div className="mt-3">
                <QuestionForm
                  quizId={quiz!.id}
                  onCancel={() => setCreating(false)}
                  onDone={() => {
                    setCreating(false)
                    refresh()
                  }}
                />
              </div>
            )}

            <ul className="mt-3 space-y-2">
              {quiz!.questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="border-border bg-muted/20 rounded-lg border p-3"
                >
                  {editingId === q.id ? (
                    <QuestionForm
                      quizId={quiz!.id}
                      question={q}
                      onCancel={() => setEditingId(null)}
                      onDone={() => {
                        setEditingId(null)
                        refresh()
                      }}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-[10px] font-medium uppercase">
                            #{idx + 1}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                            {tq.questionTypeLabels[q.type as QuizQuestionType] ??
                              q.type}
                          </span>
                        </div>
                        <p className="text-foreground text-sm font-medium">
                          {q.text}
                        </p>
                        <ul className="text-muted-foreground text-xs">
                          {q.choices.map((c) => (
                            <li
                              key={c.id}
                              className={
                                c.isCorrect
                                  ? 'text-emerald-700 font-medium'
                                  : ''
                              }
                            >
                              {c.isCorrect ? '✓ ' : '· '}
                              {c.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleReorder(q.id, 'up')}
                          disabled={pending || idx === 0}
                          aria-label="Naik"
                          className={btnGhostSm}
                        >
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(q.id, 'down')}
                          disabled={pending || idx === quiz!.questions.length - 1}
                          aria-label="Turun"
                          className={btnGhostSm}
                        >
                          <ChevronDown
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(q.id)}
                          disabled={pending}
                          className={btnGhostSm}
                        >
                          <Pencil
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {tq.editButton}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          disabled={pending}
                          className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
                        >
                          <Trash2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {tq.deleteButton}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {quiz!.questions.length === 0 && !creating && (
                <li className="text-muted-foreground border-border bg-card rounded-lg border p-4 text-center text-xs">
                  {tq.emptyQuestions}
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

type ChoiceDraft = { text: string; isCorrect: boolean }

function defaultChoicesForType(type: QuizQuestionType, trueFalseTrue: string, trueFalseFalse: string): ChoiceDraft[] {
  if (type === 'true_false') {
    return [
      { text: trueFalseTrue, isCorrect: true },
      { text: trueFalseFalse, isCorrect: false },
    ]
  }
  return [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]
}

function QuestionForm({
  quizId,
  question,
  onCancel,
  onDone,
}: {
  quizId: string
  question?: QuizEditorQuestion
  onCancel: () => void
  onDone: () => void
}) {
  const { t } = useI18n()
  const tqf = t.formsQuizEditors.quizEditor.questionForm
  const tqTypes = t.formsQuizEditors.quizEditor.questionTypeLabels
  const isEdit = Boolean(question)
  const [text, setText] = useState(question?.text ?? '')
  const initialType: QuizQuestionType = (question?.type as QuizQuestionType) ??
    'multiple_choice'
  const [type, setType] = useState<QuizQuestionType>(initialType)
  const [choices, setChoices] = useState<ChoiceDraft[]>(
    question
      ? question.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect }))
      : defaultChoicesForType(initialType, tqf.trueFalseTrue, tqf.trueFalseFalse),
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleTypeChange(next: QuizQuestionType) {
    setType(next)
    if (next === 'true_false') {
      setChoices([
        { text: tqf.trueFalseTrue, isCorrect: true },
        { text: tqf.trueFalseFalse, isCorrect: false },
      ])
    } else if (next === 'multiple_choice') {
      // Enforce exactly one correct on switch — keep first existing correct.
      setChoices((prev) => {
        const cleaned = prev.length >= 2 ? prev : defaultChoicesForType(next, tqf.trueFalseTrue, tqf.trueFalseFalse)
        let foundCorrect = false
        return cleaned.map((c) => {
          if (c.isCorrect && !foundCorrect) {
            foundCorrect = true
            return c
          }
          return { ...c, isCorrect: false }
        })
      })
    } else {
      setChoices((prev) =>
        prev.length >= 2 ? prev : defaultChoicesForType(next, tqf.trueFalseTrue, tqf.trueFalseFalse),
      )
    }
  }

  function updateChoice(idx: number, patch: Partial<ChoiceDraft>) {
    setChoices((prev) => {
      const next = prev.slice()
      const cur = next[idx]
      if (!cur) return prev
      const merged = { ...cur, ...patch }
      if (
        type === 'multiple_choice' &&
        patch.isCorrect === true
      ) {
        // Single-correct: clear all others.
        return next.map((c, i) =>
          i === idx ? { ...c, ...patch } : { ...c, isCorrect: false },
        )
      }
      if (type === 'true_false' && patch.isCorrect === true) {
        return next.map((c, i) =>
          i === idx ? { ...c, ...patch } : { ...c, isCorrect: false },
        )
      }
      next[idx] = merged
      return next
    })
  }

  function addChoice() {
    if (type === 'true_false') return
    setChoices((prev) => [...prev, { text: '', isCorrect: false }])
  }

  function removeChoice(idx: number) {
    if (type === 'true_false') return
    setChoices((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)))
  }

  function save() {
    setError(null)
    const trimmedText = text.trim()
    if (trimmedText.length < 3) {
      setError(tqf.errorQuestionMinLength)
      return
    }
    const trimmedChoices = choices.map((c) => ({
      text: c.text.trim(),
      isCorrect: c.isCorrect,
    }))
    if (trimmedChoices.some((c) => !c.text)) {
      setError(tqf.errorChoiceEmpty)
      return
    }
    startTransition(async () => {
      const r = isEdit
        ? await updateQuestion({
            questionId: question!.id,
            text: trimmedText,
            choices: trimmedChoices,
          })
        : await addQuestion({
            quizId,
            text: trimmedText,
            type,
            choices: trimmedChoices,
          })
      if (!r.ok) {
        setError(r.error)
        return
      }
      onDone()
    })
  }

  const hint =
    type === 'multiple_choice'
      ? tqf.hintMultipleChoice
      : type === 'true_false'
        ? tqf.hintTrueFalse
        : tqf.hintMultiSelect

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">
          {isEdit ? tqf.titleEdit : tqf.titleNew}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className={btnGhostSm}
          aria-label="Tutup"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {!isEdit && (
        <div className="space-y-1">
          <label className={labelClass}>{tqf.typeLabel}</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as QuizQuestionType)}
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(tqTypes) as QuizQuestionType[]).map(
              (k) => (
                <option key={k} value={k}>
                  {tqTypes[k]}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className={labelClass}>{tqf.textLabel}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          placeholder={tqf.textPlaceholder}
          className={`${inputClass} min-h-[5rem] resize-y`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelClass}>{tqf.choicesLabel}</label>
          <span className="text-muted-foreground text-[11px]">{hint}</span>
        </div>
        <ul className="space-y-2">
          {choices.map((c, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input
                type={type === 'multi_select' ? 'checkbox' : 'radio'}
                name={`correct-${quizId}`}
                checked={c.isCorrect}
                onChange={(e) =>
                  updateChoice(idx, { isCorrect: e.target.checked })
                }
                disabled={pending}
                aria-label={tqf.ariaMarkCorrect}
                className="h-4 w-4"
              />
              <input
                type="text"
                value={c.text}
                onChange={(e) => updateChoice(idx, { text: e.target.value })}
                disabled={pending || type === 'true_false'}
                placeholder={tqf.choicePlaceholder.replace('{n}', String(idx + 1))}
                className={inputClass}
              />
              {type !== 'true_false' && choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(idx)}
                  disabled={pending}
                  aria-label={tqf.ariaRemoveChoice}
                  className={btnGhostSm}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {type !== 'true_false' && (
          <button
            type="button"
            onClick={addChoice}
            disabled={pending}
            className={btnSecondarySm}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {tqf.addChoice}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={btnPrimarySm}
        >
          {pending ? tqf.saving : isEdit ? tqf.saveEdit : tqf.saveNew}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className={btnSecondarySm}
        >
          {tqf.cancel}
        </button>
      </div>
    </div>
  )
}
