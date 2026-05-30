'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { UserStatus } from '@prisma/client'
import {
  bulkUpdateUserStatus,
  type BulkSkipReason,
} from '@/lib/admin/bulk-actions'

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'SUSPENDED', label: 'Ditangguhkan' },
  { value: 'DELETED', label: 'Dihapus' },
]

const SKIP_LABELS: Record<BulkSkipReason, string> = {
  self: 'diri sendiri',
  forbidden: 'tidak diizinkan',
  no_change: 'tidak ada perubahan',
  not_found: 'tidak ditemukan',
}

type ResultPanel =
  | { kind: 'idle' }
  | {
      kind: 'success'
      updated: number
      skipped: Partial<Record<BulkSkipReason, number>>
      errors: number
    }
  | { kind: 'error'; message: string }

export function AdminBulkToolbar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[]
  onClear: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<UserStatus>('ACTIVE')
  const [result, setResult] = useState<ResultPanel>({ kind: 'idle' })

  if (selectedIds.length === 0) return null

  function onApply() {
    const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
    const ok = window.confirm(
      `Ubah status ${selectedIds.length} pengguna menjadi "${label}"?`,
    )
    if (!ok) return

    setResult({ kind: 'idle' })
    startTransition(async () => {
      const r = await bulkUpdateUserStatus({ userIds: selectedIds, status })
      if (!r.ok) {
        setResult({ kind: 'error', message: r.error })
        return
      }
      setResult({
        kind: 'success',
        updated: r.data.updated,
        skipped: r.data.skipped,
        errors: r.data.errors.length,
      })
      router.refresh()
    })
  }

  function renderResult() {
    if (result.kind === 'idle') return null
    if (result.kind === 'error') {
      return (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {result.message}
        </p>
      )
    }
    const parts: string[] = [`${result.updated} diperbarui`]
    for (const key of Object.keys(result.skipped) as BulkSkipReason[]) {
      const count = result.skipped[key] ?? 0
      if (count > 0) {
        parts.push(`${count} dilewati (${SKIP_LABELS[key]})`)
      }
    }
    if (result.errors > 0) {
      parts.push(`${result.errors} gagal`)
    }
    return (
      <p
        role="status"
        className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success"
      >
        {parts.join(', ')}.
      </p>
    )
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-lg"
      role="region"
      aria-label="Aksi massal pengguna"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} pengguna dipilih
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={pending}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-60"
          >
            Batalkan pilihan
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor="bulk-status">
            Ubah status ke
          </label>
          <select
            id="bulk-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            disabled={pending}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onApply}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Memproses…' : 'Terapkan'}
          </button>
        </div>
      </div>

      {result.kind !== 'idle' && (
        <div className="mx-auto max-w-7xl px-4 pb-3">{renderResult()}</div>
      )}
    </div>
  )
}
