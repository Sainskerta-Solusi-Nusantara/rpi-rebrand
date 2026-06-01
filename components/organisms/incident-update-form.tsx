'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postIncidentUpdate } from '@/lib/status/incident-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'investigating', label: 'Investigasi' },
  { value: 'identified', label: 'Teridentifikasi' },
  { value: 'monitoring', label: 'Pemantauan' },
  { value: 'resolved', label: 'Selesai' },
]

export interface IncidentUpdateFormProps {
  incidentId: string
  currentStatus?: string
}

/** Admin-only form to post a new IncidentUpdate to an existing incident. */
export function IncidentUpdateForm({
  incidentId,
  currentStatus,
}: IncidentUpdateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await postIncidentUpdate(incidentId, formData)
      if (res.ok) {
        router.refresh()
        // Reset only the message; keep status sticky for chained updates.
        const form = document.getElementById(
          `incident-update-form-${incidentId}`,
        ) as HTMLFormElement | null
        if (form) {
          const ta = form.querySelector(
            'textarea[name="message"]',
          ) as HTMLTextAreaElement | null
          if (ta) ta.value = ''
        }
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <form
      id={`incident-update-form-${incidentId}`}
      action={onSubmit}
      className="space-y-3"
    >
      <div>
        <label htmlFor={`status-${incidentId}`} className="mb-1 block text-sm font-medium">
          Status baru
        </label>
        <select
          id={`status-${incidentId}`}
          name="status"
          defaultValue={currentStatus ?? 'investigating'}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`message-${incidentId}`} className="mb-1 block text-sm font-medium">
          Pesan
        </label>
        <textarea
          id={`message-${incidentId}`}
          name="message"
          required
          rows={4}
          maxLength={2000}
          className={inputClass}
          placeholder="Apa yang berubah sejak update terakhir?"
        />
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
          {isPending ? 'Mengirim…' : 'Kirim pembaruan'}
        </button>
      </div>
    </form>
  )
}

export default IncidentUpdateForm
