import { requireRole } from '@/lib/auth/session'
import { listFlags, getFlagCounts } from '@/lib/moderation/queries'
import { ModerationFlagRow } from '@/components/organisms/moderation-flag-row'

export const metadata = { title: 'Antrian Moderasi' }

const PAGE_SIZE = 25

const STATUSES = [
  { value: '', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'reviewing', label: 'Ditinjau' },
  { value: 'resolved', label: 'Selesai' },
  { value: 'dismissed', label: 'Ditolak' },
]

const RESOURCE_TYPES = [
  { value: '', label: 'Semua jenis' },
  { value: 'job', label: 'Lowongan' },
  { value: 'course', label: 'Kursus' },
  { value: 'user', label: 'Pengguna' },
  { value: 'profile', label: 'Profil' },
  { value: 'message', label: 'Pesan' },
  { value: 'application', label: 'Lamaran' },
]

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await requireRole('SUPERADMIN', 'ADMIN')

  const status =
    typeof searchParams.status === 'string' && searchParams.status.length > 0
      ? searchParams.status
      : undefined
  const resourceType =
    typeof searchParams.type === 'string' && searchParams.type.length > 0
      ? searchParams.type
      : undefined
  const query =
    typeof searchParams.q === 'string' && searchParams.q.length > 0
      ? searchParams.q
      : undefined
  const pageRaw =
    typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const [{ items, total }, counts] = await Promise.all([
    listFlags({ status, resourceType, query, page, pageSize: PAGE_SIZE }),
    getFlagCounts(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (resourceType) params.set('type', resourceType)
    if (query) params.set('q', query)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin/moderasi?${qs}` : '/admin/moderasi'
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Antrian Moderasi</h1>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString('id-ID')} laporan sesuai filter saat ini.
          </p>
        </div>
        <form className="flex flex-wrap gap-2" action="/admin/moderasi">
          <input
            name="q"
            defaultValue={query ?? ''}
            placeholder="Cari ID atau deskripsi"
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          />
          <select
            name="status"
            defaultValue={status ?? ''}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={resourceType ?? ''}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm">
            Filter
          </button>
        </form>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ['pending', 'Menunggu'],
            ['reviewing', 'Ditinjau'],
            ['resolved', 'Selesai'],
            ['dismissed', 'Ditolak'],
          ] as const
        ).map(([key, label]) => (
          <div
            key={key}
            className="border-border bg-card rounded-xl border p-4"
          >
            <div className="text-muted-foreground text-xs uppercase tracking-wide">
              {label}
            </div>
            <div className="font-heading mt-1 text-2xl font-semibold">
              {counts[key].toLocaleString('id-ID')}
            </div>
          </div>
        ))}
      </div>

      <section>
        <ul className="border-border overflow-hidden rounded-xl border">
          {items.length === 0 ? (
            <li className="text-muted-foreground p-6 text-center text-sm">
              Tidak ada laporan yang cocok.
            </li>
          ) : (
            items.map((flag) => (
              <ModerationFlagRow key={flag.id} flag={flag} />
            ))
          )}
        </ul>
      </section>

      {totalPages > 1 ? (
        <nav
          aria-label="Paginasi"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <span className="text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={pageHref(page - 1)}
                className="border-border rounded-md border px-3 py-1.5"
              >
                Sebelumnya
              </a>
            ) : null}
            {page < totalPages ? (
              <a
                href={pageHref(page + 1)}
                className="border-border rounded-md border px-3 py-1.5"
              >
                Berikutnya
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
