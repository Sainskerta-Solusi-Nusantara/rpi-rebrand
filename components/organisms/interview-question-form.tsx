'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import {
  createQuestion,
  updateQuestion,
  QUESTION_CATEGORIES,
  type QuestionCategory,
} from '@/lib/interview-questions/actions'
import { SkillAutocomplete } from '@/components/organisms/skill-autocomplete'

export type QuestionFormInitial = {
  id: string
  text: string
  category: string
  difficulty: number
  tags: string[]
}

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  technical: 'Teknis',
  behavioral: 'Perilaku',
  situational: 'Situasional',
  culture: 'Budaya',
  other: 'Lainnya',
}

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

function isCategory(value: string): value is QuestionCategory {
  return (QUESTION_CATEGORIES as readonly string[]).includes(value)
}

export function QuestionForm({
  tenantSlug,
  initial,
  onSuccess,
  onCancel,
}: {
  tenantSlug: string
  initial?: QuestionFormInitial
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<
    { kind: 'error' | 'success'; message: string } | null
  >(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const isEdit = Boolean(initial)
  const initialCategory: QuestionCategory =
    initial && isCategory(initial.category) ? initial.category : 'technical'

  const [text, setText] = useState<string>(initial?.text ?? '')
  const [category, setCategory] = useState<QuestionCategory>(initialCategory)
  const [difficulty, setDifficulty] = useState<number>(initial?.difficulty ?? 3)
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    setFieldErrors({})

    const trimmed = text.trim()
    if (trimmed.length < 10 || trimmed.length > 1000) {
      setFieldErrors({ text: 'Pertanyaan harus 10-1000 karakter.' })
      return
    }
    if (difficulty < 1 || difficulty > 5) {
      setFieldErrors({ difficulty: 'Tingkat kesulitan harus 1-5.' })
      return
    }
    if (tags.length > 10) {
      setFieldErrors({ tags: 'Maksimal 10 tag.' })
      return
    }

    startTransition(async () => {
      const res =
        isEdit && initial
          ? await updateQuestion({
              questionId: initial.id,
              text: trimmed,
              category,
              difficulty,
              tags,
            })
          : await createQuestion({
              tenantSlug,
              text: trimmed,
              category,
              difficulty,
              tags,
            })

      if (!res.ok) {
        if (res.field) {
          setFieldErrors({ [res.field]: res.error })
        } else {
          setBanner({ kind: 'error', message: res.error })
        }
        return
      }
      setBanner({
        kind: 'success',
        message: isEdit ? 'Pertanyaan diperbarui.' : 'Pertanyaan dibuat.',
      })
      if (!isEdit) {
        // Reset for next entry
        setText('')
        setCategory('technical')
        setDifficulty(3)
        setTags([])
      }
      router.refresh()
      onSuccess?.()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="question-text" className="block text-sm font-medium">
          Pertanyaan
        </label>
        <textarea
          id="question-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={1000}
          required
          disabled={pending}
          placeholder="Tulis pertanyaan wawancara yang jelas dan terbuka…"
          aria-invalid={Boolean(fieldErrors.text)}
          className={inputClass}
        />
        <div className="flex items-center justify-between text-xs">
          {fieldErrors.text ? (
            <p className="text-destructive">{fieldErrors.text}</p>
          ) : (
            <span className="text-muted-foreground">10-1000 karakter</span>
          )}
          <span className="text-muted-foreground">{text.trim().length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="question-category" className="block text-sm font-medium">
            Kategori
          </label>
          <select
            id="question-category"
            value={category}
            onChange={(e) => {
              const v = e.target.value
              if (isCategory(v)) setCategory(v)
            }}
            disabled={pending}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.category)}
          >
            {QUESTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="text-destructive text-xs">{fieldErrors.category}</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="block text-sm font-medium">Tingkat kesulitan</span>
          <div
            role="radiogroup"
            aria-label="Tingkat kesulitan 1-5"
            className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= difficulty
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === n}
                  aria-label={`Tingkat kesulitan ${n}`}
                  onClick={() => setDifficulty(n)}
                  disabled={pending}
                  className="rounded-md p-1 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Star
                    className={
                      active
                        ? 'h-5 w-5 fill-amber-400 text-amber-400'
                        : 'h-5 w-5 text-muted-foreground'
                    }
                    aria-hidden="true"
                  />
                </button>
              )
            })}
            <span className="text-muted-foreground ml-2 text-xs">
              {difficulty}/5
            </span>
          </div>
          {fieldErrors.difficulty && (
            <p className="text-destructive text-xs">{fieldErrors.difficulty}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Tag (opsional)</label>
        <SkillAutocomplete
          value={tags}
          onChange={setTags}
          disabled={pending}
          placeholder="Ketik untuk mencari skill/topik, Enter untuk menambah"
        />
        {fieldErrors.tags ? (
          <p className="text-destructive text-xs">{fieldErrors.tags}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Maksimal 10 tag, otomatis dinormalisasi ke slug.
          </p>
        )}
      </div>

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

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? 'Menyimpan…'
            : isEdit
              ? 'Simpan perubahan'
              : 'Tambah pertanyaan'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="border-input text-foreground inline-flex items-center justify-center rounded-md border bg-transparent px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  )
}
