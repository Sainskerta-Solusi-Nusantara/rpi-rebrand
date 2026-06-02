'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Trash2 } from 'lucide-react'
import { requestAccountDeletion } from '@/lib/auth/account-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export function AccountDeleteForm({
  hasPassword,
  ownedTenantCount,
}: {
  hasPassword: boolean
  ownedTenantCount: number
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tc = t.formsAccount.accountDelete

  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await requestAccountDeletion(fd)
      if (!r.ok) {
        setError(r.error)
        return
      }
      // Sign out client-side; the server already wiped sessions, but the JWT
      // cookie still lives on this device.
      await signOut({ redirect: false })
      router.push('/?deleted=1')
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

  if (ownedTenantCount > 0) {
    return (
      <p className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        {tc.ownedTenantWarning.replace('{count}', String(ownedTenantCount))}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {tc.triggerBtn}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {tc.permanentHeading}
        </p>
        <p className="text-muted-foreground text-xs">
          {tc.permanentDetail}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="del-password" className="block text-sm font-medium text-foreground">
          {tc.passwordLabel}
        </label>
        <input
          id="del-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="del-confirm" className="block text-sm font-medium text-foreground">
          {tc.confirmLabel}
        </label>
        <input
          id="del-confirm"
          name="confirm"
          type="text"
          autoComplete="off"
          spellCheck={false}
          required
          placeholder={tc.confirmPlaceholder}
          disabled={pending}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
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
        <button
          type="submit"
          disabled={pending}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? tc.btnPending : tc.btnSubmit}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
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
