import { Trophy } from 'lucide-react'
import { getTenantReferralLeaderboard } from '@/lib/referrals/queries'

function initials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? '?'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

/**
 * Server component — renders the top 20 referrers across the platform.
 * Data fetched via the cached `getTenantReferralLeaderboard()` query.
 */
export async function ReferralLeaderboard({
  highlightUserId,
}: {
  highlightUserId?: string
} = {}) {
  const rows = await getTenantReferralLeaderboard()

  return (
    <section
      aria-label="Papan peringkat referral"
      className="border-border bg-card rounded-2xl border p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5" aria-hidden="true" />
        <h2 className="font-heading text-lg">Papan peringkat</h2>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        20 pengundang teratas berdasarkan jumlah pemakaian kode.
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Belum ada referral yang digunakan. Jadilah yang pertama!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Pengundang</th>
                <th className="py-2 pr-3 font-medium text-right">Undangan</th>
                <th className="py-2 font-medium text-right">Melamar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const isMe = highlightUserId && r.userId === highlightUserId
                return (
                  <tr
                    key={r.userId}
                    className={`border-border/60 border-b last:border-b-0 ${
                      isMe ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-2 pr-3 font-mono text-xs">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.image}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="bg-muted text-muted-foreground inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">
                            {initials(r.userName)}
                          </span>
                        )}
                        <span className="font-medium">
                          {r.userName ?? 'Pengguna RPI'}
                          {isMe && (
                            <span className="text-primary ml-1 text-xs">
                              (Anda)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {r.uses}
                    </td>
                    <td className="py-2 text-right">{r.applied}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
