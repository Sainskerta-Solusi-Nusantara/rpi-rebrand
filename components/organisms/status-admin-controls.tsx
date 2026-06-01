'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteIncident,
  updateMaintenanceStatus,
} from '@/lib/status/incident-actions'

type MaintenanceStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

/** Inline destructive button for soft-deleting an incident. */
export function IncidentDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!window.confirm('Hapus insiden ini? Tindakan ini akan menutup insiden.')) {
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await deleteIncident(id)
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push('/admin/status' as any)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error ? (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium text-red-600 disabled:opacity-60"
      >
        {isPending ? 'Menghapus…' : 'Hapus'}
      </button>
    </span>
  )
}

/** Status-transition buttons on the maintenance edit page. */
export function MaintenanceStatusActions({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: MaintenanceStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function transition(next: MaintenanceStatus) {
    setError(null)
    startTransition(async () => {
      const res = await updateMaintenanceStatus(id, next)
      if (res.ok) {
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  const LABELS: Record<MaintenanceStatus, string> = {
    planned: 'Direncanakan',
    in_progress: 'Sedang berjalan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  const transitions: MaintenanceStatus[] = (() => {
    switch (currentStatus) {
      case 'planned':
        return ['in_progress', 'cancelled']
      case 'in_progress':
        return ['completed', 'cancelled']
      case 'completed':
        return []
      case 'cancelled':
        return ['planned']
      default:
        return []
    }
  })()

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {transitions.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            Tidak ada transisi tersisa.
          </span>
        ) : (
          transitions.map((next) => (
            <button
              key={next}
              type="button"
              disabled={isPending}
              onClick={() => transition(next)}
              className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium disabled:opacity-60"
            >
              Ubah ke: {LABELS[next]}
            </button>
          ))
        )}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
