import { Search } from 'lucide-react'
import { getUserSavedSearches } from '@/lib/saved-search/saved-search-queries'
import { SavedSearchRow } from '@/components/organisms/saved-search-row'

/**
 * Server-rendered list of a user's saved searches. Each row shows the
 * criteria summary, the alert state, the date+count of the last alert
 * (when present), and edit / delete / toggle-alert buttons.
 *
 * Props:
 *   - userId: owner whose searches we want to display.
 */
export async function SavedSearchList({ userId }: { userId: string }) {
  const searches = await getUserSavedSearches(userId)

  if (searches.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center rounded-2xl border p-10 text-center">
        <Search className="text-muted-foreground mb-3 h-10 w-10" aria-hidden="true" />
        <h2 className="font-heading text-lg">Belum ada pencarian tersimpan</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          Buat pencarian pertama Anda untuk menerima alert email mingguan saat ada
          lowongan baru yang cocok dengan kriteria Anda.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {searches.map((s) => (
        <SavedSearchRow
          key={s.id}
          search={{
            id: s.id,
            name: s.name,
            query: s.query,
            categorySlug: s.categorySlug,
            location: s.location,
            employmentType: s.employmentType,
            emailAlerts: s.emailAlerts,
            lastAlertAt: s.lastAlertAt,
            lastAlertCount: s.lastAlertCount,
            createdAt: s.createdAt,
          }}
        />
      ))}
    </ul>
  )
}
