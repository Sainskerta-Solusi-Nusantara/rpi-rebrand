'use client'

import { inputClassBare as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMaintenance } from '@/lib/status/incident-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


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
  const { t } = useI18n()
  const tf = t.formsStatus.maintenanceForm
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
          {tf.titleLabel}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaults?.title}
          maxLength={200}
          className={inputClass}
          placeholder={tf.titlePlaceholder}
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          {tf.descriptionLabel}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={defaults?.description}
          className={inputClass}
          placeholder={tf.descriptionPlaceholder}
        />
      </div>

      <div>
        <label htmlFor="affectedServices" className="mb-1 block text-sm font-medium">
          {tf.affectedServicesLabel}
        </label>
        <input
          id="affectedServices"
          name="affectedServices"
          type="text"
          defaultValue={defaults?.affectedServices}
          className={inputClass}
          placeholder={tf.affectedServicesPlaceholder}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {tf.affectedServicesHint}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="scheduledStart" className="mb-1 block text-sm font-medium">
            {tf.scheduledStartLabel}
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
            {tf.scheduledEndLabel}
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
        <p role="alert" className="text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? tf.submitSaving : tf.submitSchedule}
        </button>
      </div>
    </form>
  )
}

export default MaintenanceForm
