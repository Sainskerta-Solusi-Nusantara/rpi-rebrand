'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { upsertScorecard } from '@/lib/scorecards/actions'

type Recommendation =
  | 'strong_hire'
  | 'hire'
  | 'no_hire'
  | 'strong_no_hire'

const RECOMMENDATION_OPTIONS: { value: Recommendation; label: string }[] = [
  { value: 'strong_hire', label: 'Sangat direkomendasikan' },
  { value: 'hire', label: 'Direkomendasikan' },
  { value: 'no_hire', label: 'Tidak direkomendasikan' },
  { value: 'strong_no_hire', label: 'Sangat tidak direkomendasikan' },
]

export type ScorecardFormInitial = {
  ratings: Array<{ criterion: string; score: number }>
  notes: string | null
  recommendation: string
}

type Row = {
  key: string
  criterion: string
  score: number
}

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

let nextKey = 0
function makeKey() {
  nextKey += 1
  return `row-${Date.now()}-${nextKey}`
}

function buildInitialRows(
  initial: ScorecardFormInitial | undefined,
  defaultCriteria: string[],
): Row[] {
  if (initial && initial.ratings.length > 0) {
    return initial.ratings.map((r) => ({
      key: makeKey(),
      criterion: r.criterion,
      score: Math.min(5, Math.max(1, Math.round(r.score))),
    }))
  }
  return defaultCriteria.map((c) => ({
    key: makeKey(),
    criterion: c,
    score: 3,
  }))
}

function isRecommendation(value: string): value is Recommendation {
  return RECOMMENDATION_OPTIONS.some((o) => o.value === value)
}

/**
 * Recruiter scorecard editor. Drives `upsertScorecard` on submit. Stays
 * mounted after save so the recruiter can keep refining without remount —
 * a refresh fetches the canonical row on the parent page.
 */
export function ScorecardForm({
  interviewId,
  initial,
  defaultCriteria,
}: {
  interviewId: string
  initial?: ScorecardFormInitial
  defaultCriteria: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<
    { kind: 'error' | 'success'; message: string } | null
  >(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [rows, setRows] = useState<Row[]>(() =>
    buildInitialRows(initial, defaultCriteria),
  )
  const initialRec: Recommendation =
    initial && isRecommendation(initial.recommendation)
      ? initial.recommendation
      : 'hire'
  const [recommendation, setRecommendation] =
    useState<Recommendation>(initialRec)
  const [notes, setNotes] = useState<string>(initial?.notes ?? '')

  function updateCriterion(key: string, value: string) {
    setRows((cur) =>
      cur.map((r) => (r.key === key ? { ...r, criterion: value } : r)),
    )
  }
  function updateScore(key: string, value: number) {
    setRows((cur) =>
      cur.map((r) => (r.key === key ? { ...r, score: value } : r)),
    )
  }
  function removeRow(key: string) {
    setRows((cur) => cur.filter((r) => r.key !== key))
  }
  function addRow() {
    setRows((cur) => {
      if (cur.length >= 10) return cur
      return [...cur, { key: makeKey(), criterion: '', score: 3 }]
    })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    setFieldErrors({})

    const cleanRows = rows
      .map((r) => ({ criterion: r.criterion.trim(), score: r.score }))
      .filter((r) => r.criterion.length > 0)

    if (cleanRows.length === 0) {
      setFieldErrors({ ratings: 'Minimal satu kriteria penilaian' })
      return
    }
    if (cleanRows.length > 10) {
      setFieldErrors({ ratings: 'Maksimal 10 kriteria penilaian' })
      return
    }

    startTransition(async () => {
      const res = await upsertScorecard({
        interviewId,
        ratings: cleanRows,
        notes: notes.trim() || undefined,
        recommendation,
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
        message: res.data?.created
          ? 'Scorecard disimpan.'
          : 'Scorecard diperbarui.',
      })
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Kriteria penilaian</h3>
          <span className="text-muted-foreground text-xs">
            {rows.length}/10
          </span>
        </div>

        {fieldErrors.ratings && (
          <p className="text-destructive text-xs">{fieldErrors.ratings}</p>
        )}

        <ul className="space-y-3">
          {rows.map((row, idx) => (
            <li
              key={row.key}
              className="border-border bg-background rounded-md border p-3 space-y-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor={`criterion-${row.key}`}
                    className="text-muted-foreground text-xs uppercase"
                  >
                    Kriteria {idx + 1}
                  </label>
                  <input
                    id={`criterion-${row.key}`}
                    type="text"
                    maxLength={100}
                    placeholder="Contoh: Pengetahuan teknis"
                    value={row.criterion}
                    onChange={(e) => updateCriterion(row.key, e.target.value)}
                    disabled={pending}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={pending || rows.length <= 1}
                  className="border-input text-muted-foreground hover:text-destructive hover:border-destructive/30 mt-5 inline-flex items-center justify-center rounded-md border bg-transparent p-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Hapus kriteria"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <fieldset className="space-y-1">
                <legend className="text-muted-foreground text-xs uppercase">
                  Skor
                </legend>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = row.score === n
                    return (
                      <label
                        key={n}
                        className={`inline-flex cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-sm transition ${
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input bg-background text-foreground hover:bg-muted'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`score-${row.key}`}
                          value={n}
                          checked={active}
                          onChange={() => updateScore(row.key, n)}
                          disabled={pending}
                          className="sr-only"
                        />
                        <span>{n}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addRow}
          disabled={pending || rows.length >= 10}
          className="border-input text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah kriteria
        </button>
      </section>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Rekomendasi</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RECOMMENDATION_OPTIONS.map((opt) => {
            const active = recommendation === opt.value
            return (
              <label
                key={opt.value}
                className={`border-border bg-background flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  active ? 'border-primary ring-ring/30 ring-2' : ''
                }`}
              >
                <input
                  type="radio"
                  name="recommendation"
                  value={opt.value}
                  checked={active}
                  onChange={() => setRecommendation(opt.value)}
                  disabled={pending}
                />
                <span>{opt.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium">
          Catatan (opsional)
        </label>
        <textarea
          id="notes"
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending}
          placeholder="Kekuatan, area pengembangan, kekhawatiran, langkah berikutnya…"
          className={inputClass}
        />
        <p className="text-muted-foreground text-xs">
          {notes.length}/5000 karakter
        </p>
        {fieldErrors.notes && (
          <p className="text-destructive text-xs">{fieldErrors.notes}</p>
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
          {pending ? 'Menyimpan…' : 'Simpan scorecard'}
        </button>
      </div>
    </form>
  )
}
