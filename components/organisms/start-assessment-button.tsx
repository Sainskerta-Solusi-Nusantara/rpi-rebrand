'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'

import { startAssessmentAttempt } from '@/lib/assessments/attempt-actions'

/**
 * Small client wrapper around `startAssessmentAttempt` that triggers the
 * mutation and routes the user to the new attempt page. Lives in its own
 * file so the surrounding page can stay a server component.
 */
export function StartAssessmentButton({
  assessmentId,
  slug,
  label = 'Mulai',
}: {
  assessmentId: string
  slug: string
  label?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await startAssessmentAttempt({ assessmentId })
      if (!r.ok) {
        setError(r.error)
        return
      }
      if (r.data) {
        router.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `/dashboard/assesmen/${slug}/attempt/${r.data.attemptId}` as any,
        )
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="bg-primary text-primary-foreground inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        {label}
      </button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
