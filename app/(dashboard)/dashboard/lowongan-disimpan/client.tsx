'use client'

import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { SavedSearchForm } from '@/components/organisms/saved-search-form'
import { useI18n } from '@/lib/i18n/i18n-provider'

/**
 * Client wrapper that controls the inline "create new" form toggle on the
 * Saved Searches page. The list itself is rendered server-side and passed
 * in via `children` so we keep the row data on the server.
 */
export function SavedSearchListClient({
  children,
  hasItems,
}: {
  children: ReactNode
  hasItems: boolean
}) {
  const { t } = useI18n()
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.pagesDash.lowonganDisimpan.createButton}
          </button>
        )}
      </div>

      {creating && (
        <section className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-lg mb-4">{t.pagesDash.lowonganDisimpan.newSearchHeading}</h2>
          <SavedSearchForm
            mode="create"
            onSuccess={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </section>
      )}

      {!creating && !hasItems ? null : null}
      {children}
    </div>
  )
}
