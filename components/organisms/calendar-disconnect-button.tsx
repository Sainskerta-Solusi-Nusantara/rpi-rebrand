'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Unlink } from 'lucide-react'
import { disconnectCalendar } from '@/lib/calendar/actions'

/**
 * Client-side "Putuskan" button used from `<CalendarConnectCard>`.
 * Calls `disconnectCalendar(provider)` in a transition and refreshes the
 * server tree so the parent server component re-fetches account state.
 */
export function CalendarDisconnectButton({
  provider,
}: {
  provider: 'google' | 'microsoft'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!confirm('Putuskan koneksi kalender? Sinkronisasi wawancara dihentikan.')) {
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await disconnectCalendar(provider)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Unlink className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Memproses…' : 'Putuskan'}
      </button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
