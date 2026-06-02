'use client'

import { useState, useTransition } from 'react'
import { Flag } from 'lucide-react'
import { submitFlag } from '@/lib/moderation/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Reason = 'spam' | 'inappropriate' | 'misleading' | 'copyright' | 'other'
type ResourceType = 'job' | 'course' | 'user' | 'profile' | 'message' | 'application'

export function ReportFlagButton({
  resourceType,
  resourceId,
}: {
  resourceType: ResourceType
  resourceId: string
}) {
  const { t } = useI18n()
  const tl = t.formsMisc1.reportFlag

  const REASONS: { value: Reason; label: string }[] = [
    { value: 'spam', label: tl.reasonSpam },
    { value: 'inappropriate', label: tl.reasonInappropriate },
    { value: 'misleading', label: tl.reasonMisleading },
    { value: 'copyright', label: tl.reasonCopyright },
    { value: 'other', label: tl.reasonOther },
  ]

  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason>('spam')
  const [description, setDescription] = useState('')
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'error'; message: string }
    | { kind: 'submitted' }
    | { kind: 'already' }
  >({ kind: 'idle' })

  if (state.kind === 'submitted') {
    return (
      <p
        className="text-muted-foreground inline-flex items-center gap-1 text-xs"
        role="status"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {tl.submitted}
      </p>
    )
  }

  if (state.kind === 'already') {
    return (
      <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {tl.alreadyReported}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {tl.triggerLabel}
      </button>
    )
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ kind: 'idle' })
    startTransition(async () => {
      const r = await submitFlag({
        resourceType,
        resourceId,
        reason,
        description: description.trim() || undefined,
      })
      if (r.ok) {
        setState({ kind: 'submitted' })
        setOpen(false)
      } else {
        setState({ kind: 'error', message: r.error })
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card mt-3 inline-block w-full max-w-md space-y-3 rounded-lg border p-4 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-foreground inline-flex items-center gap-1.5 text-sm font-semibold">
          <Flag className="h-3.5 w-3.5" aria-hidden />
          {tl.formHeading}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground text-xs"
          disabled={pending}
        >
          {tl.cancelBtn}
        </button>
      </div>
      <div className="space-y-1.5">
        <label className="text-foreground block text-xs font-medium">{tl.reasonLabel}</label>
        <select
          className={inputClass}
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason)}
          disabled={pending}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-foreground block text-xs font-medium">
          {tl.descriptionLabel}
        </label>
        <textarea
          className={inputClass}
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
          placeholder={tl.descriptionPlaceholder}
        />
      </div>
      {state.kind === 'error' && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-2.5 py-1.5 text-xs"
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? tl.submitPending : tl.submitBtn}
      </button>
    </form>
  )
}
