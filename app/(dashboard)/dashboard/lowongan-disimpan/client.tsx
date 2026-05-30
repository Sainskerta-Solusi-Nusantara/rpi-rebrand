'use client'

import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { SavedSearchForm } from '@/components/organisms/saved-search-form'

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
  const [creating, setCreating] = useState(false)

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
            Buat pencarian baru
          </button>
        )}
      </div>

      {creating && (
        <section className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-lg mb-4">Pencarian baru</h2>
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
