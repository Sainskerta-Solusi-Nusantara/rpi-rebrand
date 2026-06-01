'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createIncident } from '@/lib/status/incident-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

const SEVERITY_OPTIONS: { value: 'minor' | 'major' | 'critical'; label: string }[] = [
  { value: 'minor', label: 'Ringan' },
  { value: 'major', label: 'Berat' },
  { value: 'critical', label: 'Kritis' },
]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'investigating', label: 'Investigasi' },
  { value: 'identified', label: 'Teridentifikasi' },
  { value: 'monitoring', label: 'Pemantauan' },
  { value: 'resolved', label: 'Selesai' },
]

export interface IncidentFormProps {
  defaults?: {
    title?: string
    severity?: 'minor' | 'major' | 'critical'
    status?: string
    affectedServices?: string
  }
}

/**
 * Admin form to create a new incident. The first IncidentUpdate is created
 * server-side automatically so the timeline is never empty.
 */
export function IncidentForm({ defaults }: IncidentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createIncident(formData)
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/admin/status/incidents/${res.data.id}` as any)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Judul insiden
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaults?.title}
          maxLength={200}
          className={inputClass}
          placeholder="cth. Gangguan pengiriman email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="severity" className="mb-1 block text-sm font-medium">
            Tingkat keparahan
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue={defaults?.severity ?? 'minor'}
            className={inputClass}
          >
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status awal
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'investigating'}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="affectedServices" className="mb-1 block text-sm font-medium">
          Layanan terdampak
        </label>
        <input
          id="affectedServices"
          name="affectedServices"
          type="text"
          defaultValue={defaults?.affectedServices}
          className={inputClass}
          placeholder="cth. email, api, database"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Pisahkan dengan koma. Gunakan key komponen (web, api, database, email, storage, auth, webhooks, cron).
        </p>
      </div>

      <div>
        <label htmlFor="startedAt" className="mb-1 block text-sm font-medium">
          Waktu mulai (opsional)
        </label>
        <input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          className={inputClass}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Kosongkan untuk menggunakan waktu sekarang.
        </p>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Pesan pembaruan pertama
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          className={inputClass}
          placeholder="Apa yang sedang diinvestigasi?"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Kosongkan untuk menggunakan judul insiden sebagai pesan.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? 'Menyimpan…' : 'Buat insiden'}
        </button>
      </div>
    </form>
  )
}

export default IncidentForm
