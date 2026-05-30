'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import { withdrawApplication } from '@/lib/applications/actions'

export function WithdrawApplicationButton({
  applicationId,
}: {
  applicationId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  function doWithdraw() {
    setError(null)
    startTransition(async () => {
      const r = await withdrawApplication(applicationId)
      if (!r.ok) {
        setError(r.error)
        setConfirming(false)
        return
      }
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-muted-foreground text-xs">Yakin tarik?</span>
        <button
          type="button"
          onClick={doWithdraw}
          disabled={pending}
          className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Menarik…' : 'Ya, tarik'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground text-xs font-medium disabled:opacity-60"
        >
          Batal
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setError(null)
          setConfirming(true)
        }}
        className="border-border text-foreground/80 hover:border-destructive/40 hover:text-destructive inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition"
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        Tarik lamaran
      </button>
      {error && (
        <span role="alert" className="text-destructive text-[10px]">
          {error}
        </span>
      )}
    </div>
  )
}
