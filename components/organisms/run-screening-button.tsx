'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { runScreening } from '@/lib/applications/screening-actions'

type Props = {
  applicationId: string
  hasScore: boolean
}

/**
 * Recruiter-side action: kicks off (or re-runs) AI screening for one
 * application. Surfaces a one-line error inline on failure.
 */
export function RunScreeningButton({ applicationId, hasScore }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await runScreening({ applicationId })
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-3.5" aria-hidden="true" />
        )}
        {hasScore ? 'Refresh AI screening' : 'Jalankan AI screening'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export default RunScreeningButton
