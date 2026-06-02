import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, History, ExternalLink } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  AuditRetentionForm,
  DeleteRetentionPolicyButton,
  PreviewImpactButton,
} from '@/components/organisms/audit-retention-form'

export const metadata = { title: 'Retensi Audit Tenant — Dasbor' }

function retentionLabel(days: number): string {
  return days === 0 ? 'Selamanya' : `${days} hari`
}

export default async function TenantAuditRetentionPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/audit-retention`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true, ownerUserId: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  // OWNER-only (owner of this tenant) — plus global override (SUPERADMIN).
  const { globalRole, id: userId } = session.user
  const isOwner = tenant.ownerUserId === userId
  const isSuperAdmin = globalRole === 'SUPERADMIN'
  if (!isOwner && !isSuperAdmin) notFound()

  const [tenantPolicies, globalPolicies] = await Promise.all([
    prisma.auditRetentionPolicy.findMany({
      where: { scope: 'tenant', tenantId: tenant.id },
      orderBy: [{ resourceType: 'asc' }],
    }),
    prisma.auditRetentionPolicy.findMany({
      where: { scope: 'global' },
      orderBy: [{ resourceType: 'asc' }],
    }),
  ])

  const tenantResources = new Set(tenantPolicies.map((p) => p.resourceType))
  const overridingGlobals = globalPolicies.filter((g) =>
    tenantResources.has(g.resourceType) || g.resourceType === '*',
  )

  return (
    <div className="p-6 space-y-8 max-w-4xl">
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
          <History className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Retensi Audit</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Kebijakan retensi mengontrol berapa lama log audit disimpan.
        </p>
      </header>

      <div
        role="note"
        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
      >
        Pembersihan otomatis dijalankan setiap hari oleh sistem.
      </div>

      {overridingGlobals.length > 0 && (
        <div
          role="note"
          className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-900 dark:text-blue-200"
        >
          <p className="font-medium">Kebijakan global aktif</p>
          <p className="mt-1">
            Beberapa kebijakan global juga berlaku untuk tenant ini dan dapat
            menjadi prioritas saat kebijakan tenant tidak ada:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {overridingGlobals.map((g) => (
              <li key={g.id} className="font-mono text-xs">
                {g.resourceType} — {retentionLabel(g.retentionDays)}
                {g.archiveEnabled ? ' · arsip aktif' : ''}
              </li>
            ))}
          </ul>
          {isSuperAdmin && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/audit-retention' as any}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline"
            >
              Kelola kebijakan global
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      <section
        aria-label="Kebijakan tenant"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">
          Kebijakan tenant ({tenantPolicies.length})
        </h2>
        {tenantPolicies.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada kebijakan tenant. Tambahkan kebijakan baru di bawah.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Tipe sumber daya</th>
                  <th className="py-2 pr-3 font-medium">Lama simpan</th>
                  <th className="py-2 pr-3 font-medium">Arsipkan</th>
                  <th className="py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tenantPolicies.map((p) => (
                  <tr key={p.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs">{p.resourceType}</td>
                    <td className="py-2 pr-3 text-xs">{retentionLabel(p.retentionDays)}</td>
                    <td className="py-2 pr-3 text-xs">
                      {p.archiveEnabled ? 'Ya' : 'Tidak'}
                    </td>
                    <td className="py-2 text-right">
                      <DeleteRetentionPolicyButton id={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-label="Tambah kebijakan"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">Tambah kebijakan</h2>
        <AuditRetentionForm scope="tenant" tenantId={tenant.id} />
      </section>

      <section
        aria-label="Pratinjau dampak"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-2 text-lg">Pratinjau dampak</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Hitung berapa banyak entri yang akan dihapus atau diarsipkan jika
          pembersihan dijalankan sekarang. Tindakan ini tidak menghapus apa pun.
        </p>
        <PreviewImpactButton tenantId={tenant.id} />
      </section>
    </div>
  )
}
