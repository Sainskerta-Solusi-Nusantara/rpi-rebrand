import { Search } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { listSavedSearches } from '@/lib/saved-searches/queries'
import { SavedSearchRow } from '@/components/organisms/saved-search-row'
import { SavedSearchListClient } from './client'

export const metadata = { title: 'Pencarian Tersimpan — Dasbor' }

export default async function SavedSearchesPage() {
  const session = await requireAuth('/dashboard/lowongan-disimpan')
  const searches = await listSavedSearches(session.user.id)

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Pencarian Tersimpan</h1>
          <p className="text-muted-foreground mt-1">
            Simpan kriteria pencarian lowongan favorit dan dapatkan alert email saat ada lowongan baru cocok.
          </p>
        </div>
      </header>

      <SavedSearchListClient hasItems={searches.length > 0}>
        {searches.length === 0 ? (
          <div className="border-border bg-card flex flex-col items-center rounded-2xl border p-10 text-center">
            <Search
              className="text-muted-foreground mb-3 h-10 w-10"
              aria-hidden="true"
            />
            <h2 className="font-heading text-lg">Belum ada pencarian tersimpan</h2>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Buat pencarian pertama Anda untuk menerima alert lowongan baru sesuai kriteria yang Anda pilih.
            </p>
          </div>
        ) : (
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
        )}
      </SavedSearchListClient>
    </div>
  )
}
