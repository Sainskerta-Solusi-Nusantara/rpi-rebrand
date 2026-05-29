'use client'

import { useState, useTransition } from 'react'
import { requestEmailVerification } from '@/lib/auth/actions'

export function ResendVerificationButton() {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<
    { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  function onClick() {
    setStatus({ kind: 'idle' })
    startTransition(async () => {
      const r = await requestEmailVerification()
      if (r.ok) {
        setStatus({ kind: 'success' })
      } else {
        setStatus({ kind: 'error', message: r.error })
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
      >
        {isPending ? 'Mengirim…' : 'Kirim ulang email verifikasi'}
      </button>

      {status.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          Tautan verifikasi baru telah dikirim. Periksa kotak masuk Anda.
        </p>
      )}
      {status.kind === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
