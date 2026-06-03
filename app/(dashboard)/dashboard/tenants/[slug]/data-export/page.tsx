import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Archive, ShieldAlert } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { TenantExportButton } from '@/components/organisms/tenant-export-button'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Ekspor data tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function TenantDataExportPage({
  params,
}: {
  params: { slug: string }
}) {
  const t = await getServerT()
  const de = t.pagesTenant4.dataExport

  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/data-export`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerUserId: true,
      },
    })
    .catch(() => null)
  if (!tenant) notFound()

  // Strict OWNER-only: not based on the tenant.delete permission, so we
  // check ownerUserId directly.
  if (tenant.ownerUserId !== session.user.id) {
    notFound()
  }

  const recentExports = await prisma.auditLog
    .findMany({
      where: { tenantId: tenant.id, resource: 'tenant.data_export' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        ip: true,
        userAgent: true,
        metadata: true,
        user: { select: { email: true, name: true } },
      },
    })
    .catch(() => [])

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {de.backTo.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Archive className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            {de.heading}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {de.description.replace('{name}', tenant.name)}
        </p>
      </header>

      <section
        aria-label="Catatan privasi"
        className="border-border bg-card flex items-start gap-3 rounded-2xl border p-4"
      >
        <ShieldAlert
          className="mt-0.5 size-5 text-amber-600"
          aria-hidden="true"
        />
        <div className="text-sm">
          <p className="font-medium">{de.privacyNoteHeading}</p>
          <p className="text-muted-foreground mt-1">
            {de.privacyNoteBody}
          </p>
        </div>
      </section>

      <section
        aria-label="Isi ekspor"
        className="border-border bg-card space-y-3 rounded-2xl border p-6"
      >
        <h2 className="font-heading text-lg">{de.includedHeading}</h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {de.includedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Unduh"
        className="border-border bg-card space-y-4 rounded-2xl border p-6"
      >
        <div>
          <h2 className="font-heading text-lg">{de.downloadHeading}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {de.downloadDescription}
          </p>
        </div>
        <TenantExportButton tenantSlug={tenant.slug} />
      </section>

      <section
        aria-label="Riwayat ekspor"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-3 text-lg">{de.historyHeading}</h2>
        {recentExports.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {de.emptyHistory}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentExports.map((entry) => {
              const meta = entry.metadata as
                | { size_bytes?: number; requested?: boolean }
                | null
              const sizeKb =
                meta && typeof meta.size_bytes === 'number'
                  ? Math.round(meta.size_bytes / 1024)
                  : null
              return (
                <li
                  key={entry.id}
                  className="border-border/60 flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground font-medium">
                      {dateFmt.format(entry.createdAt)}
                    </span>
                    {sizeKb !== null ? (
                      <span className="text-muted-foreground text-xs">
                        {de.sizeKbSuffix.replace('{n}', sizeKb.toLocaleString('id-ID'))}
                      </span>
                    ) : meta?.requested ? (
                      <span className="text-muted-foreground text-xs">
                        {de.requestedLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {entry.user?.name ?? entry.user?.email ?? '—'}
                    {entry.ip ? ` · ${entry.ip}` : ''}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
