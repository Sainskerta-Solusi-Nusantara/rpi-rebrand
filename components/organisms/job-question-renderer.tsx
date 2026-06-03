'use client'

import { inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { Upload, X } from 'lucide-react'
import type { JobQuestionType } from '@/lib/jobs/question-constants'
import { uploadJobAnswerAttachment } from '@/lib/applications/answer-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


export type JobQuestionForRenderer = {
  id: string
  label: string
  type: JobQuestionType
  required: boolean
  options: string[] | null
  helpText: string | null
  order: number
}

export type AnswerMap = Record<string, string>

function parseMultiChoice(value: string | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string')
    }
    return []
  } catch {
    return []
  }
}

export function JobQuestionRenderer({
  questions,
  currentAnswers,
  onChange,
  disabled,
}: {
  questions: JobQuestionForRenderer[]
  currentAnswers: AnswerMap
  onChange: (next: AnswerMap) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const fl = t.formsLearning.jobQuestionRenderer

  if (questions.length === 0) return null

  function setAnswer(questionId: string, value: string) {
    onChange({ ...currentAnswers, [questionId]: value })
  }

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-foreground text-sm font-semibold">
        {fl.sectionHeading}
      </legend>
      <ul className="space-y-4">
        {questions.map((q) => (
          <li key={q.id} className="space-y-1.5">
            <label
              htmlFor={`q-${q.id}`}
              className="text-foreground block text-sm font-medium"
            >
              {q.label}
              {q.required && (
                <span
                  aria-hidden
                  className="text-destructive ml-1"
                  title={fl.requiredTitle}
                >
                  *
                </span>
              )}
            </label>
            {q.helpText && (
              <p className="text-muted-foreground text-xs">{q.helpText}</p>
            )}
            <QuestionField
              question={q}
              value={currentAnswers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
              disabled={disabled}
            />
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

function QuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: JobQuestionForRenderer
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const fl = t.formsLearning.jobQuestionRenderer
  const id = `q-${question.id}`

  switch (question.type) {
    case 'short_text':
      return (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          maxLength={500}
          required={question.required}
          disabled={disabled}
          aria-required={question.required}
          className={inputClass}
        />
      )

    case 'long_text':
      return (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 5000))}
          rows={4}
          maxLength={5000}
          required={question.required}
          disabled={disabled}
          aria-required={question.required}
          className={inputClass}
        />
      )

    case 'single_choice': {
      const opts = question.options ?? []
      return (
        <div
          role="radiogroup"
          aria-required={question.required}
          aria-labelledby={id}
          className="space-y-1.5"
        >
          {opts.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={disabled}
                required={question.required}
                className="border-input bg-background h-4 w-4"
              />
              <span className="text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      )
    }

    case 'multi_choice': {
      const opts = question.options ?? []
      const selected = parseMultiChoice(value)
      function toggle(opt: string, checked: boolean) {
        const next = checked
          ? Array.from(new Set([...selected, opt]))
          : selected.filter((s) => s !== opt)
        onChange(JSON.stringify(next))
      }
      return (
        <div
          role="group"
          aria-required={question.required}
          aria-labelledby={id}
          className="space-y-1.5"
        >
          {opts.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggle(opt, e.target.checked)}
                  disabled={disabled}
                  className="border-input bg-background h-4 w-4 rounded border"
                />
                <span className="text-foreground">{opt}</span>
              </label>
            )
          })}
        </div>
      )
    }

    case 'file_url':
      return (
        <FileUrlField
          questionId={question.id}
          value={value}
          onChange={onChange}
          required={question.required}
          disabled={disabled}
        />
      )

    case 'yes_no':
      return (
        <div
          role="radiogroup"
          aria-required={question.required}
          aria-labelledby={id}
          className="flex flex-wrap gap-3 text-sm"
        >
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={id}
              value="yes"
              checked={value === 'yes'}
              onChange={() => onChange('yes')}
              disabled={disabled}
              required={question.required}
              className="border-input bg-background h-4 w-4"
            />
            {fl.yes}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={id}
              value="no"
              checked={value === 'no'}
              onChange={() => onChange('no')}
              disabled={disabled}
              required={question.required}
              className="border-input bg-background h-4 w-4"
            />
            {fl.no}
          </label>
        </div>
      )

    default:
      return null
  }
}

function FileUrlField({
  questionId,
  value,
  onChange,
  required,
  disabled,
}: {
  questionId: string
  value: string
  onChange: (v: string) => void
  required: boolean
  disabled?: boolean
}) {
  const { t } = useI18n()
  const fl = t.formsLearning.jobQuestionRenderer
  const id = `q-${questionId}-file`
  const [uploading, startUpload] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    startUpload(async () => {
      const res = await uploadJobAnswerAttachment(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onChange(res.data?.url ?? '')
    })
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="file"
          onChange={handleFile}
          disabled={disabled || uploading}
          accept="application/pdf,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,image/*"
          className="text-foreground block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          aria-required={required}
        />
        {uploading && (
          <Upload
            className="text-muted-foreground h-4 w-4 animate-pulse"
            aria-hidden
          />
        )}
      </div>
      {value && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <a
            href={value}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline"
          >
            {fl.uploadedFile}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled || uploading}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            aria-label="Hapus berkas"
          >
            <X className="h-3 w-3" aria-hidden />
            {fl.removeFile}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
