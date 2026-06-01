'use client'

import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { SavedSearchForm } from '@/components/organisms/saved-search-form'
import { useI18n } from '@/lib/i18n/i18n-provider'

/**
 * Client wrapper for the Pencarian Tersimpan dashboard page. Owns the
 * inline create-form toggle. The list itself is rendered server-side and
 * passed in via `children`.
 */
export function PencarianTersimpanClient({ children }: { children: ReactNode }) {
  const [creating, setCreating] = useState(false)
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.dashboard.savedSearches.newSearch}
          </button>
        )}
      </div>

      {creating && (
        <section className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-lg mb-1">{t.dashboard.savedSearches.nameSearchTitle}</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            {t.dashboard.savedSearches.nameSearchDesc}
          </p>
          <SavedSearchForm
            mode="create"
            onSuccess={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </section>
      )}

      {children}
    </div>
  )
}
