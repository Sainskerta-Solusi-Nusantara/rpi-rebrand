'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react'

import {
  addQuestion,
  archiveAssessment,
  deleteQuestion,
  fetchAssessmentForEditor,
  publishAssessment,
  reorderQuestion,
  unpublishAssessment,
  updateAssessment,
  updateQuestion,
  type AssessmentCategory,
  type AssessmentQuestionType,
} from '@/lib/assessments/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

const btnPrimarySm =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(220,50%,14%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondarySm =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

const btnGhostSm =
  'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-60'

export type AssessmentEditorQuestion = {
  id: string
  text: string
  type: string
  order: number
  choices: Array<{ id: string; text: string; isCorrect: boolean; order: number }>
}

export type AssessmentEditorData = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  durationMin: number
  passingScore: number
  status: string
  questions: AssessmentEditorQuestion[]
}

export function AssessmentEditor({
  assessmentId,
}: {
  assessmentId: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const fe = t.formsEditor
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [assessment, setAssessment] = useState<AssessmentEditorData | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Editable settings — synced from loaded data, dirty-state controlled locally.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AssessmentCategory>('technical')
  const [durationMin, setDurationMin] = useState('30')
  const [passingScore, setPassingScore] = useState('70')

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    const r = await fetchAssessmentForEditor({ assessmentId })
    if (!r.ok) {
      setError(r.error)
      setLoaded(true)
      return
    }
    const next = r.data?.assessment ?? null
    setAssessment(next)
    if (next) {
      setTitle(next.title)
      setDescription(next.description)
      setCategory(next.category as AssessmentCategory)
      setDurationMin(String(next.durationMin))
      setPassingScore(String(next.passingScore))
    }
    setLoaded(true)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId])

  function refresh() {
    load()
    router.refresh()
  }

  function handleSaveSettings() {
    setError(null)
    setInfo(null)
    const dn = Number(durationMin)
    const ps = Number(passingScore)
    if (!Number.isFinite(dn) || dn < 1 || dn > 600) {
      setError(fe.messages.errorDuration)
      return
    }
    if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
      setError(fe.messages.errorPassingScore)
      return
    }
    startTransition(async () => {
      const r = await updateAssessment({
        assessmentId,
        title: title.trim(),
        description: description.trim(),
        category,
        durationMin: dn,
        passingScore: ps,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo(fe.messages.settingsSaved)
      refresh()
    })
  }

  function handlePublish() {
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const r = await publishAssessment(assessmentId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo(fe.messages.published)
      refresh()
    })
  }

  function handleArchive() {
    if (
      !window.confirm(fe.messages.confirmArchive)
    ) {
      return
    }
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const r = await archiveAssessment(assessmentId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo(fe.messages.archived)
      refresh()
    })
  }

  function handleUnpublish() {
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const r = await unpublishAssessment(assessmentId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo(fe.messages.unpublished)
      refresh()
    })
  }

  function handleDeleteQuestion(qid: string) {
    if (!window.confirm(fe.messages.confirmDeleteQuestion)) return
    setError(null)
    setInfo(null)
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

  if (!loaded) {
    return <div className="text-muted-foreground text-xs">{fe.loading}</div>
  }

  if (!assessment) {
    return (
      <div className="border-border bg-card rounded-lg border p-4 text-sm">
        {fe.notFound}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      {info && !error && (
        <p
          role="status"
          className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
        >
          {info}
        </p>
      )}

      {/* SETTINGS PANEL */}
      <section className="border-border bg-card rounded-lg border p-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-semibold">
              {fe.settings.heading}
            </h3>
            <p className="text-muted-foreground text-xs">
              {fe.settings.currentStatus}{' '}
              <strong>{fe.status[assessment.status as keyof typeof fe.status] ?? assessment.status}</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.status !== 'PUBLISHED' && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={pending}
                className={btnPrimarySm}
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {fe.settings.publish}
              </button>
            )}
            {assessment.status === 'PUBLISHED' && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={pending}
                className={btnSecondarySm}
              >
                {fe.settings.unpublish}
              </button>
            )}
            {assessment.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={pending}
                className={btnSecondarySm}
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                {fe.settings.archive}
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="ae-title" className={labelClass}>
              {fe.settings.titleLabel}
            </label>
            <input
              id="ae-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              className={inputClass}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="ae-desc" className={labelClass}>
              {fe.settings.descriptionLabel}
            </label>
            <textarea
              id="ae-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              className={`${inputClass} min-h-[5rem] resize-y`}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ae-cat" className={labelClass}>
              {fe.settings.categoryLabel}
            </label>
            <select
              id="ae-cat"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as AssessmentCategory)
              }
              disabled={pending}
              className={inputClass}
            >
              {(Object.keys(fe.category) as AssessmentCategory[]).map(
                (c) => (
                  <option key={c} value={c}>
                    {fe.category[c as keyof typeof fe.category]}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="ae-dur" className={labelClass}>
              {fe.settings.durationLabel}
            </label>
            <input
              id="ae-dur"
              type="number"
              min={1}
              max={600}
              step={1}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              disabled={pending}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ae-pass" className={labelClass}>
              {fe.settings.passingScoreLabel}
            </label>
            <input
              id="ae-pass"
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
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={pending}
            className={btnPrimarySm}
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {fe.settings.saveButton}
          </button>
        </div>
      </section>

      {/* QUESTIONS */}
      <section className="border-border bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">
            {fe.questions.heading.replace('{count}', String(assessment.questions.length))}
          </h4>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={pending}
              className={btnSecondarySm}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {fe.questions.addButton}
            </button>
          )}
        </div>

        {creating && (
          <div className="mt-3">
            <QuestionForm
              assessmentId={assessment.id}
              onCancel={() => setCreating(false)}
              onDone={() => {
                setCreating(false)
                refresh()
              }}
            />
          </div>
        )}

        <ul className="mt-3 space-y-2">
          {assessment.questions.map((q, idx) => (
            <li
              key={q.id}
              className="border-border bg-muted/20 rounded-lg border p-3"
            >
              {editingId === q.id ? (
                <QuestionForm
                  assessmentId={assessment.id}
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
                        {fe.questionType[
                          q.type as AssessmentQuestionType
                        ] ?? q.type}
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
                            c.isCorrect ? 'text-emerald-700 font-medium' : ''
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
                      <ChevronUp
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(q.id, 'down')}
                      disabled={
                        pending || idx === assessment.questions.length - 1
                      }
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
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {fe.questions.editButton}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={pending}
                      className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {fe.questions.deleteButton}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {assessment.questions.length === 0 && !creating && (
            <li className="text-muted-foreground border-border bg-card rounded-lg border p-4 text-center text-xs">
              {fe.questions.empty}
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

type ChoiceDraft = { text: string; isCorrect: boolean }

function defaultChoicesForType(
  type: AssessmentQuestionType,
  trueLabel: string,
  falseLabel: string,
): ChoiceDraft[] {
  if (type === 'true_false') {
    return [
      { text: trueLabel, isCorrect: true },
      { text: falseLabel, isCorrect: false },
    ]
  }
  return [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]
}

function QuestionForm({
  assessmentId,
  question,
  onCancel,
  onDone,
}: {
  assessmentId: string
  question?: AssessmentEditorQuestion
  onCancel: () => void
  onDone: () => void
}) {
  const { t } = useI18n()
  const fe = t.formsEditor
  const isEdit = Boolean(question)
  const [text, setText] = useState(question?.text ?? '')
  const initialType: AssessmentQuestionType =
    (question?.type as AssessmentQuestionType) ?? 'multiple_choice'
  const [type, setType] = useState<AssessmentQuestionType>(initialType)
  const [choices, setChoices] = useState<ChoiceDraft[]>(
    question
      ? question.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect }))
      : defaultChoicesForType(initialType, fe.questionForm.trueFalseTrue, fe.questionForm.trueFalseFalse),
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleTypeChange(next: AssessmentQuestionType) {
    setType(next)
    if (next === 'true_false') {
      setChoices([
        { text: fe.questionForm.trueFalseTrue, isCorrect: true },
        { text: fe.questionForm.trueFalseFalse, isCorrect: false },
      ])
    } else if (next === 'multiple_choice') {
      setChoices((prev) => {
        const cleaned = prev.length >= 2 ? prev : defaultChoicesForType(next, fe.questionForm.trueFalseTrue, fe.questionForm.trueFalseFalse)
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
        prev.length >= 2 ? prev : defaultChoicesForType(next, fe.questionForm.trueFalseTrue, fe.questionForm.trueFalseFalse),
      )
    }
  }

  function updateChoice(idx: number, patch: Partial<ChoiceDraft>) {
    setChoices((prev) => {
      const next = prev.slice()
      const cur = next[idx]
      if (!cur) return prev
      const merged = { ...cur, ...patch }
      if (type === 'multiple_choice' && patch.isCorrect === true) {
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
    setChoices((prev) =>
      prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx),
    )
  }

  function save() {
    setError(null)
    const trimmedText = text.trim()
    if (trimmedText.length < 3) {
      setError(fe.messages.errorQuestionMinLength)
      return
    }
    const trimmedChoices = choices.map((c) => ({
      text: c.text.trim(),
      isCorrect: c.isCorrect,
    }))
    if (trimmedChoices.some((c) => !c.text)) {
      setError(fe.messages.errorChoiceEmpty)
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
            assessmentId,
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
      ? fe.questionForm.hintMultipleChoice
      : type === 'true_false'
        ? fe.questionForm.hintTrueFalse
        : fe.questionForm.hintMultiSelect

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">
          {isEdit ? fe.questionForm.titleEdit : fe.questionForm.titleNew}
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
          <label className={labelClass}>{fe.questionForm.typeLabel}</label>
          <select
            value={type}
            onChange={(e) =>
              handleTypeChange(e.target.value as AssessmentQuestionType)
            }
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(fe.questionType) as AssessmentQuestionType[]).map(
              (qt) => (
                <option key={qt} value={qt}>
                  {fe.questionType[qt as keyof typeof fe.questionType]}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className={labelClass}>{fe.questionForm.textLabel}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          placeholder={fe.questionForm.textPlaceholder}
          className={`${inputClass} min-h-[5rem] resize-y`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelClass}>{fe.questionForm.choicesLabel}</label>
          <span className="text-muted-foreground text-[11px]">{hint}</span>
        </div>
        <ul className="space-y-2">
          {choices.map((c, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input
                type={type === 'multi_select' ? 'checkbox' : 'radio'}
                name={`correct-${assessmentId}`}
                checked={c.isCorrect}
                onChange={(e) =>
                  updateChoice(idx, { isCorrect: e.target.checked })
                }
                disabled={pending}
                aria-label="Tandai sebagai jawaban benar"
                className="h-4 w-4"
              />
              <input
                type="text"
                value={c.text}
                onChange={(e) => updateChoice(idx, { text: e.target.value })}
                disabled={pending || type === 'true_false'}
                placeholder={fe.questionForm.choicePlaceholder.replace('{n}', String(idx + 1))}
                className={inputClass}
              />
              {type !== 'true_false' && choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(idx)}
                  disabled={pending}
                  aria-label="Hapus pilihan"
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
            {fe.questionForm.addChoice}
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
          {pending
            ? fe.questionForm.saving
            : isEdit
              ? fe.questionForm.saveEdit
              : fe.questionForm.saveNew}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className={btnSecondarySm}
        >
          {fe.questionForm.cancel}
        </button>
      </div>
    </div>
  )
}
