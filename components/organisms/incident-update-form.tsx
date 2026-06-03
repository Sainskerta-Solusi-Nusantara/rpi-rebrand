'use client'

import { inputClassBare as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postIncidentUpdate } from '@/lib/status/incident-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


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
  const { t } = useI18n()
  const tf = t.formsStatus.incidentUpdateForm
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'investigating', label: tf.statusInvestigating },
    { value: 'identified', label: tf.statusIdentified },
    { value: 'monitoring', label: tf.statusMonitoring },
    { value: 'resolved', label: tf.statusResolved },
  ]

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
          {tf.newStatusLabel}
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
          {tf.messageLabel}
        </label>
        <textarea
          id={`message-${incidentId}`}
          name="message"
          required
          rows={4}
          maxLength={2000}
          className={inputClass}
          placeholder={tf.messagePlaceholder}
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
          {isPending ? tf.submitSending : tf.submitPost}
        </button>
      </div>
    </form>
  )
}

export default IncidentUpdateForm
