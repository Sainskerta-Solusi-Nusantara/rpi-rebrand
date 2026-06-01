import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Archive, ShieldAlert } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { TenantExportButton } from '@/components/organisms/tenant-export-button'

export const metadata = { title: 'Ekspor data tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const INCLUDED = [
  'Profil tenant: id, slug, nama, plan, status, custom domain, tanggal',
  'Branding lengkap (warna, font, logo)',
  'Anggota tenant + email + peran (sensitif)',
  'Semua lowongan beserta detailnya',
  'Semua lamaran + email & nama kandidat + status & catatan',
  'Jadwal interview & scorecard',
  'Kursus, modul, dan pelajaran',
  'Pendaftaran kursus (enrollments) + email pengguna',
  'Konfigurasi webhook (TANPA nilai secret)',
  'API keys (TANPA token hash) — hanya nama, prefix, scope, tanggal',
  'Template email tenant',
  '5.000 entri audit log terbaru milik tenant',
  'Catatan moderasi yang terkait sumber daya tenant',
]

export default async function TenantDataExportPage({
  params,
}: {
  params: { slug: string }
}) {
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
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Archive className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            Ekspor data tenant
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Unduh seluruh data tenant{' '}
          <span className="text-foreground font-medium">{tenant.name}</span>{' '}
          dalam satu berkas JSON. Berguna untuk pemenuhan GDPR, audit
          internal, atau migrasi.
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
          <p className="font-medium">Catatan privasi</p>
          <p className="text-muted-foreground mt-1">
            Data ekspor berisi PII anggota & kandidat. Simpan dengan aman dan
            hapus jika tidak lagi diperlukan. Nilai webhook secret dan hash
            API key tidak disertakan.
          </p>
        </div>
      </section>

      <section
        aria-label="Isi ekspor"
        className="border-border bg-card space-y-3 rounded-2xl border p-6"
      >
        <h2 className="font-heading text-lg">Yang termasuk dalam ekspor</h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {INCLUDED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Unduh"
        className="border-border bg-card space-y-4 rounded-2xl border p-6"
      >
        <div>
          <h2 className="font-heading text-lg">Unduh berkas</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Proses pembuatan dapat memakan waktu beberapa saat untuk tenant
            besar. Hanya OWNER yang dapat melakukan tindakan ini.
          </p>
        </div>
        <TenantExportButton tenantSlug={tenant.slug} />
      </section>

      <section
        aria-label="Riwayat ekspor"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-3 text-lg">Riwayat ekspor terbaru</h2>
        {recentExports.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada ekspor tercatat.
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
                        · {sizeKb.toLocaleString('id-ID')} KB
                      </span>
                    ) : meta?.requested ? (
                      <span className="text-muted-foreground text-xs">
                        · permintaan
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
