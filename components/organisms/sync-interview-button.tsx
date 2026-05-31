'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, CalendarCheck, ExternalLink, CalendarX } from 'lucide-react'
import {
  syncInterviewToCalendar,
  unsyncInterview,
} from '@/lib/calendar/actions'

export type SyncedMapping = {
  externalEventId: string
  htmlLink: string | null
} | null

/**
 * Per-interview-row recruiter button.
 *
 * If a CalendarEventMapping exists (`syncedMapping` non-null), show:
 *   • a link "Tersinkron · Buka di Google Calendar" (when htmlLink available)
 *   • a "Hapus sinkronisasi" destructive button.
 *
 * Otherwise show "Sinkronkan ke Google Calendar". Both calls use
 * `useTransition` + `router.refresh()` to re-fetch the server tree once
 * mappings change.
 */
export function SyncInterviewButton({
  interviewId,
  syncedMapping,
}: {
  interviewId: string
  syncedMapping: SyncedMapping
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSync() {
    setError(null)
    startTransition(async () => {
      const r = await syncInterviewToCalendar(interviewId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  function onUnsync() {
    if (!confirm('Hapus sinkronisasi event di Google Calendar?')) return
    setError(null)
    startTransition(async () => {
      const r = await unsyncInterview(interviewId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  if (syncedMapping) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {syncedMapping.htmlLink ? (
          <a
            href={syncedMapping.htmlLink}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100"
          >
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Tersinkron · Buka di Google Calendar
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-800">
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Tersinkron
          </span>
        )}
        <button
          type="button"
          onClick={onUnsync}
          disabled={pending}
          className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CalendarX className="h-3.5 w-3.5" aria-hidden="true" />
          {pending ? 'Memproses…' : 'Hapus sinkronisasi'}
        </button>
        {error && (
          <span role="alert" className="text-destructive text-xs">
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={pending}
        className="border-input text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {pending ? 'Mensinkronkan…' : 'Sinkronkan ke Google Calendar'}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
