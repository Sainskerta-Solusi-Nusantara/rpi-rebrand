import { requireAuth } from '@/lib/auth/session'
import { SavedSearchList } from '@/components/organisms/saved-search-list'
import { PencarianTersimpanClient } from './client'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Pencarian Tersimpan — Dasbor' }

/**
 * Dashboard: Pencarian Tersimpan
 *
 * Renders the user's saved searches (server-side via SavedSearchList) plus
 * a "buat pencarian baru" entry point that opens the inline create form.
 */
export default async function PencarianTersimpanPage() {
  const session = await requireAuth('/dashboard/pencarian-tersimpan')
  const t = await getServerT()
  const listNode = await SavedSearchList({ userId: session.user.id })

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.savedSearches.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.dashboard.savedSearches.subtitle}
          </p>
        </div>
      </header>

      <PencarianTersimpanClient>{listNode}</PencarianTersimpanClient>
    </div>
  )
}
