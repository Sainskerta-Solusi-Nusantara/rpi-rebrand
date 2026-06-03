'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { requestEmailChange } from '@/lib/auth/email-change-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

export function EmailChangeForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter()
  const { t } = useI18n()
  const tc = t.formsAccount.emailChange

  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [field, setField] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setField(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await requestEmailChange(fd)
      if (!r.ok) {
        setError(r.error)
        setField(r.field ?? null)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  if (!hasPassword) {
    return (
      <p className="text-muted-foreground text-sm">
        {tc.noPasswordHint}
      </p>
    )
  }

  if (success) {
    return (
      <div className="space-y-3">
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {tc.successMsg}
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false)
            setOpen(false)
          }}
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          {tc.btnClose}
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        {tc.triggerBtn}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="border-border space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="space-y-1">
        <label htmlFor="new-email" className="block text-sm font-medium text-foreground">
          {tc.newEmailLabel}
        </label>
        <input
          id="new-email"
          name="newEmail"
          type="email"
          autoComplete="email"
          placeholder={tc.newEmailPlaceholder}
          required
          disabled={pending}
          aria-invalid={field === 'newEmail'}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="ec-password" className="block text-sm font-medium text-foreground">
          {tc.passwordLabel}
        </label>
        <input
          id="ec-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          aria-invalid={field === 'password'}
          className={inputClass}
        />
        <p className="text-muted-foreground text-xs">
          {tc.passwordHint}
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tc.btnPending : tc.btnSubmit}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
            setField(null)
          }}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground text-sm font-medium disabled:opacity-60"
        >
          {tc.btnCancel}
        </button>
      </div>
    </form>
  )
}
