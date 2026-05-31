import Link from 'next/link'
import { ChevronLeft, Gift, Trophy, UserPlus, Users } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { env } from '@/lib/env'
import { getMyReferralStats } from '@/lib/referrals/queries'
import { ReferralShare } from '@/components/organisms/referral-share'
import { ReferralLeaderboard } from '@/components/organisms/referral-leaderboard'

export const metadata = { title: 'Referral — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
})

export default async function ReferralDashboardPage() {
  const session = await requireAuth('/dashboard/referral')
  const userId = session.user.id

  const stats = await getMyReferralStats(userId)
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke dasbor
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Referral</h1>
        <p className="text-muted-foreground mt-1">
          Undang teman bergabung di RPI dan lacak performa kode referral Anda.
        </p>
      </header>

      <ReferralShare
        code={stats.referral?.code ?? null}
        baseUrl={baseUrl}
        totalSignups={stats.totalSignups}
        totalApplied={stats.totalApplied}
      />

      <section
        aria-label="Statistik"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase">
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Total undangan
          </div>
          <div className="font-heading mt-2 text-3xl">{stats.totalSignups}</div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Sudah melamar
          </div>
          <div className="font-heading mt-2 text-3xl">{stats.totalApplied}</div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Peringkat
          </div>
          <div className="font-heading mt-2 text-3xl">
            {stats.leaderboardRank !== null ? `#${stats.leaderboardRank}` : '—'}
          </div>
        </div>
      </section>

      <section
        aria-label="Aktivitas referral terbaru"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Aktivitas terbaru</h2>
        </div>

        {stats.recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada teman yang memakai kode Anda. Bagikan tautan untuk mulai
            mengundang.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">Bergabung</th>
                  <th className="py-2 font-medium">Melamar ke</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((row, idx) => (
                  <tr
                    key={`${row.signedUpAt.toISOString()}-${idx}`}
                    className="border-border/60 border-b last:border-b-0"
                  >
                    <td className="py-2 pr-3 font-medium">
                      {row.referredUserName ?? 'Pengguna RPI'}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(row.signedUpAt)}
                    </td>
                    <td className="text-muted-foreground py-2 text-xs">
                      {row.appliedJobTitle ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ReferralLeaderboard highlightUserId={userId} />
    </div>
  )
}
