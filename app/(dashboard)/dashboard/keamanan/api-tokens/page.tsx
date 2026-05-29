import Link from 'next/link'
import { ChevronLeft, Key, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { CreateApiTokenForm, RevokeApiTokenButton } from '@/components/organisms/api-token-forms'

export const metadata = { title: 'Personal API Tokens — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateShort = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

function expiryLabel(expiresAt: Date | null, revokedAt: Date | null): { label: string; tone: string } {
  if (revokedAt) {
    return { label: 'Dicabut', tone: 'bg-muted text-muted-foreground' }
  }
  if (!expiresAt) return { label: 'Tidak kedaluwarsa', tone: 'bg-green-100 text-green-800' }
  const now = Date.now()
  const exp = expiresAt.getTime()
  if (exp < now) return { label: 'Kedaluwarsa', tone: 'bg-red-100 text-red-800' }
  const days = Math.ceil((exp - now) / (24 * 60 * 60 * 1000))
  if (days <= 7) return { label: `Berakhir dalam ${days}h`, tone: 'bg-amber-100 text-amber-800' }
  return { label: `Berakhir ${dateShort.format(expiresAt)}`, tone: 'bg-muted text-muted-foreground' }
}

export default async function ApiTokensPage() {
  const session = await requireAuth('/dashboard/keamanan/api-tokens')

  const tokens = await prisma.personalAccessToken
    .findMany({
      where: { userId: session.user.id },
      orderBy: [{ revokedAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        lastUsedIp: true,
        createdAt: true,
      },
    })
    .catch(() => [])

  const active = tokens.filter((t) => !t.revokedAt)
  const inactive = tokens.filter((t) => t.revokedAt)

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          href="/dashboard/keamanan"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke keamanan
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Personal API Tokens</h1>
        <p className="text-muted-foreground mt-1">
          Untuk akses programatik ke API RPI dengan kredensial Anda. Token
          memiliki scopes terbatas dan dapat dicabut kapan saja.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Token aktif ({active.length})</h2>
        </div>

        <CreateApiTokenForm />

        {active.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">Prefix</th>
                  <th className="py-2 pr-3 font-medium">Scopes</th>
                  <th className="py-2 pr-3 font-medium">Masa berlaku</th>
                  <th className="py-2 pr-3 font-medium">Dipakai terakhir</th>
                  <th className="py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {active.map((t) => {
                  const exp = expiryLabel(t.expiresAt, t.revokedAt)
                  return (
                    <tr key={t.id} className="border-border/60 border-b last:border-b-0">
                      <td className="py-3 pr-3 font-medium">{t.name}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{t.tokenPrefix}…</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {t.scopes.map((s) => (
                            <span
                              key={s}
                              className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${exp.tone}`}
                        >
                          {exp.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs">
                        {t.lastUsedAt ? (
                          <>
                            <div>{dateFmt.format(t.lastUsedAt)}</div>
                            {t.lastUsedIp && (
                              <div className="text-muted-foreground font-mono">
                                {t.lastUsedIp}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <RevokeApiTokenButton tokenId={t.id} tokenName={t.name} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {inactive.length > 0 && (
        <section className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading mb-4 text-lg">Token dicabut ({inactive.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">Prefix</th>
                  <th className="py-2 pr-3 font-medium">Dibuat</th>
                  <th className="py-2 font-medium">Dicabut</th>
                </tr>
              </thead>
              <tbody>
                {inactive.map((t) => (
                  <tr key={t.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3">{t.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{t.tokenPrefix}…</td>
                    <td className="py-2 pr-3 text-xs">{dateShort.format(t.createdAt)}</td>
                    <td className="py-2 text-xs">
                      {t.revokedAt ? dateShort.format(t.revokedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="border-border bg-muted/40 rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Cara pakai</h2>
        </div>
        <p className="text-muted-foreground mb-3 text-sm">
          Kirim token sebagai header <code className="bg-background rounded px-1">Authorization: Bearer &lt;token&gt;</code> pada setiap permintaan API.
        </p>
        <pre className="bg-background border-border overflow-x-auto rounded-md border p-3 text-xs"><code>{`curl -H "Authorization: Bearer rpi_xxxxx..." \\
     ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.rumahpekerja.id'}/api/me/export`}</code></pre>
      </section>
    </div>
  )
}
