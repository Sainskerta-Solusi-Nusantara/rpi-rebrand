'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Pencil, Trash2 } from 'lucide-react'
import {
  deleteSavedSearch,
  toggleSavedSearchAlerts,
} from '@/lib/saved-searches/actions'
import { SavedSearchForm } from '@/components/organisms/saved-search-form'

export type SavedSearchRowData = {
  id: string
  name: string
  query: string | null
  categorySlug: string | null
  location: string | null
  employmentType: string | null
  emailAlerts: boolean
  lastAlertAt: Date | string | null
  lastAlertCount: number
  createdAt: Date | string
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Penuh waktu',
  PART_TIME: 'Paruh waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Lepas',
}

function criteriaSummary(s: SavedSearchRowData): string {
  const parts: string[] = []
  if (s.query) parts.push(`Kata kunci: ${s.query}`)
  if (s.categorySlug) parts.push(`Kategori: ${s.categorySlug}`)
  if (s.location) parts.push(`Lokasi: ${s.location}`)
  if (s.employmentType) {
    parts.push(`Tipe: ${EMPLOYMENT_LABELS[s.employmentType] ?? s.employmentType}`)
  }
  return parts.length === 0 ? 'Semua lowongan' : parts.join(' · ')
}

function formatLastAlert(at: Date | string | null, count: number): string | null {
  if (!at) return null
  const dt = typeof at === 'string' ? new Date(at) : at
  const formatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt)
  return `Terakhir kirim alert: ${formatted} · ${count} lowongan baru`
}

export function SavedSearchRow({ search }: { search: SavedSearchRowData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  function onToggleAlerts() {
    setError(null)
    startTransition(async () => {
      const r = await toggleSavedSearchAlerts(search.id)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  function onDelete() {
    if (!window.confirm(`Hapus pencarian tersimpan "${search.name}"?`)) return
    setError(null)
    startTransition(async () => {
      const r = await deleteSavedSearch(search.id)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  const lastAlert = formatLastAlert(search.lastAlertAt, search.lastAlertCount)

  return (
    <li className="border-border bg-card rounded-xl border p-4">
      {editing ? (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Ubah pencarian</h3>
          <SavedSearchForm
            mode="edit"
            initial={{
              id: search.id,
              name: search.name,
              query: search.query,
              categorySlug: search.categorySlug,
              location: search.location,
              employmentType: search.employmentType,
              emailAlerts: search.emailAlerts,
            }}
            onSuccess={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-foreground">{search.name}</h3>
              {search.emailAlerts ? (
                <span
                  title="Alert aktif"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300"
                >
                  <Bell className="h-3 w-3" aria-hidden="true" />
                  Alert aktif
                </span>
              ) : (
                <span
                  title="Alert nonaktif"
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  <BellOff className="h-3 w-3" aria-hidden="true" />
                  Alert mati
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {criteriaSummary(search)}
            </p>
            {lastAlert && (
              <p className="mt-1 text-xs text-muted-foreground">{lastAlert}</p>
            )}
            {error && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleAlerts}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              {search.emailAlerts ? (
                <>
                  <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Matikan alert
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                  Aktifkan alert
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Ubah
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Hapus
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
