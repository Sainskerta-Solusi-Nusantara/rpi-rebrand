'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  createAssessment,
  type AssessmentCategory,
} from '@/lib/assessments/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

export function CreateAssessmentForm() {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsContent.createAssessmentForm
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AssessmentCategory>('technical')
  const [durationMin, setDurationMin] = useState('30')
  const [passingScore, setPassingScore] = useState('70')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)
    const dn = Number(durationMin)
    const ps = Number(passingScore)
    if (!Number.isFinite(dn) || dn < 1 || dn > 600) {
      setError(tl.errorDuration)
      setFieldError('durationMin')
      return
    }
    if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
      setError(tl.errorPassingScore)
      setFieldError('passingScore')
      return
    }
    startTransition(async () => {
      const r = await createAssessment({
        title: title.trim(),
        description: description.trim(),
        category,
        durationMin: dn,
        passingScore: ps,
      })
      if (!r.ok) {
        setError(r.error)
        setFieldError(r.field ?? null)
        return
      }
      if (r.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/admin/assessments/${r.data.id}/edit` as any)
      }
    })
  }

  const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
    technical: tl.categoryTechnical,
    soft: tl.categorySoft,
    language: tl.categoryLanguage,
    cognitive: tl.categoryCognitive,
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-card space-y-4 rounded-lg border p-5"
    >
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="cf-title" className={labelClass}>
          {tl.titleLabel}
        </label>
        <input
          id="cf-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          placeholder={tl.titlePlaceholder}
          className={inputClass}
          aria-invalid={fieldError === 'title'}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cf-desc" className={labelClass}>
          {tl.descriptionLabel}
        </label>
        <textarea
          id="cf-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
          placeholder={tl.descriptionPlaceholder}
          className={`${inputClass} min-h-[6rem] resize-y`}
          aria-invalid={fieldError === 'description'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="cf-cat" className={labelClass}>
            {tl.categoryLabel}
          </label>
          <select
            id="cf-cat"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as AssessmentCategory)
            }
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(CATEGORY_LABELS) as AssessmentCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="cf-dur" className={labelClass}>
            {tl.durationLabel}
          </label>
          <input
            id="cf-dur"
            type="number"
            min={1}
            max={600}
            step={1}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            disabled={pending}
            className={inputClass}
            aria-invalid={fieldError === 'durationMin'}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="cf-pass" className={labelClass}>
            {tl.passingScoreLabel}
          </label>
          <input
            id="cf-pass"
            type="number"
            min={0}
            max={100}
            step={1}
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            disabled={pending}
            className={inputClass}
            aria-invalid={fieldError === 'passingScore'}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {tl.helperText}
      </p>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? tl.submitPending : tl.submitButton}
        </button>
      </div>
    </form>
  )
}
