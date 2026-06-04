'use client'

import { inputClassBare as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createIncident } from '@/lib/status/incident-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


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
  const { t } = useI18n()
  const tf = t.formsStatus.incidentForm
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const SEVERITY_OPTIONS: { value: 'minor' | 'major' | 'critical'; label: string }[] = [
    { value: 'minor', label: tf.severityMinor },
    { value: 'major', label: tf.severityMajor },
    { value: 'critical', label: tf.severityCritical },
  ]

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'investigating', label: tf.statusInvestigating },
    { value: 'identified', label: tf.statusIdentified },
    { value: 'monitoring', label: tf.statusMonitoring },
    { value: 'resolved', label: tf.statusResolved },
  ]

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="severity" className="mb-1 block text-sm font-medium">
            {tf.severityLabel}
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
            {tf.statusLabel}
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

      <div>
        <label htmlFor="startedAt" className="mb-1 block text-sm font-medium">
          {tf.startedAtLabel}
        </label>
        <input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          className={inputClass}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {tf.startedAtHint}
        </p>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          {tf.messageLabel}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          className={inputClass}
          placeholder={tf.messagePlaceholder}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {tf.messageHint}
        </p>
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
          {isPending ? tf.submitSaving : tf.submitCreate}
        </button>
      </div>
    </form>
  )
}

export default IncidentForm
