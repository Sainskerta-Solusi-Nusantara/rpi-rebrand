'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { LessonContentType } from '@prisma/client'
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  updateLesson,
  updateModule,
} from '@/lib/tenants/course-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClass = `${inputClass} min-h-[6rem] resize-y leading-relaxed`

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

const btnPrimarySm =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(220,50%,14%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondarySm =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

const btnGhostSm =
  'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-60'

const CONTENT_TYPE_LABELS: Record<LessonContentType, string> = {
  VIDEO: 'Video',
  ARTICLE: 'Artikel',
  QUIZ: 'Kuis',
  ASSIGNMENT: 'Tugas',
  DOWNLOAD: 'Unduhan',
}

const CONTENT_TYPE_TONES: Record<LessonContentType, string> = {
  VIDEO: 'bg-blue-100 text-blue-800',
  ARTICLE: 'bg-emerald-100 text-emerald-800',
  QUIZ: 'bg-purple-100 text-purple-800',
  ASSIGNMENT: 'bg-amber-100 text-amber-800',
  DOWNLOAD: 'bg-stone-200 text-stone-800',
}

export type CurriculumLesson = {
  id: string
  title: string
  contentType: LessonContentType
  contentUrl: string | null
  contentBody: string | null
  order: number
  durationMin: number
}

export type CurriculumModule = {
  id: string
  title: string
  order: number
  lessons: CurriculumLesson[]
}

export function CurriculumEditor({
  courseId,
  modules,
  canEdit,
}: {
  courseId: string
  modules: CurriculumModule[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const m of modules) map[m.id] = true
    return map
  })
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [creatingModule, setCreatingModule] = useState(false)

  const [newModuleTitle, setNewModuleTitle] = useState('')

  function refresh() {
    router.refresh()
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleCreateModule() {
    if (!newModuleTitle.trim()) {
      setError('Judul modul tidak boleh kosong.')
      return
    }
    setError(null)
    const nextOrder = modules.length
    startTransition(async () => {
      const r = await createModule({
        courseId,
        title: newModuleTitle.trim(),
        order: nextOrder,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setNewModuleTitle('')
      setCreatingModule(false)
      refresh()
    })
  }

  function handleDeleteModule(moduleId: string, title: string) {
    if (
      !window.confirm(
        `Hapus modul "${title}"? Semua pelajaran di dalamnya akan ikut terhapus.`,
      )
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await deleteModule(moduleId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      refresh()
    })
  }

  function handleMoveModule(moduleId: string, direction: -1 | 1) {
    const idx = modules.findIndex((m) => m.id === moduleId)
    if (idx === -1) return
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= modules.length) return
    const current = modules[idx]
    const other = modules[swapIdx]
    if (!current || !other) return
    setError(null)
    startTransition(async () => {
      const a = await updateModule({
        moduleId: current.id,
        order: other.order,
      })
      if (!a.ok) {
        setError(a.error)
        return
      }
      const b = await updateModule({
        moduleId: other.id,
        order: current.order,
      })
      if (!b.ok) {
        setError(b.error)
        return
      }
      refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl">Kurikulum</h2>
        {canEdit && !creatingModule && (
          <button
            type="button"
            onClick={() => setCreatingModule(true)}
            disabled={pending}
            className={btnPrimarySm}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Tambah modul
          </button>
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

      {canEdit && creatingModule && (
        <div className="border-border bg-card space-y-3 rounded-2xl border p-4">
          <div className="space-y-1">
            <label htmlFor="new-module-title" className={labelClass}>
              Judul modul
            </label>
            <input
              id="new-module-title"
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              disabled={pending}
              placeholder="Pengantar Next.js"
              className={inputClass}
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCreateModule}
              disabled={pending}
              className={btnPrimarySm}
            >
              {pending ? 'Menyimpan…' : 'Simpan modul'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingModule(false)
                setNewModuleTitle('')
              }}
              disabled={pending}
              className={btnSecondarySm}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {modules.length === 0 && !creatingModule && (
        <p className="text-muted-foreground border-border bg-card rounded-2xl border p-6 text-center text-sm">
          Belum ada modul. Tambahkan modul pertama untuk memulai.
        </p>
      )}

      <ol className="space-y-3">
        {modules.map((m, idx) => (
          <li
            key={m.id}
            className="border-border bg-card overflow-hidden rounded-2xl border"
          >
            <div className="flex items-start justify-between gap-3 p-4">
              <button
                type="button"
                onClick={() => toggleExpand(m.id)}
                className="flex flex-1 items-start gap-2 text-left"
              >
                {expanded[m.id] ? (
                  <ChevronUp
                    className="text-muted-foreground mt-1 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="text-muted-foreground mt-1 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    Modul {idx + 1}
                  </p>
                  <p className="text-foreground font-medium">{m.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.lessons.length} pelajaran
                  </p>
                </div>
              </button>
              {canEdit && (
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveModule(m.id, -1)}
                    disabled={pending || idx === 0}
                    aria-label="Pindahkan ke atas"
                    className={btnGhostSm}
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveModule(m.id, 1)}
                    disabled={pending || idx === modules.length - 1}
                    aria-label="Pindahkan ke bawah"
                    className={btnGhostSm}
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingModuleId(
                        editingModuleId === m.id ? null : m.id,
                      )
                    }
                    disabled={pending}
                    className={btnGhostSm}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteModule(m.id, m.title)}
                    disabled={pending}
                    className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {canEdit && editingModuleId === m.id && (
              <ModuleEditInline
                module={m}
                onCancel={() => setEditingModuleId(null)}
                onDone={() => {
                  setEditingModuleId(null)
                  refresh()
                }}
              />
            )}

            {expanded[m.id] && (
              <ModuleLessonsSection
                module={m}
                canEdit={canEdit}
                onChanged={refresh}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ModuleEditInline({
  module: m,
  onCancel,
  onDone,
}: {
  module: CurriculumModule
  onCancel: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState(m.title)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    startTransition(async () => {
      const r = await updateModule({ moduleId: m.id, title })
      if (!r.ok) {
        setError(r.error)
        return
      }
      onDone()
    })
  }

  return (
    <div className="border-border border-t bg-muted/30 space-y-3 p-4">
      <div className="space-y-1">
        <label htmlFor={`edit-mod-${m.id}`} className={labelClass}>
          Judul modul
        </label>
        <input
          id={`edit-mod-${m.id}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          className={inputClass}
        />
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
          {pending ? 'Menyimpan…' : 'Simpan'}
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

function ModuleLessonsSection({
  module: m,
  canEdit,
  onChanged,
}: {
  module: CurriculumModule
  canEdit: boolean
  onChanged: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDeleteLesson(lessonId: string, title: string) {
    if (!window.confirm(`Hapus pelajaran "${title}"?`)) return
    setError(null)
    startTransition(async () => {
      const r = await deleteLesson(lessonId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      onChanged()
    })
  }

  return (
    <div className="border-border bg-muted/20 border-t">
      {error && (
        <p
          role="alert"
          className="border-border border-b px-4 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <ul className="divide-border divide-y">
        {m.lessons.map((l) => (
          <li key={l.id} className="p-3">
            {editingLessonId === l.id ? (
              <LessonForm
                moduleId={m.id}
                lesson={l}
                onCancel={() => setEditingLessonId(null)}
                onDone={() => {
                  setEditingLessonId(null)
                  onChanged()
                }}
              />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CONTENT_TYPE_TONES[l.contentType]}`}
                    >
                      {CONTENT_TYPE_LABELS[l.contentType]}
                    </span>
                    <p className="text-foreground text-sm font-medium">
                      {l.title}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {l.durationMin} menit · urutan #{l.order}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingLessonId(l.id)}
                      disabled={pending}
                      className={btnGhostSm}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(l.id, l.title)}
                      disabled={pending}
                      className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
        {m.lessons.length === 0 && !creating && (
          <li className="text-muted-foreground p-4 text-center text-xs">
            Belum ada pelajaran di modul ini.
          </li>
        )}
      </ul>

      {canEdit && (
        <div className="border-border border-t p-3">
          {creating ? (
            <LessonForm
              moduleId={m.id}
              defaultOrder={m.lessons.length}
              onCancel={() => setCreating(false)}
              onDone={() => {
                setCreating(false)
                onChanged()
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={pending}
              className={btnSecondarySm}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah pelajaran
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LessonForm({
  moduleId,
  lesson,
  defaultOrder,
  onCancel,
  onDone,
}: {
  moduleId: string
  lesson?: CurriculumLesson
  defaultOrder?: number
  onCancel: () => void
  onDone: () => void
}) {
  const isEdit = Boolean(lesson)
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [contentType, setContentType] = useState<LessonContentType>(
    lesson?.contentType ?? LessonContentType.VIDEO,
  )
  const [contentUrl, setContentUrl] = useState(lesson?.contentUrl ?? '')
  const [contentBody, setContentBody] = useState(lesson?.contentBody ?? '')
  const [order, setOrder] = useState<string>(
    String(lesson?.order ?? defaultOrder ?? 0),
  )
  const [durationMin, setDurationMin] = useState<string>(
    String(lesson?.durationMin ?? 0),
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    const orderNum = Number(order)
    const durationNum = Number(durationMin)
    if (!Number.isFinite(orderNum)) {
      setError('Urutan harus berupa angka.')
      return
    }
    if (!Number.isFinite(durationNum)) {
      setError('Durasi harus berupa angka.')
      return
    }

    startTransition(async () => {
      const r = isEdit
        ? await updateLesson({
            lessonId: lesson!.id,
            title,
            contentType,
            contentUrl,
            contentBody,
            order: orderNum,
            durationMin: durationNum,
          })
        : await createLesson({
            moduleId,
            title,
            contentType,
            contentUrl: contentUrl || undefined,
            contentBody: contentBody || undefined,
            order: orderNum,
            durationMin: durationNum,
          })
      if (!r.ok) {
        setError(r.error)
        return
      }
      onDone()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">
          {isEdit ? 'Ubah pelajaran' : 'Pelajaran baru'}
        </h3>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor={`l-title-${moduleId}`} className={labelClass}>
            Judul
          </label>
          <input
            id={`l-title-${moduleId}`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            placeholder="Pengenalan App Router"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={`l-type-${moduleId}`} className={labelClass}>
            Tipe konten
          </label>
          <select
            id={`l-type-${moduleId}`}
            value={contentType}
            onChange={(e) =>
              setContentType(e.target.value as LessonContentType)
            }
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(CONTENT_TYPE_LABELS) as LessonContentType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABELS[t]}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor={`l-order-${moduleId}`} className={labelClass}>
              Urutan
            </label>
            <input
              id={`l-order-${moduleId}`}
              type="number"
              min={0}
              step={1}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              disabled={pending}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`l-dur-${moduleId}`} className={labelClass}>
              Durasi (menit)
            </label>
            <input
              id={`l-dur-${moduleId}`}
              type="number"
              min={0}
              step={1}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              disabled={pending}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor={`l-url-${moduleId}`} className={labelClass}>
            URL konten (opsional)
          </label>
          <input
            id={`l-url-${moduleId}`}
            type="url"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            disabled={pending}
            placeholder="https://video.example.com/intro"
            className={inputClass}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor={`l-body-${moduleId}`} className={labelClass}>
            Isi konten (opsional)
          </label>
          <textarea
            id={`l-body-${moduleId}`}
            value={contentBody}
            onChange={(e) => setContentBody(e.target.value)}
            disabled={pending}
            placeholder="Catatan, transkrip, atau ringkasan…"
            className={textareaClass}
          />
        </div>
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
              : 'Tambah pelajaran'}
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
