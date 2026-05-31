'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Pencil, Send } from 'lucide-react'

import {
  archiveAssessment,
  publishAssessment,
  unpublishAssessment,
} from '@/lib/assessments/actions'

/**
 * Per-row admin actions (publish/unpublish/archive + edit link). Rendered on
 * the admin assessments table. Edit links route to /admin/assessments/[id]/edit.
 */
export function AdminAssessmentRowActions({
  assessmentId,
  status,
}: {
  assessmentId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function call(fn: typeof publishAssessment) {
    setError(null)
    startTransition(async () => {
      const r = await fn(assessmentId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/admin/assessments/${assessmentId}/edit` as any}
        className="border-border bg-background hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
      >
        <Pencil className="h-3 w-3" aria-hidden="true" />
        Ubah
      </Link>
      {status !== 'PUBLISHED' && (
        <button
          type="button"
          onClick={() => call(publishAssessment)}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Send className="h-3 w-3" aria-hidden="true" />
          Publikasikan
        </button>
      )}
      {status === 'PUBLISHED' && (
        <button
          type="button"
          onClick={() => call(unpublishAssessment)}
          disabled={pending}
          className="border-border bg-background hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
        >
          Tarik ke draf
        </button>
      )}
      {status !== 'ARCHIVED' && (
        <button
          type="button"
          onClick={() => call(archiveAssessment)}
          disabled={pending}
          className="border-border bg-background hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
        >
          <Archive className="h-3 w-3" aria-hidden="true" />
          Arsipkan
        </button>
      )}
      {error && (
        <p role="alert" className="text-destructive ml-2 text-[11px]">
          {error}
        </p>
      )}
    </div>
  )
}
