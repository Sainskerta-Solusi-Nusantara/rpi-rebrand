'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import {
  withdrawApplication,
  reopenApplication,
} from '@/lib/applications/withdraw-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

/**
 * Two-step withdraw modal:
 *   - Trigger: red-ghost "Tarik lamaran" button.
 *   - Modal: optional reason textarea + red confirm "Konfirmasi penarikan".
 *
 * Stays uncontrolled (own `open` state). On success, calls router.refresh()
 * so the surrounding page re-fetches the new WITHDRAWN status + banner.
 */
export function WithdrawApplicationModal({
  applicationId,
  size = 'md',
}: {
  applicationId: string
  size?: 'sm' | 'md'
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsMisc1.withdrawModal

  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('applicationId', applicationId)
      if (reason.trim()) fd.set('reason', reason.trim())
      const r = await withdrawApplication(fd)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setOpen(false)
      setReason('')
      router.refresh()
    })
  }

  const triggerClass =
    size === 'sm'
      ? 'border-border text-foreground/80 hover:border-destructive/40 hover:text-destructive inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition'
      : 'border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition'

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className={triggerClass}
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        {tl.triggerLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi penarikan lamaran"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="bg-card text-foreground border-border w-full max-w-md rounded-2xl border p-6 shadow-xl">
            <h2 className="font-heading text-lg">{tl.heading}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {tl.body}
            </p>

            <label
              htmlFor={`withdraw-reason-${applicationId}`}
              className="text-foreground mt-4 block text-sm font-medium"
            >
              {tl.reasonLabel}
            </label>
            <textarea
              id={`withdraw-reason-${applicationId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={pending}
              placeholder={tl.reasonPlaceholder}
              className="border-input bg-background focus:border-ring focus:ring-ring/30 mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              {reason.length.toLocaleString('id-ID')} / 2000
            </p>

            {error && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setReason('')
                  setError(null)
                }}
                disabled={pending}
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60"
              >
                {tl.cancelBtn}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? tl.confirmPending : tl.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * One-click reopen button for the 7-day grace window. Renders nothing visible
 * outside; the parent owns the surrounding "Lamaran ditarik" badge.
 */
export function ReopenApplicationButton({
  applicationId,
}: {
  applicationId: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsMisc1.withdrawModal

  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const r = await reopenApplication(applicationId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? tl.reopenPending : tl.reopenBtn}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
