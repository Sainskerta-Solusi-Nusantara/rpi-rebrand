'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Link2, Unlink } from 'lucide-react'
import { unlinkGoogleAccount } from '@/lib/auth/oauth-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export function LinkGoogleButton({
  callbackUrl = '/dashboard/keamanan?linked=1',
}: {
  callbackUrl?: string
}) {
  const { t } = useI18n()
  const tl = t.formsMisc1.oauthLink

  const [pending, setPending] = useState(false)

  function onClick() {
    setPending(true)
    void signIn('google', { callbackUrl })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Link2 className="h-4 w-4" aria-hidden="true" />
      {pending ? tl.linkPending : tl.linkBtn}
    </button>
  )
}

export function UnlinkGoogleForm({ passwordSet }: { passwordSet: boolean }) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsMisc1.oauthLink

  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await unlinkGoogleAccount(fd)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSuccess(true)
      setOpen(false)
      router.refresh()
    })
  }

  if (!passwordSet) {
    return (
      <p className="text-muted-foreground text-sm">
        {tl.noPasswordWarning}
      </p>
    )
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition"
        >
          <Unlink className="h-4 w-4" aria-hidden="true" />
          {tl.unlinkBtn}
        </button>
        {success && (
          <p
            role="status"
            className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          >
            {tl.unlinkSuccess}
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="unlink-password" className="block text-sm font-medium text-foreground">
        {tl.unlinkPasswordLabel}
      </label>
      <input
        id="unlink-password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder={tl.unlinkPasswordPlaceholder}
        required
        disabled={pending}
        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <p className="text-muted-foreground text-xs">
        {tl.unlinkPasswordHint}
      </p>

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
          className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? tl.unlinkPending : tl.unlinkBtn}
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
          {tl.cancelBtn}
        </button>
      </div>
    </form>
  )
}
