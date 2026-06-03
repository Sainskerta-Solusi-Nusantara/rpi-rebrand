'use client'

import { inputClassNoPlaceholder as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'
import { resetUserTwoFactor } from '@/lib/auth/totp-admin-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


const btnDestructive =
  'border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'

export function AdminReset2faForm({
  userId,
  userEmail,
  totpEnabled,
}: {
  userId: string
  userEmail: string
  totpEnabled: boolean
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tr = t.formsActions.reset2fa
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (reason.trim().length < 8) {
      setError(tr.errorReasonTooShort)
      return
    }
    setConfirmOpen(true)
  }

  function onConfirm() {
    setError(null)
    setConfirmOpen(false)
    startTransition(async () => {
      const r = await resetUserTwoFactor(userId, reason.trim())
      if (!r.ok) {
        setError(r.error)
        return
      }
      setDone(true)
      setReason('')
      router.refresh()
    })
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
      >
        {tr.successMsg}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!totpEnabled && (
        <p className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {tr.notEnabledNote}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label
            htmlFor="reset-reason"
            className="block text-sm font-medium text-foreground"
          >
            {tr.reasonLabel}
          </label>
          <textarea
            id="reset-reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={8}
            disabled={pending}
            rows={3}
            placeholder={tr.reasonPlaceholder}
            className={inputClass}
          />
          <p className="text-muted-foreground text-xs">
            {tr.reasonHint.replace('{email}', userEmail)}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending || reason.trim().length < 8}
            className={btnDestructive}
          >
            <ShieldOff className="h-4 w-4" aria-hidden="true" />
            {pending ? tr.btnPending : tr.btnSubmit}
          </button>
        </div>
      </form>

      {confirmOpen && (
        <div
          role="alertdialog"
          aria-labelledby="reset-2fa-confirm-title"
          className="border-destructive/40 bg-destructive/5 rounded-md border p-4"
        >
          <p id="reset-2fa-confirm-title" className="text-sm font-medium text-foreground">
            {tr.confirmTitle}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {tr.confirmBody.replace('{email}', userEmail)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={btnDestructive}
            >
              {tr.confirmYes}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
            >
              {tr.confirmCancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
