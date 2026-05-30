'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  scheduleInterview,
  updateInterview,
} from '@/lib/tenants/interview-actions'

type InterviewType = 'video' | 'onsite' | 'phone'

export type InterviewInitial = {
  id: string
  scheduledAt: string | Date
  durationMin: number
  type: string
  meetingUrl?: string | null
  location?: string | null
  notes?: string | null
}

const PRESET_DURATIONS = [30, 60, 90, 120] as const

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

function toDatetimeLocal(value: string | Date | undefined): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  // Build YYYY-MM-DDTHH:mm in LOCAL time (datetime-local expects naive local).
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Combined create/edit form for an InterviewSchedule row. When `initial`
 * is supplied the form drives `updateInterview`; otherwise it drives
 * `scheduleInterview` for the given applicationId.
 */
export function InterviewScheduleForm({
  applicationId,
  initial,
  onSuccess,
  onCancel,
}: {
  applicationId: string
  initial?: InterviewInitial
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
  const initialType = (initial?.type as InterviewType | undefined) ?? 'video'
  const initialDuration = initial?.durationMin ?? 60
  const initialPresetMatch = (PRESET_DURATIONS as readonly number[]).includes(
    initialDuration,
  )

  const [scheduledAt, setScheduledAt] = useState<string>(
    toDatetimeLocal(initial?.scheduledAt),
  )
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>(
    initialPresetMatch ? 'preset' : 'custom',
  )
  const [durationPreset, setDurationPreset] = useState<number>(
    initialPresetMatch ? initialDuration : 60,
  )
  const [durationCustom, setDurationCustom] = useState<string>(
    initialPresetMatch ? '' : String(initialDuration),
  )
  const [type, setType] = useState<InterviewType>(initialType)
  const [meetingUrl, setMeetingUrl] = useState<string>(
    initial?.meetingUrl ?? '',
  )
  const [location, setLocation] = useState<string>(initial?.location ?? '')
  const [notes, setNotes] = useState<string>(initial?.notes ?? '')

  const durationMin = useMemo(() => {
    if (durationMode === 'preset') return durationPreset
    const n = parseInt(durationCustom, 10)
    return Number.isFinite(n) ? n : NaN
  }, [durationMode, durationPreset, durationCustom])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    setFieldErrors({})

    if (!scheduledAt) {
      setFieldErrors({ scheduledAt: 'Tanggal & jam wajib diisi' })
      return
    }
    if (!Number.isFinite(durationMin) || durationMin < 15 || durationMin > 480) {
      setFieldErrors({ durationMin: 'Durasi harus antara 15-480 menit' })
      return
    }

    // datetime-local string has no timezone — interpret as local then convert
    // to a real ISO string so the server can parse it unambiguously.
    const localDate = new Date(scheduledAt)
    if (Number.isNaN(localDate.getTime())) {
      setFieldErrors({ scheduledAt: 'Format tanggal tidak valid' })
      return
    }

    const payload = {
      scheduledAt: localDate.toISOString(),
      durationMin: durationMin as number,
      type,
      meetingUrl: type === 'video' ? meetingUrl.trim() || undefined : undefined,
      location: type === 'onsite' ? location.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
    }

    startTransition(async () => {
      const res = isEdit && initial
        ? await updateInterview({ interviewId: initial.id, ...payload })
        : await scheduleInterview({ applicationId, ...payload })

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
        message: isEdit ? 'Wawancara diperbarui.' : 'Wawancara dijadwalkan.',
      })
      if (!isEdit) {
        // Reset for next entry
        setScheduledAt('')
        setMeetingUrl('')
        setLocation('')
        setNotes('')
      }
      router.refresh()
      onSuccess?.()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="scheduledAt" className="block text-sm font-medium">
          Tanggal & jam
        </label>
        <input
          id="scheduledAt"
          type="datetime-local"
          required
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.scheduledAt)}
          className={inputClass}
        />
        {fieldErrors.scheduledAt && (
          <p className="text-destructive text-xs">{fieldErrors.scheduledAt}</p>
        )}
      </div>

      <div className="space-y-1">
        <span className="block text-sm font-medium">Durasi</span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={durationMode === 'preset' ? String(durationPreset) : 'custom'}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'custom') {
                setDurationMode('custom')
              } else {
                setDurationMode('preset')
                setDurationPreset(parseInt(v, 10))
              }
            }}
            disabled={pending}
            className={`${inputClass} max-w-[180px]`}
            aria-label="Durasi"
          >
            {PRESET_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} menit
              </option>
            ))}
            <option value="custom">Kustom…</option>
          </select>
          {durationMode === 'custom' && (
            <input
              type="number"
              min={15}
              max={480}
              step={5}
              placeholder="Menit"
              value={durationCustom}
              onChange={(e) => setDurationCustom(e.target.value)}
              disabled={pending}
              className={`${inputClass} max-w-[120px]`}
              aria-label="Durasi kustom (menit)"
            />
          )}
        </div>
        {fieldErrors.durationMin && (
          <p className="text-destructive text-xs">{fieldErrors.durationMin}</p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium">Jenis wawancara</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {(
            [
              { v: 'video' as const, label: 'Video call' },
              { v: 'onsite' as const, label: 'Onsite' },
              { v: 'phone' as const, label: 'Telepon' },
            ]
          ).map((opt) => (
            <label
              key={opt.v}
              className="border-border bg-background flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5"
            >
              <input
                type="radio"
                name="interview-type"
                value={opt.v}
                checked={type === opt.v}
                onChange={() => setType(opt.v)}
                disabled={pending}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {fieldErrors.type && (
          <p className="text-destructive text-xs">{fieldErrors.type}</p>
        )}
      </fieldset>

      {type === 'video' && (
        <div className="space-y-1">
          <label htmlFor="meetingUrl" className="block text-sm font-medium">
            Tautan meeting
          </label>
          <input
            id="meetingUrl"
            type="url"
            placeholder="https://meet.example.com/abc"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.meetingUrl)}
            className={inputClass}
          />
          {fieldErrors.meetingUrl && (
            <p className="text-destructive text-xs">{fieldErrors.meetingUrl}</p>
          )}
        </div>
      )}

      {type === 'onsite' && (
        <div className="space-y-1">
          <label htmlFor="location" className="block text-sm font-medium">
            Lokasi
          </label>
          <input
            id="location"
            type="text"
            placeholder="Alamat lengkap kantor"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={pending}
            minLength={2}
            maxLength={200}
            aria-invalid={Boolean(fieldErrors.location)}
            className={inputClass}
          />
          {fieldErrors.location && (
            <p className="text-destructive text-xs">{fieldErrors.location}</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium">
          Catatan (opsional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={5000}
          disabled={pending}
          placeholder="Persiapan, tautan kelas, dokumen yang perlu disiapkan…"
          className={inputClass}
        />
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
          {pending
            ? 'Menyimpan…'
            : isEdit
              ? 'Simpan perubahan'
              : 'Jadwalkan wawancara'}
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
