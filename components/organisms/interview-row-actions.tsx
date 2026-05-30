'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  cancelInterview,
  markInterviewCompleted,
} from '@/lib/tenants/interview-actions'
import {
  InterviewScheduleForm,
  type InterviewInitial,
} from '@/components/organisms/interview-schedule-form'

export type InterviewRowActionsProps = {
  applicationId: string
  interview: InterviewInitial & { status: string }
}

/**
 * Row-level recruiter actions for an interview: edit (toggle inline form),
 * cancel (confirm), mark completed. Hidden when status is terminal so the
 * cancelled/completed rows stay frozen.
 */
export function InterviewRowActions({
  applicationId,
  interview,
}: InterviewRowActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (interview.status === 'cancelled' || interview.status === 'completed') {
    return null
  }

  function onCancel() {
    if (!confirm('Batalkan wawancara ini? Kandidat akan dikirim notifikasi.')) {
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await cancelInterview(interview.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function onComplete() {
    setError(null)
    startTransition(async () => {
      const res = await markInterviewCompleted(interview.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          disabled={pending}
          className="border-input text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editing ? 'Tutup' : 'Ubah'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={pending}
          className="border-input text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          Tandai selesai
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          Batalkan
        </button>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
      {editing && (
        <div className="border-border bg-background rounded-md border p-4">
          <InterviewScheduleForm
            applicationId={applicationId}
            initial={interview}
            onSuccess={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  )
}
