'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Pencil, Trash2 } from 'lucide-react'
import {
  deleteSavedSearch,
  toggleSavedSearchAlerts,
} from '@/lib/saved-searches/actions'
import { SavedSearchForm } from '@/components/organisms/saved-search-form'
import { useI18n } from '@/lib/i18n/i18n-provider'

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

export function SavedSearchRow({ search }: { search: SavedSearchRowData }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const tl = t.formsSavedSearch.savedSearchRow
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  function criteriaSummary(s: SavedSearchRowData): string {
    const parts: string[] = []
    if (s.query) parts.push(tl.criteriaKeyword.replace('{value}', s.query))
    if (s.categorySlug) parts.push(tl.criteriaCategory.replace('{value}', s.categorySlug))
    if (s.location) parts.push(tl.criteriaLocation.replace('{value}', s.location))
    if (s.employmentType) {
      const label =
        (tl.employmentLabels as Record<string, string>)[s.employmentType] ?? s.employmentType
      parts.push(tl.criteriaType.replace('{value}', label))
    }
    return parts.length === 0 ? tl.allJobs : parts.join(' · ')
  }

  function formatLastAlert(at: Date | string | null, count: number): string | null {
    if (!at) return null
    const dt = typeof at === 'string' ? new Date(at) : at
    const formatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(dt)
    return tl.lastAlertMsg
      .replace('{date}', formatted)
      .replace('{count}', String(count))
  }

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
    if (!window.confirm(tl.confirmDelete.replace('{name}', search.name))) return
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
          <h3 className="font-medium text-foreground">{tl.editHeading}</h3>
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
                  title={tl.alertActiveBadge}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300"
                >
                  <Bell className="h-3 w-3" aria-hidden="true" />
                  {tl.alertActiveBadge}
                </span>
              ) : (
                <span
                  title={tl.alertOffBadge}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  <BellOff className="h-3 w-3" aria-hidden="true" />
                  {tl.alertOffBadge}
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
                  {tl.btnDisableAlert}
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                  {tl.btnEnableAlert}
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
              {tl.btnEdit}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {tl.btnDelete}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
