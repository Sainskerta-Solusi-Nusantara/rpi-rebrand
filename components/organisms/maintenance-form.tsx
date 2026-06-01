'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMaintenance } from '@/lib/status/incident-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

export interface MaintenanceFormProps {
  defaults?: {
    title?: string
    description?: string
    affectedServices?: string
    scheduledStart?: string
    scheduledEnd?: string
  }
}

/**
 * Admin form to schedule a new maintenance window. Once created, the
 * planned → in_progress → completed transitions are issued via the
 * separate status buttons on the edit page.
 */
export function MaintenanceForm({ defaults }: MaintenanceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createMaintenance(formData)
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/admin/status/maintenance/${res.data.id}` as any)
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
          Judul pemeliharaan
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaults?.title}
          maxLength={200}
          className={inputClass}
          placeholder="cth. Migrasi versi basis data"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={defaults?.description}
          className={inputClass}
          placeholder="Detail singkat dampak dan rencana mitigasi."
        />
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
          placeholder="cth. database, api"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Pisahkan dengan koma. Gunakan key komponen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="scheduledStart" className="mb-1 block text-sm font-medium">
            Waktu mulai
          </label>
          <input
            id="scheduledStart"
            name="scheduledStart"
            type="datetime-local"
            required
            defaultValue={defaults?.scheduledStart}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="scheduledEnd" className="mb-1 block text-sm font-medium">
            Waktu selesai
          </label>
          <input
            id="scheduledEnd"
            name="scheduledEnd"
            type="datetime-local"
            required
            defaultValue={defaults?.scheduledEnd}
            className={inputClass}
          />
        </div>
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
          {isPending ? 'Menyimpan…' : 'Jadwalkan pemeliharaan'}
        </button>
      </div>
    </form>
  )
}

export default MaintenanceForm
