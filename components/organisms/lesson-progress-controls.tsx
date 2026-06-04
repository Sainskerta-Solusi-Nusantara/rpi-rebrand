'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { markLessonComplete } from '@/lib/enrollments/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export function LessonProgressControls({
  enrollmentId,
  lessonId,
  completed,
}: {
  enrollmentId: string
  lessonId: string
  completed: boolean
}) {
  const router = useRouter()
  const { t } = useI18n()
  const fl = t.formsLearning.lessonProgress
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Optimistic local state — flips immediately, server-revalidate brings the
  // canonical value back via `router.refresh()`.
  const [optimisticDone, setOptimisticDone] = useState(completed)

  function toggle() {
    if (optimisticDone) return // idempotent — server treats re-mark as no-op anyway
    setError(null)
    setOptimisticDone(true)
    startTransition(async () => {
      const r = await markLessonComplete({ enrollmentId, lessonId })
      if (!r.ok) {
        setOptimisticDone(false)
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={optimisticDone}
            onChange={toggle}
            disabled={pending || optimisticDone}
            className="border-border focus-visible:ring-ring h-5 w-5 cursor-pointer rounded border focus-visible:outline-none focus-visible:ring-2"
            aria-label="Tandai pelajaran selesai"
          />
        </span>
        <span className="flex flex-col">
          <span className="text-foreground text-sm font-medium">
            {optimisticDone ? fl.doneLabel : fl.markLabel}
          </span>
          <span className="text-muted-foreground text-xs">
            {optimisticDone ? fl.doneDetail : fl.markDetail}
          </span>
        </span>
        <span className="ml-auto inline-flex items-center text-xs">
          {pending && (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden />
          )}
          {!pending && optimisticDone && (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
          )}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
