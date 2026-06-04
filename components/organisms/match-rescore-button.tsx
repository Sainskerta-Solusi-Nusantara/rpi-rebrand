'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
import { rescoreApplication } from '@/lib/match/match-actions'

/**
 * Client button — triggers a server-action rescore for a single application
 * and refreshes the route. Surfaces the resulting error inline.
 */
export function MatchRescoreButton({
  applicationId,
}: {
  applicationId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await rescoreApplication({ applicationId })
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
        className="border-input text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border bg-transparent px-3 py-1.5 text-xs font-medium disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="size-3.5" aria-hidden="true" />
        )}
        Skor ulang
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  )
}

export default MatchRescoreButton
