'use client'

import { useState, useTransition } from 'react'
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
  addJobQuestion,
  deleteJobQuestion,
  reorderJobQuestion,
  updateJobQuestion,
} from '@/lib/jobs/question-actions'
import {
  JOB_QUESTION_TYPES,
  type JobQuestionType,
} from '@/lib/jobs/question-constants'

const CHOICE_TYPES: ReadonlyArray<JobQuestionType> = [
  'single_choice',
  'multi_choice',
]

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondary =
  'border-input bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

const btnGhost =
  'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-60'

export type JobQuestionEditorItem = {
  id: string
  label: string
  type: string
  required: boolean
  options: string[] | null
  helpText: string | null
  order: number
}

function isJobQuestionType(value: string): value is JobQuestionType {
  return (JOB_QUESTION_TYPES as readonly string[]).includes(value)
}

export function JobQuestionEditor({
  jobId,
  initialQuestions,
}: {
  jobId: string
  initialQuestions: JobQuestionEditorItem[]
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tj = t.formsQuizEditors.jobQuestionEditor
  const tjAdd = tj.addForm
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<
    { kind: 'error' | 'success'; message: string } | null
  >(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add-form state
  const [showAdd, setShowAdd] = useState<boolean>(initialQuestions.length === 0)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<JobQuestionType>('short_text')
  const [newRequired, setNewRequired] = useState(false)
  const [newOptions, setNewOptions] = useState<string[]>(['', ''])
  const [newHelpText, setNewHelpText] = useState('')

  function resetAdd() {
    setNewLabel('')
    setNewType('short_text')
    setNewRequired(false)
    setNewOptions(['', ''])
    setNewHelpText('')
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    startTransition(async () => {
      const res = await addJobQuestion({
        jobId,
        label: newLabel.trim(),
        type: newType,
        required: newRequired,
        options: CHOICE_TYPES.includes(newType)
          ? newOptions.map((o) => o.trim()).filter((o) => o.length > 0)
          : undefined,
        helpText: newHelpText.trim() || undefined,
      })
      if (!res.ok) {
        setBanner({ kind: 'error', message: res.error })
        return
      }
      setBanner({ kind: 'success', message: tj.successAdded })
      resetAdd()
      router.refresh()
    })
  }

  function handleReorder(id: string, direction: 'up' | 'down') {
    setBanner(null)
    startTransition(async () => {
      const res = await reorderJobQuestion({ questionId: id, direction })
      if (!res.ok) {
        setBanner({ kind: 'error', message: res.error })
        return
      }
      router.refresh()
    })
  }

  function handleDelete(id: string, label: string) {
    if (
      !window.confirm(
        tj.confirmDeleteQuestion.replace('{label}', label),
      )
    ) {
      return
    }
    setBanner(null)
    startTransition(async () => {
      const res = await deleteJobQuestion(id)
      if (!res.ok) {
        setBanner({ kind: 'error', message: res.error })
        return
      }
      setBanner({ kind: 'success', message: tj.successDeleted })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div
          role={banner.kind === 'error' ? 'alert' : 'status'}
          className={
            banner.kind === 'error'
              ? 'border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm'
              : 'rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400'
          }
        >
          {banner.message}
        </div>
      )}

      {initialQuestions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {tj.emptyState}
        </p>
      ) : (
        <ul className="space-y-3">
          {initialQuestions.map((q, idx) => (
            <li
              key={q.id}
              className="border-border bg-background rounded-lg border p-4"
            >
              {editingId === q.id ? (
                <EditRow
                  question={q}
                  pending={pending}
                  onCancel={() => setEditingId(null)}
                  onSaved={(msg) => {
                    setEditingId(null)
                    setBanner({ kind: 'success', message: msg })
                    router.refresh()
                  }}
                  onError={(msg) => setBanner({ kind: 'error', message: msg })}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground text-sm font-medium">
                          {q.label}
                        </span>
                        {q.required && (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            {tj.requiredBadge}
                          </span>
                        )}
                        <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                          {tj.typeLabels[q.type as JobQuestionType] ?? q.type}
                        </span>
                      </div>
                      {q.helpText && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {q.helpText}
                        </p>
                      )}
                      {q.options && q.options.length > 0 && (
                        <ul className="text-muted-foreground mt-1 list-disc pl-5 text-xs">
                          {q.options.map((o) => (
                            <li key={o}>{o}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorder(q.id, 'up')}
                        disabled={pending || idx === 0}
                        aria-label="Pindah ke atas"
                        className={btnGhost}
                      >
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(q.id, 'down')}
                        disabled={pending || idx === initialQuestions.length - 1}
                        aria-label="Pindah ke bawah"
                        className={btnGhost}
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(q.id)}
                        disabled={pending}
                        className={btnGhost}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        {tj.editButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id, q.label)}
                        disabled={pending}
                        className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        {tj.deleteButton}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showAdd ? (
        <form
          onSubmit={handleAdd}
          className="border-border bg-card space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-sm font-semibold">
              {tjAdd.heading}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                resetAdd()
              }}
              disabled={pending}
              className={btnGhost}
              aria-label={tjAdd.ariaCloseForm}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-1">
            <label htmlFor="q-label" className="block text-sm font-medium">
              {tjAdd.labelFieldLabel} <span className="text-destructive">*</span>
            </label>
            <textarea
              id="q-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              rows={2}
              minLength={5}
              maxLength={300}
              required
              disabled={pending}
              placeholder={tjAdd.labelPlaceholder}
              className={inputClass}
            />
            <p className="text-muted-foreground text-xs">
              {tjAdd.labelHint.replace('{count}', String(newLabel.trim().length))}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="q-type" className="block text-sm font-medium">
                {tjAdd.typeFieldLabel}
              </label>
              <select
                id="q-type"
                value={newType}
                onChange={(e) => {
                  const v = e.target.value
                  if (isJobQuestionType(v)) setNewType(v)
                }}
                disabled={pending}
                className={inputClass}
              >
                {JOB_QUESTION_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {tj.typeLabels[tp]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  disabled={pending}
                  className="border-input bg-background h-4 w-4 rounded border"
                />
                {tjAdd.requiredCheckbox}
              </label>
            </div>
          </div>

          {CHOICE_TYPES.includes(newType) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="block text-sm font-medium">{tjAdd.choicesHeading}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (newOptions.length >= 20) return
                    setNewOptions([...newOptions, ''])
                  }}
                  disabled={pending || newOptions.length >= 20}
                  className={btnGhost}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {tjAdd.addOption}
                </button>
              </div>
              <ul className="space-y-1.5">
                {newOptions.map((opt, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...newOptions]
                        next[idx] = e.target.value.slice(0, 200)
                        setNewOptions(next)
                      }}
                      placeholder={tjAdd.optionPlaceholder.replace('{n}', String(idx + 1))}
                      disabled={pending}
                      maxLength={200}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = newOptions.filter((_, i) => i !== idx)
                        setNewOptions(
                          next.length === 0 ? [''] : next,
                        )
                      }}
                      disabled={pending || newOptions.length <= 1}
                      aria-label={tjAdd.ariaRemoveOption.replace('{n}', String(idx + 1))}
                      className={btnGhost}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs">
                {tjAdd.optionHint}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="q-help" className="block text-sm font-medium">
              {tjAdd.helpTextLabel}{' '}
              <span className="text-muted-foreground font-normal">{tjAdd.helpTextOptional}</span>
            </label>
            <input
              id="q-help"
              type="text"
              value={newHelpText}
              onChange={(e) => setNewHelpText(e.target.value.slice(0, 500))}
              maxLength={500}
              disabled={pending}
              placeholder={tjAdd.helpTextPlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={pending} className={btnPrimary}>
              <Save className="h-4 w-4" aria-hidden />
              {pending ? tjAdd.saving : tjAdd.submitButton}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                resetAdd()
              }}
              disabled={pending}
              className={btnSecondary}
            >
              {tjAdd.cancelButton}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={pending}
          className={btnSecondary}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {tj.addQuestionButton}
        </button>
      )}
    </div>
  )
}

// =============================================================================
// EditRow — inline editor for an existing question
// =============================================================================

function EditRow({
  question,
  pending,
  onCancel,
  onSaved,
  onError,
}: {
  question: JobQuestionEditorItem
  pending: boolean
  onCancel: () => void
  onSaved: (message: string) => void
  onError: (message: string) => void
}) {
  const { t } = useI18n()
  const tj = t.formsQuizEditors.jobQuestionEditor
  const tje = tj.editRow
  const [, startTransition] = useTransition()
  const [label, setLabel] = useState(question.label)
  const [type, setType] = useState<JobQuestionType>(
    isJobQuestionType(question.type) ? question.type : 'short_text',
  )
  const [required, setRequired] = useState(question.required)
  const [options, setOptions] = useState<string[]>(
    question.options && question.options.length > 0
      ? question.options
      : ['', ''],
  )
  const [helpText, setHelpText] = useState(question.helpText ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateJobQuestion({
        questionId: question.id,
        label: label.trim(),
        type,
        required,
        options: CHOICE_TYPES.includes(type)
          ? options.map((o) => o.trim()).filter((o) => o.length > 0)
          : undefined,
        helpText: helpText.trim() || undefined,
      })
      if (!res.ok) {
        onError(res.error)
        return
      }
      onSaved(tj.successUpdated)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-medium">{tje.labelFieldLabel}</label>
        <textarea
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          rows={2}
          minLength={5}
          maxLength={300}
          disabled={pending}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">{tje.typeFieldLabel}</label>
          <select
            value={type}
            onChange={(e) => {
              const v = e.target.value
              if (isJobQuestionType(v)) setType(v)
            }}
            disabled={pending}
            className={inputClass}
          >
            {JOB_QUESTION_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {tj.typeLabels[tp]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              disabled={pending}
              className="border-input bg-background h-4 w-4 rounded border"
            />
            {tje.requiredCheckbox}
          </label>
        </div>
      </div>

      {CHOICE_TYPES.includes(type) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="block text-sm font-medium">{tje.choicesHeading}</span>
            <button
              type="button"
              onClick={() => {
                if (options.length >= 20) return
                setOptions([...options, ''])
              }}
              disabled={pending || options.length >= 20}
              className={btnGhost}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {tje.addOption}
            </button>
          </div>
          <ul className="space-y-1.5">
            {options.map((opt, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options]
                    next[idx] = e.target.value.slice(0, 200)
                    setOptions(next)
                  }}
                  placeholder={tje.optionPlaceholder.replace('{n}', String(idx + 1))}
                  disabled={pending}
                  maxLength={200}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = options.filter((_, i) => i !== idx)
                    setOptions(next.length === 0 ? [''] : next)
                  }}
                  disabled={pending || options.length <= 1}
                  aria-label={tje.ariaRemoveOption.replace('{n}', String(idx + 1))}
                  className={btnGhost}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          {tje.helpTextLabel}{' '}
          <span className="text-muted-foreground font-normal">{tje.helpTextOptional}</span>
        </label>
        <input
          type="text"
          value={helpText}
          onChange={(e) => setHelpText(e.target.value.slice(0, 500))}
          maxLength={500}
          disabled={pending}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          <Save className="h-4 w-4" aria-hidden />
          {tje.saveButton}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className={btnSecondary}
        >
          {tje.cancelButton}
        </button>
      </div>
    </form>
  )
}
