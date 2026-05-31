'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import {
  reorderStages,
  quickAddStage,
  DEFAULT_STAGE_NAMES,
} from '@/lib/tenants/interview-stage-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export type PipelineEditorInterview = {
  id: string
  scheduledAt: string | Date
  type: string
  status: string
  stageOrder: number
  stageName: string | null
}

type EditableRow = {
  id: string
  scheduledAt: string | Date
  type: string
  status: string
  stageOrder: number
  stageName: string
}

function sortRows(rows: EditableRow[]): EditableRow[] {
  return [...rows].sort((a, b) => {
    if (a.stageOrder !== b.stageOrder) return a.stageOrder - b.stageOrder
    return (
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  })
}

function normaliseOrders(rows: EditableRow[]): EditableRow[] {
  // Compact stageOrders so 1..N is contiguous after a swap. Preserves
  // ordering produced by sortRows.
  return rows.map((row, idx) => ({ ...row, stageOrder: idx + 1 }))
}

/**
 * Recruiter-facing editor for stage assignment. Drag-and-drop was
 * intentionally avoided to keep the surface small and accessible — up/down
 * arrows mutate `stageOrder` in place, stage name is an inline text input
 * with `<datalist>` suggestions, and a quick-add form at the bottom
 * delegates to `quickAddStage` on the server.
 */
export function PipelineEditor({
  applicationId,
  initialInterviews,
  allowReorder = true,
}: {
  applicationId: string
  initialInterviews: PipelineEditorInterview[]
  allowReorder?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<
    { kind: 'error' | 'success'; message: string } | null
  >(null)
  const [rows, setRows] = useState<EditableRow[]>(() =>
    sortRows(
      initialInterviews.map((iv) => ({
        id: iv.id,
        scheduledAt: iv.scheduledAt,
        type: iv.type,
        status: iv.status,
        stageOrder: iv.stageOrder,
        stageName: iv.stageName ?? '',
      })),
    ),
  )
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickStageName, setQuickStageName] = useState<string>(
    DEFAULT_STAGE_NAMES[0],
  )
  const [quickScheduledAt, setQuickScheduledAt] = useState<string>('')
  const [quickDuration, setQuickDuration] = useState<number>(60)
  const [quickType, setQuickType] = useState<'video' | 'onsite' | 'phone'>(
    'video',
  )
  const [quickMeetingUrl, setQuickMeetingUrl] = useState<string>('')
  const [quickLocation, setQuickLocation] = useState<string>('')

  function moveUp(index: number) {
    if (!allowReorder || index <= 0) return
    setRows((prev) => {
      const next = [...prev]
      const upper = next[index - 1]
      const lower = next[index]
      if (!upper || !lower) return prev
      next[index - 1] = lower
      next[index] = upper
      return normaliseOrders(next)
    })
  }

  function moveDown(index: number) {
    if (!allowReorder) return
    setRows((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      const upper = next[index]
      const lower = next[index + 1]
      if (!upper || !lower) return prev
      next[index] = lower
      next[index + 1] = upper
      return normaliseOrders(next)
    })
  }

  function updateName(id: string, name: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, stageName: name } : row)),
    )
  }

  function onSave() {
    setBanner(null)
    const payload = {
      applicationId,
      stages: rows.map((row) => ({
        interviewId: row.id,
        stageOrder: row.stageOrder,
        stageName: row.stageName.trim() || undefined,
      })),
    }
    startTransition(async () => {
      const res = await reorderStages(payload)
      if (!res.ok) {
        setBanner({ kind: 'error', message: res.error })
        return
      }
      setBanner({ kind: 'success', message: 'Pipeline tersimpan.' })
      router.refresh()
    })
  }

  function onQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    if (!quickScheduledAt) {
      setBanner({ kind: 'error', message: 'Tanggal & jam wajib diisi.' })
      return
    }
    const localDate = new Date(quickScheduledAt)
    if (Number.isNaN(localDate.getTime())) {
      setBanner({ kind: 'error', message: 'Format tanggal tidak valid.' })
      return
    }
    startTransition(async () => {
      const res = await quickAddStage({
        applicationId,
        stageName: quickStageName.trim(),
        scheduledAt: localDate.toISOString(),
        durationMin: quickDuration,
        type: quickType,
        meetingUrl:
          quickType === 'video' ? quickMeetingUrl.trim() || undefined : undefined,
        location:
          quickType === 'onsite' ? quickLocation.trim() || undefined : undefined,
      })
      if (!res.ok) {
        setBanner({ kind: 'error', message: res.error })
        return
      }
      setBanner({ kind: 'success', message: 'Tahap baru ditambahkan.' })
      setQuickScheduledAt('')
      setQuickMeetingUrl('')
      setQuickLocation('')
      setShowQuickAdd(false)
      router.refresh()
    })
  }

  const stageDatalistId = `pipeline-stage-names-${applicationId}`

  return (
    <div className="border-border bg-card rounded-2xl border p-6 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-base">Atur tahap wawancara</h3>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Menyimpan…' : 'Simpan urutan'}
          </button>
        )}
      </header>

      <datalist id={stageDatalistId}>
        {DEFAULT_STAGE_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Belum ada wawancara. Tambahkan tahap pertama di bawah.
        </p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-2 py-2"
            >
              <span className="text-muted-foreground bg-muted inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]">
                {row.stageOrder}
              </span>
              <input
                type="text"
                value={row.stageName}
                onChange={(e) => updateName(row.id, e.target.value)}
                list={stageDatalistId}
                placeholder={`Tahap ${row.stageOrder}`}
                disabled={pending}
                maxLength={80}
                className={`${inputClass} max-w-[180px]`}
                aria-label={`Nama tahap untuk wawancara ${index + 1}`}
              />
              <span className="text-muted-foreground text-xs">
                {dateFmt.format(new Date(row.scheduledAt))}
              </span>
              {allowReorder && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={pending || index === 0}
                    className="border-input text-foreground hover:bg-muted inline-flex h-7 w-7 items-center justify-center rounded-md border bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Pindahkan tahap ${row.stageOrder} ke atas`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={pending || index === rows.length - 1}
                    className="border-input text-foreground hover:bg-muted inline-flex h-7 w-7 items-center justify-center rounded-md border bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Pindahkan tahap ${row.stageOrder} ke bawah`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

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

      <div className="border-border border-t pt-4">
        {showQuickAdd ? (
          <form onSubmit={onQuickAdd} className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="quick-stage-name"
                  className="block text-xs font-medium"
                >
                  Nama tahap
                </label>
                <input
                  id="quick-stage-name"
                  type="text"
                  value={quickStageName}
                  onChange={(e) => setQuickStageName(e.target.value)}
                  list={stageDatalistId}
                  placeholder="Misal: Technical"
                  disabled={pending}
                  required
                  maxLength={80}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="quick-scheduled-at"
                  className="block text-xs font-medium"
                >
                  Tanggal & jam
                </label>
                <input
                  id="quick-scheduled-at"
                  type="datetime-local"
                  value={quickScheduledAt}
                  onChange={(e) => setQuickScheduledAt(e.target.value)}
                  disabled={pending}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="quick-duration"
                  className="block text-xs font-medium"
                >
                  Durasi (menit)
                </label>
                <input
                  id="quick-duration"
                  type="number"
                  min={15}
                  max={480}
                  step={5}
                  value={quickDuration}
                  onChange={(e) =>
                    setQuickDuration(parseInt(e.target.value, 10) || 60)
                  }
                  disabled={pending}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="quick-type"
                  className="block text-xs font-medium"
                >
                  Jenis
                </label>
                <select
                  id="quick-type"
                  value={quickType}
                  onChange={(e) =>
                    setQuickType(e.target.value as 'video' | 'onsite' | 'phone')
                  }
                  disabled={pending}
                  className={inputClass}
                >
                  <option value="video">Video call</option>
                  <option value="onsite">Onsite</option>
                  <option value="phone">Telepon</option>
                </select>
              </div>
            </div>
            {quickType === 'video' && (
              <div className="space-y-1">
                <label
                  htmlFor="quick-meeting-url"
                  className="block text-xs font-medium"
                >
                  Tautan meeting
                </label>
                <input
                  id="quick-meeting-url"
                  type="url"
                  value={quickMeetingUrl}
                  onChange={(e) => setQuickMeetingUrl(e.target.value)}
                  placeholder="https://meet.example.com/abc"
                  disabled={pending}
                  className={inputClass}
                />
              </div>
            )}
            {quickType === 'onsite' && (
              <div className="space-y-1">
                <label
                  htmlFor="quick-location"
                  className="block text-xs font-medium"
                >
                  Lokasi
                </label>
                <input
                  id="quick-location"
                  type="text"
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  placeholder="Alamat lengkap kantor"
                  disabled={pending}
                  minLength={2}
                  maxLength={200}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Menambahkan…' : 'Tambahkan tahap'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                disabled={pending}
                className="border-input text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            disabled={pending}
            className="border-input text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Tambah tahap
          </button>
        )}
      </div>
    </div>
  )
}
