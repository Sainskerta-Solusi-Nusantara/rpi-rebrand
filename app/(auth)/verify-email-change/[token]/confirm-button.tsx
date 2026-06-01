'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmEmailChange } from '@/lib/auth/email-change-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export function ConfirmEmailChangeButton({ token }: { token: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tc = t.auth.verify.change
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await confirmEmailChange(token)
      if (!r.ok) {
        setError(r.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/login?emailChanged=1' as any)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? tc.confirming : tc.confirmCta}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
      </button>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
