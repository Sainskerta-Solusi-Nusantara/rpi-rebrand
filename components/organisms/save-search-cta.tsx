'use client'

import { useMemo, useState, useTransition } from 'react'
import { Bookmark, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSavedSearch } from '@/lib/saved-search/saved-search-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

/**
 * "Simpan pencarian ini" CTA used at the top of public job search results.
 * Reads the current URL params and pre-fills the form so the user can save
 * the active filter set as a SavedSearch row.
 *
 * Unauthenticated visitors get bounced to /login with a callbackUrl so they
 * return here after sign-in.
 *
 * Props:
 *   - isAuthenticated: whether the visitor has a session.
 */
export function SaveSearchCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsSavedSearch.saveSearchCta
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const initial = useMemo(() => {
    const q = params?.get('q') ?? ''
    // /jobs takes `category` (slug); SavedSearch.categorySlug stores the same.
    const categorySlug = params?.get('category') ?? ''
    // /jobs takes `location` as a LocationType (ONSITE|HYBRID|REMOTE) — not the
    // text location SavedSearch tracks. Leave SavedSearch.location empty and
    // let the user fill the free-text city if they want.
    const employmentTypes = (params?.get('type') ?? '').split(',').filter(Boolean)
    const employmentType = employmentTypes.length === 1 ? employmentTypes[0]! : ''
    return { query: q, categorySlug, employmentType }
  }, [params])

  function handleOpen() {
    if (!isAuthenticated) {
      const currentSearch = params?.toString() ?? ''
      const returnTo =
        '/jobs' + (currentSearch ? `?${currentSearch}` : '')
      router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`)
      return
    }
    setError(null)
    setSuccess(null)
    // Default name: derive from current query / category if user hasn't typed.
    if (!name) {
      const parts: string[] = []
      if (initial.query) parts.push(initial.query)
      if (initial.categorySlug) parts.push(initial.categorySlug)
      setName(parts.join(' · ').slice(0, 80) || tl.defaultName)
    }
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const fd = new FormData()
    fd.set('name', name)
    fd.set('query', initial.query)
    fd.set('categorySlug', initial.categorySlug)
    fd.set('location', '')
    fd.set('employmentType', initial.employmentType ?? '')
    fd.set('emailAlerts', emailAlerts ? 'true' : 'false')

    startTransition(async () => {
      const result = await createSavedSearch(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSuccess(tl.successMsg)
      setOpen(false)
    })
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ring)] bg-[color:var(--ring)]/5 px-3 py-1.5 text-xs font-medium text-[color:var(--ring)] transition hover:bg-[color:var(--ring)]/15"
      >
        <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        {tl.btnSaveSearch}
      </button>

      {success && (
        <p role="status" className="text-emerald-700 dark:text-emerald-300 mt-2 text-xs">
          {success}
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-search-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-card text-foreground w-full max-w-md rounded-2xl border border-border p-6 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <h2 id="save-search-title" className="font-heading text-lg">
                {tl.dialogTitle}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-muted-foreground mb-4 text-xs">
              {tl.dialogDesc}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="ss-cta-name" className="mb-1 block text-xs font-medium">
                  {tl.nameLabel} <span className="text-destructive">{tl.nameRequired}</span>
                </label>
                <input
                  id="ss-cta-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-[color:var(--ring)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/30"
                  placeholder={tl.namePlaceholder}
                />
              </div>

              <div className="bg-muted/40 rounded-md border border-border p-3 text-xs">
                <p className="text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                  {tl.criteriaHeading}
                </p>
                <ul className="text-foreground/80 space-y-0.5">
                  <li>{tl.criteriaKeyword} {initial.query || <em>{tl.criteriaEmpty}</em>}</li>
                  <li>{tl.criteriaCategory} {initial.categorySlug || <em>{tl.criteriaAll}</em>}</li>
                  <li>
                    {tl.criteriaType} {initial.employmentType || <em>{tl.criteriaAll}</em>}
                  </li>
                </ul>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                />
                {tl.emailAlertsLabel}
              </label>

              {error && (
                <p role="alert" className="text-destructive text-xs">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-xs"
                >
                  {tl.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? tl.btnPending : tl.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
