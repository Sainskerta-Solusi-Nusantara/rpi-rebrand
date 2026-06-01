import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Skull } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { getDeadLetterQueue } from '@/lib/webhooks/delivery-queries'
import { WebhookDeliveryTable } from '@/components/organisms/webhook-delivery-table'
import { BulkRetryButton } from '@/components/organisms/webhook-dead-letter-actions'

export const metadata = { title: 'Surat mati webhook — Dasbor' }

export default async function DeadLetterInboxPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/webhooks/dead-letter`,
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

  const deliveries = await getDeadLetterQueue(tenant.id, { limit: 200 })

  return (
    <div className="max-w-6xl space-y-8 p-6">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/webhooks` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar webhook
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Skull className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">Kotak surat mati</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Pengiriman webhook untuk tenant{' '}
            <span className="text-foreground font-medium">{tenant.name}</span> yang
            tidak berhasil setelah 5 kali percobaan atau ditolak permanen oleh penerima
            (HTTP 400/401/403/404/410/422). Kirim ulang manual dari tabel di bawah,
            atau gunakan tombol bulk retry.
          </p>
        </div>
        <BulkRetryButton
          tenantSlug={tenant.slug}
          deliveryIds={deliveries.map((d) => d.id)}
        />
      </header>

      <section
        aria-label="Daftar surat mati"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg">
            {deliveries.length} pengiriman tertahan
          </h2>
          <span className="text-muted-foreground text-xs">
            Menampilkan hingga 200 terbaru
          </span>
        </div>

        <WebhookDeliveryTable webhookId="" deliveries={deliveries} />
      </section>
    </div>
  )
}
