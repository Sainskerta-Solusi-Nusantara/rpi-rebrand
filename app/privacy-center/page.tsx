import Link from 'next/link'
import type { Metadata, Route } from 'next'
import { auth } from '@/lib/auth/session'
import {
  getConsentHistoryForSession,
  getConsentHistoryForUser,
  getCurrentConsent,
  type ConsentHistoryEntry,
} from '@/lib/consent/consent-queries'
import { PrivacyCenterPrefsForm } from './prefs-form'

export const metadata: Metadata = {
  title: 'Pusat Privasi',
  description: 'Atur preferensi cookie, lihat riwayat persetujuan, dan kelola data Anda.',
}

export const dynamic = 'force-dynamic'

function formatDate(d: Date) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(d)
  } catch {
    return d.toISOString()
  }
}

function categoryChips(entry: ConsentHistoryEntry) {
  const items: { key: string; label: string; on: boolean }[] = [
    { key: 'necessary', label: 'Diperlukan', on: entry.necessary },
    { key: 'analytics', label: 'Analitik', on: entry.analytics },
    { key: 'marketing', label: 'Pemasaran', on: entry.marketing },
    { key: 'functional', label: 'Fungsional', on: entry.functional },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it.key}
          className={
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
            (it.on
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
              : 'bg-muted text-muted-foreground')
          }
        >
          {it.label}: {it.on ? 'On' : 'Off'}
        </span>
      ))}
    </div>
  )
}

export default async function PrivacyCenterPage() {
  const session = await auth().catch(() => null)
  const { prefs, sessionId } = await getCurrentConsent()

  let history: ConsentHistoryEntry[] = []
  if (session?.user?.id) {
    history = await getConsentHistoryForUser(session.user.id)
  } else if (sessionId) {
    history = await getConsentHistoryForSession(sessionId)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cookie &amp; Privasi
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground">Pusat Privasi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atur preferensi cookie Anda dan kelola data pribadi sesuai{' '}
          <Link href={'/privacy-policy' as Route} className="underline underline-offset-2">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </header>

      <section className="mb-10 rounded-lg border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">Pengaturan Privasi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktifkan atau nonaktifkan kategori cookie. Kategori &ldquo;Diperlukan&rdquo;
          tidak dapat dimatikan karena dibutuhkan untuk login dan keamanan.
        </p>
        <div className="mt-5">
          <PrivacyCenterPrefsForm initial={prefs} />
        </div>
      </section>

      <section className="mb-10 rounded-lg border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">Riwayat persetujuan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Catatan perubahan persetujuan cookie Anda{' '}
          {session?.user?.id ? 'di akun ini' : 'untuk sesi ini'}.
        </p>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada catatan persetujuan.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {history.map((entry) => (
              <li key={entry.id} className="py-3">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-foreground">
                    <span className="font-medium">{formatDate(entry.updatedAt)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      versi {entry.version}
                    </span>
                  </div>
                  {categoryChips(entry)}
                </div>
                {(entry.ipAddress || entry.userAgent) && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {entry.ipAddress ? `IP ${entry.ipAddress}` : ''}
                    {entry.ipAddress && entry.userAgent ? ' · ' : ''}
                    {entry.userAgent
                      ? entry.userAgent.length > 90
                        ? entry.userAgent.slice(0, 90) + '…'
                        : entry.userAgent
                      : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10 rounded-lg border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">Permintaan data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hak akses dan penghapusan data sesuai UU Pelindungan Data Pribadi.
        </p>
        {session?.user?.id ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/api/me/export"
              className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              download
            >
              Unduh data saya
            </a>
            <Link
              href="/dashboard/keamanan"
              className="inline-flex items-center rounded-md border border-destructive bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Hapus akun saya
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Untuk meminta ekspor atau penghapusan data,{' '}
            <Link href="/login" className="underline underline-offset-2">
              masuk
            </Link>{' '}
            ke akun Anda atau{' '}
            <Link href="/contact" className="underline underline-offset-2">
              hubungi support
            </Link>
            .
          </p>
        )}
      </section>

      <footer className="text-xs text-muted-foreground">
        Lihat{' '}
        <Link href={'/privacy-policy' as Route} className="underline underline-offset-2">
          Kebijakan Privasi
        </Link>{' '}
        untuk detail bagaimana data Anda diproses.
      </footer>
    </main>
  )
}
