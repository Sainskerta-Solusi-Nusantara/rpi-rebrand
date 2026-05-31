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

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

const btnPrimarySm =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(220,50%,14%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondarySm =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

const btnGhostSm =
  'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-60'

const QUESTION_TYPE_LABELS: Record<AssessmentQuestionType, string> = {
  multiple_choice: 'Pilihan ganda',
  true_false: 'Benar/Salah',
  multi_select: 'Pilihan jamak',
}

const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  technical: 'Teknis',
  soft: 'Soft skill',
  language: 'Bahasa',
  cognitive: 'Kognitif',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draf',
  PUBLISHED: 'Terbit',
  ARCHIVED: 'Arsip',
}

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
      setError('Durasi harus antara 1–600 menit.')
      return
    }
    if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
      setError('Skor lulus harus antara 0–100.')
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
      setInfo('Pengaturan disimpan.')
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
      setInfo('Asesmen telah dipublikasikan.')
      refresh()
    })
  }

  function handleArchive() {
    if (
      !window.confirm(
        'Arsipkan asesmen ini? Kandidat tidak akan dapat memulai percobaan baru.',
      )
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
      setInfo('Asesmen diarsipkan.')
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
      setInfo('Asesmen dikembalikan ke draf.')
      refresh()
    })
  }

  function handleDeleteQuestion(qid: string) {
    if (!window.confirm('Hapus pertanyaan ini?')) return
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
    return <div className="text-muted-foreground text-xs">Memuat asesmen…</div>
  }

  if (!assessment) {
    return (
      <div className="border-border bg-card rounded-lg border p-4 text-sm">
        Asesmen tidak ditemukan.
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
              Pengaturan asesmen
            </h3>
            <p className="text-muted-foreground text-xs">
              Status saat ini:{' '}
              <strong>{STATUS_LABELS[assessment.status] ?? assessment.status}</strong>
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
                Publikasikan
              </button>
            )}
            {assessment.status === 'PUBLISHED' && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={pending}
                className={btnSecondarySm}
              >
                Tarik ke draf
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
                Arsipkan
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="ae-title" className={labelClass}>
              Judul
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
              Deskripsi
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
              Kategori
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
              {(Object.keys(CATEGORY_LABELS) as AssessmentCategory[]).map(
                (c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="ae-dur" className={labelClass}>
              Durasi (menit)
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
              Skor lulus (0–100)
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
            Simpan pengaturan
          </button>
        </div>
      </section>

      {/* QUESTIONS */}
      <section className="border-border bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">
            Pertanyaan ({assessment.questions.length})
          </h4>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={pending}
              className={btnSecondarySm}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah pertanyaan
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
                        {QUESTION_TYPE_LABELS[
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
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={pending}
                      className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {assessment.questions.length === 0 && !creating && (
            <li className="text-muted-foreground border-border bg-card rounded-lg border p-4 text-center text-xs">
              Belum ada pertanyaan. Tambahkan satu untuk memulai.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

type ChoiceDraft = { text: string; isCorrect: boolean }

function defaultChoicesForType(type: AssessmentQuestionType): ChoiceDraft[] {
  if (type === 'true_false') {
    return [
      { text: 'Benar', isCorrect: true },
      { text: 'Salah', isCorrect: false },
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
  const isEdit = Boolean(question)
  const [text, setText] = useState(question?.text ?? '')
  const initialType: AssessmentQuestionType =
    (question?.type as AssessmentQuestionType) ?? 'multiple_choice'
  const [type, setType] = useState<AssessmentQuestionType>(initialType)
  const [choices, setChoices] = useState<ChoiceDraft[]>(
    question
      ? question.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect }))
      : defaultChoicesForType(initialType),
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleTypeChange(next: AssessmentQuestionType) {
    setType(next)
    if (next === 'true_false') {
      setChoices([
        { text: 'Benar', isCorrect: true },
        { text: 'Salah', isCorrect: false },
      ])
    } else if (next === 'multiple_choice') {
      setChoices((prev) => {
        const cleaned = prev.length >= 2 ? prev : defaultChoicesForType(next)
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
        prev.length >= 2 ? prev : defaultChoicesForType(next),
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
      setError('Teks pertanyaan minimal 3 karakter.')
      return
    }
    const trimmedChoices = choices.map((c) => ({
      text: c.text.trim(),
      isCorrect: c.isCorrect,
    }))
    if (trimmedChoices.some((c) => !c.text)) {
      setError('Setiap pilihan harus memiliki teks.')
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
      ? 'Tepat 1 jawaban benar.'
      : type === 'true_false'
        ? 'Tepat 2 pilihan dengan 1 jawaban benar.'
        : 'Minimal 1 jawaban benar; pengguna harus memilih semua jawaban benar.'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">
          {isEdit ? 'Ubah pertanyaan' : 'Pertanyaan baru'}
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
          <label className={labelClass}>Tipe pertanyaan</label>
          <select
            value={type}
            onChange={(e) =>
              handleTypeChange(e.target.value as AssessmentQuestionType)
            }
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(QUESTION_TYPE_LABELS) as AssessmentQuestionType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className={labelClass}>Pertanyaan</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          placeholder="Tulis pertanyaan Anda…"
          className={`${inputClass} min-h-[5rem] resize-y`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Pilihan</label>
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
                placeholder={`Pilihan ${idx + 1}`}
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
            Tambah pilihan
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
            ? 'Menyimpan…'
            : isEdit
              ? 'Simpan perubahan'
              : 'Tambah pertanyaan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className={btnSecondarySm}
        >
          Batal
        </button>
      </div>
    </div>
  )
}
