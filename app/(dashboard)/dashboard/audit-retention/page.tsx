import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, History } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  AuditRetentionForm,
  DeleteRetentionPolicyButton,
  RETENTION_DAY_OPTIONS,
} from '@/components/organisms/audit-retention-form'

export const metadata = { title: 'Retensi Audit Global — Dasbor' }

function retentionLabel(days: number): string {
  const match = RETENTION_DAY_OPTIONS.find((o) => o.value === days)
  if (match) return match.label
  return days === 0 ? 'Selamanya' : `${days} hari`
}

export default async function GlobalAuditRetentionPage() {
  const session = await requireAuth('/dashboard/audit-retention')

  if (session.user.globalRole !== 'SUPERADMIN') {
    notFound()
  }

  const policies = await prisma.auditRetentionPolicy
    .findMany({
      where: { scope: 'global' },
      orderBy: [{ resourceType: 'asc' }],
    })
    .catch(() => [])

  return (
    <div className="p-6 space-y-8 max-w-4xl">
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
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Retensi Audit Global</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Kebijakan retensi mengontrol berapa lama log audit disimpan. Kebijakan
          global berlaku untuk semua tenant kecuali dioverride oleh kebijakan
          tenant.
        </p>
      </header>

      <div
        role="note"
        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
      >
        Pembersihan otomatis dijalankan setiap hari oleh sistem.
      </div>

      <section
        aria-label="Kebijakan global"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">
          Kebijakan global ({policies.length})
        </h2>
        {policies.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada kebijakan global.
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
                {policies.map((p) => (
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
        aria-label="Tambah kebijakan global"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">Tambah kebijakan global</h2>
        <AuditRetentionForm scope="global" />
      </section>
    </div>
  )
}
