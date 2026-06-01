'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFlag, deleteFlag } from '@/lib/feature-flags/flag-actions'

export function FlagToggleSwitch({
  id,
  initialEnabled,
}: {
  id: string
  initialEnabled: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [error, setError] = useState<string | null>(null)

  function onToggle() {
    const next = !enabled
    setError(null)
    setEnabled(next)
    startTransition(async () => {
      const result = await toggleFlag(id, next)
      if (!result.ok) {
        setEnabled(!next)
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        aria-pressed={enabled}
        className={`inline-flex h-6 w-11 items-center rounded-full border transition-colors disabled:opacity-60 ${
          enabled
            ? 'border-emerald-500/40 bg-emerald-500/80'
            : 'border-border bg-muted'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-xs">
        {enabled ? (
          <span className="text-emerald-700 dark:text-emerald-400">Aktif</span>
        ) : (
          <span className="text-muted-foreground">Nonaktif</span>
        )}
      </span>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}

export function FlagDeleteButton({ id, label }: { id: string; label?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!confirm('Hapus flag ini? Semua override akan ikut terhapus.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteFlag(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/dashboard/feature-flags' as any)
      router.refresh()
    })
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium disabled:opacity-60"
      >
        {isPending ? 'Menghapus…' : label ?? 'Hapus'}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
