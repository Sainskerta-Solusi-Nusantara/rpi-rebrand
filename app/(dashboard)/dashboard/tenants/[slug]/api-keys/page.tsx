import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Key, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  CreateTenantApiKeyForm,
  RevokeTenantApiKeyButton,
} from '@/components/organisms/tenant-api-key-forms'

export const metadata = { title: 'Tenant API Keys — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateShort = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

function expiryLabel(
  expiresAt: Date | null,
  revokedAt: Date | null,
): { label: string; tone: string } {
  if (revokedAt) {
    return { label: 'Dicabut', tone: 'bg-muted text-muted-foreground' }
  }
  if (!expiresAt) return { label: 'Tidak kedaluwarsa', tone: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' }
  const now = Date.now()
  const exp = expiresAt.getTime()
  if (exp < now) return { label: 'Kedaluwarsa', tone: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' }
  const days = Math.ceil((exp - now) / (24 * 60 * 60 * 1000))
  if (days <= 7) return { label: `Berakhir dalam ${days}h`, tone: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200' }
  return { label: `Berakhir ${dateShort.format(expiresAt)}`, tone: 'bg-muted text-muted-foreground' }
}

export default async function TenantApiKeysPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/api-keys`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
    notFound()
  }

  const keys = await prisma.tenantApiKey
    .findMany({
      where: { tenantId: tenant.id },
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

  const active = keys.filter((k) => !k.revokedAt)
  const inactive = keys.filter((k) => k.revokedAt)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.rumahpekerja.id'

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Tenant API Keys</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Kunci untuk akses programatik ke API tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
          Setiap kunci memiliki scopes terbatas dan dapat dicabut kapan saja.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Kunci aktif ({active.length})</h2>
        </div>

        <CreateTenantApiKeyForm tenantSlug={tenant.slug} />

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
                {active.map((k) => {
                  const exp = expiryLabel(k.expiresAt, k.revokedAt)
                  return (
                    <tr key={k.id} className="border-border/60 border-b last:border-b-0">
                      <td className="py-3 pr-3 font-medium">{k.name}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{k.tokenPrefix}…</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
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
                        {k.lastUsedAt ? (
                          <>
                            <div>{dateFmt.format(k.lastUsedAt)}</div>
                            {k.lastUsedIp && (
                              <div className="text-muted-foreground font-mono">
                                {k.lastUsedIp}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <RevokeTenantApiKeyButton keyId={k.id} keyName={k.name} />
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
          <h2 className="font-heading mb-4 text-lg">Kunci dicabut ({inactive.length})</h2>
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
                {inactive.map((k) => (
                  <tr key={k.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3">{k.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{k.tokenPrefix}…</td>
                    <td className="py-2 pr-3 text-xs">{dateShort.format(k.createdAt)}</td>
                    <td className="py-2 text-xs">
                      {k.revokedAt ? dateShort.format(k.revokedAt) : '—'}
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
          Kirim kunci sebagai header{' '}
          <code className="bg-background rounded px-1">Authorization: Bearer &lt;kunci&gt;</code>{' '}
          pada setiap permintaan API tenant. Kunci tenant diawali{' '}
          <code className="bg-background rounded px-1">rpi_t_</code> untuk
          membedakannya dari token pengguna.
        </p>
        <pre className="bg-background border-border overflow-x-auto rounded-md border p-3 text-xs"><code>{`curl -H "Authorization: Bearer rpi_t_xxxxx..." \\
     ${appUrl}/api/tenants/${tenant.slug}/jobs`}</code></pre>
      </section>
    </div>
  )
}
