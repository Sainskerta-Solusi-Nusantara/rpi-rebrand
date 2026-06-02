import { Search } from 'lucide-react'
import { getUserSavedSearches } from '@/lib/saved-search/saved-search-queries'
import { SavedSearchRow } from '@/components/organisms/saved-search-row'
import { getServerT } from '@/lib/i18n/server-dictionary'

/**
 * Server-rendered list of a user's saved searches. Each row shows the
 * criteria summary, the alert state, the date+count of the last alert
 * (when present), and edit / delete / toggle-alert buttons.
 *
 * Props:
 *   - userId: owner whose searches we want to display.
 */
export async function SavedSearchList({ userId }: { userId: string }) {
  const t = await getServerT()
  const s = t.formsMisc4.savedSearchList

  const searches = await getUserSavedSearches(userId)

  if (searches.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center rounded-2xl border p-10 text-center">
        <Search className="text-muted-foreground mb-3 h-10 w-10" aria-hidden="true" />
        <h2 className="font-heading text-lg">{s.emptyHeading}</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          {s.emptyDesc}
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {searches.map((sr) => (
        <SavedSearchRow
          key={sr.id}
          search={{
            id: sr.id,
            name: sr.name,
            query: sr.query,
            categorySlug: sr.categorySlug,
            location: sr.location,
            employmentType: sr.employmentType,
            emailAlerts: sr.emailAlerts,
            lastAlertAt: sr.lastAlertAt,
            lastAlertCount: sr.lastAlertCount,
            createdAt: sr.createdAt,
          }}
        />
      ))}
    </ul>
  )
}
