import { requireAuth } from '@/lib/auth/session'
import Link from 'next/link'
import { Shield, Clock, Globe, KeyRound, LogIn, LogOut, MailCheck } from 'lucide-react'
import { getRecentAuthEvents, getUserSecuritySnapshot } from '@/lib/auth/audit-queries'
import { ResendVerificationButton } from '@/components/organisms/resend-verification-button'

export const metadata = { title: 'Keamanan Akun — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function truncate(value: string | null, max = 60): string {
  if (!value) return '—'
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export default async function KeamananPage() {
  const session = await requireAuth('/dashboard/keamanan')
  const userId = session.user.id

  const [events, snapshot] = await Promise.all([
    getRecentAuthEvents(userId, 10),
    getUserSecuritySnapshot(userId),
  ])

  const lastLoginLabel = snapshot.lastLoginAt
    ? dateFmt.format(snapshot.lastLoginAt)
    : 'Belum tercatat'

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Keamanan Akun</h1>
        <p className="text-muted-foreground mt-1">
          Lihat status keamanan akun dan aktivitas masuk terakhir.
        </p>
      </header>

      <section aria-label="Ringkasan akun" className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Ringkasan</h2>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Login terakhir
            </dt>
            <dd className="mt-1 text-sm font-medium">{lastLoginLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Password
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {snapshot.passwordSet ? 'Telah diatur' : 'Belum diatur'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Globe className="h-4 w-4" aria-hidden="true" />
              Google
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {snapshot.googleLinked ? 'Terhubung' : 'Tidak terhubung'}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Verifikasi email"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Verifikasi email</h2>
        </div>

        <p className="text-sm">
          <span className="text-muted-foreground">Email: </span>
          <span className="font-medium">{snapshot.email ?? '—'}</span>
        </p>

        {snapshot.emailVerifiedAt ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Terverifikasi
            </span>
            <span className="text-muted-foreground">
              pada {dateFmt.format(snapshot.emailVerifiedAt)}
            </span>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-muted-foreground text-sm">
              Email Anda belum terverifikasi. Periksa kotak masuk untuk tautan
              verifikasi atau kirim ulang.
            </p>
            <ResendVerificationButton />
          </div>
        )}
      </section>

      <section aria-label="Password" className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Password</h2>
        </div>
        {!snapshot.passwordSet && (
          <p className="text-muted-foreground mb-4 text-sm">
            Akun menggunakan Google. Atur password untuk mengaktifkan login dengan email.
          </p>
        )}
        <Link
          href="/dashboard/keamanan/password"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          Ganti password
        </Link>
      </section>

      <section
        aria-label="Penyedia OAuth"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Penyedia OAuth</h2>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Google</span>
          <span
            className={
              snapshot.googleLinked
                ? 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'
                : 'bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
            }
          >
            {snapshot.googleLinked ? 'Terhubung' : 'Belum terhubung'}
          </span>
        </div>
      </section>

      <section
        aria-label="Login terakhir"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Login terakhir</h2>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Waktu: </span>
          <span className="font-medium">{lastLoginLabel}</span>
        </p>
      </section>

      <section
        aria-label="Aktivitas masuk terakhir"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Aktivitas terakhir</h2>
        </div>

        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada aktivitas terekam.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">IP</th>
                  <th className="py-2 font-medium">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const isLogin = e.action === 'LOGIN'
                  const fullUa = e.userAgent ?? ''
                  return (
                    <tr key={e.id} className="border-border/60 border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        <span
                          className={
                            isLogin
                              ? 'inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                              : 'bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
                          }
                        >
                          {isLogin ? (
                            <LogIn className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <LogOut className="h-3 w-3" aria-hidden="true" />
                          )}
                          {e.action}
                        </span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {dateFmt.format(e.createdAt)}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{e.ip ?? '—'}</td>
                      <td className="text-muted-foreground max-w-[18rem] py-2 text-xs">
                        <span title={fullUa || undefined}>{truncate(e.userAgent)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
