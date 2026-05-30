import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Webhook, History, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  CreateWebhookForm,
  WebhookRowActions,
} from '@/components/organisms/tenant-webhook-forms'
import { WEBHOOK_EVENT_LABELS, type WebhookEvent } from '@/lib/webhooks/events'

export const metadata = { title: 'Webhook Tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function statusBadge(status: string): { label: string; tone: string } {
  switch (status) {
    case 'success':
      return { label: 'Sukses', tone: 'bg-green-100 text-green-800' }
    case 'failed':
      return { label: 'Gagal', tone: 'bg-red-100 text-red-800' }
    case 'pending':
      return { label: 'Pending', tone: 'bg-amber-100 text-amber-800' }
    default:
      return { label: status, tone: 'bg-muted text-muted-foreground' }
  }
}

function eventLabel(ev: string): string {
  if (ev in WEBHOOK_EVENT_LABELS) {
    return WEBHOOK_EVENT_LABELS[ev as WebhookEvent]
  }
  return ev
}

export default async function TenantWebhooksPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/webhooks`)

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

  const [webhooks, deliveries] = await Promise.all([
    prisma.tenantWebhook
      .findMany({
        where: { tenantId: tenant.id },
        orderBy: [{ enabled: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          enabled: true,
          createdAt: true,
          deliveries: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
              statusCode: true,
              createdAt: true,
            },
          },
        },
      })
      .catch(() => []),
    prisma.webhookDelivery
      .findMany({
        where: { webhook: { tenantId: tenant.id } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          event: true,
          status: true,
          statusCode: true,
          createdAt: true,
          webhook: { select: { id: true, name: true } },
        },
      })
      .catch(() => []),
  ])

  return (
    <div className="p-6 space-y-8 max-w-5xl">
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
          <Webhook className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Webhook</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Kirim notifikasi otomatis ke sistem eksternal saat event terjadi di tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
          Setiap permintaan ditandatangani HMAC-SHA256 melalui header{' '}
          <code className="bg-muted rounded px-1 text-xs">X-RPI-Signature</code>.
        </p>
      </header>

      <section
        aria-label="Daftar webhook"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Webhook className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            Endpoint terdaftar ({webhooks.length})
          </h2>
        </div>

        <CreateWebhookForm tenantSlug={tenant.slug} />

        {webhooks.length > 0 && (
          <ul className="mt-6 space-y-3">
            {webhooks.map((w) => {
              const last = w.deliveries[0]
              return (
                <li
                  key={w.id}
                  className="border-border bg-background flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{w.name}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          w.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {w.enabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="text-muted-foreground break-all font-mono text-xs">
                      {w.url}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {w.events.map((ev) => (
                        <span
                          key={ev}
                          title={ev}
                          className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        >
                          {eventLabel(ev)}
                        </span>
                      ))}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {last ? (
                        <>
                          Pengiriman terakhir:{' '}
                          <span className="text-foreground">
                            {dateFmt.format(last.createdAt)}
                          </span>
                          {' • '}
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-medium ${
                              statusBadge(last.status).tone
                            }`}
                          >
                            {statusBadge(last.status).label}
                          </span>
                          {last.statusCode != null && (
                            <span className="ml-1 font-mono">HTTP {last.statusCode}</span>
                          )}
                        </>
                      ) : (
                        <>Belum ada pengiriman.</>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <WebhookRowActions
                      webhook={{ id: w.id, name: w.name, enabled: w.enabled }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section
        aria-label="Riwayat pengiriman"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            Riwayat pengiriman terbaru ({deliveries.length})
          </h2>
        </div>
        {deliveries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada pengiriman tercatat untuk tenant ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Webhook</th>
                  <th className="py-2 pr-3 font-medium">Event</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">HTTP</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => {
                  const s = statusBadge(d.status)
                  return (
                    <tr key={d.id} className="border-border/60 border-b last:border-b-0">
                      <td className="py-2 pr-3 text-xs">{dateFmt.format(d.createdAt)}</td>
                      <td className="py-2 pr-3 text-xs">{d.webhook.name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{d.event}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-xs">
                        {d.statusCode ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-border bg-muted/40 rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Cara verifikasi tanda tangan</h2>
        </div>
        <p className="text-muted-foreground mb-3 text-sm">
          Tiap permintaan memuat header{' '}
          <code className="bg-background rounded px-1">X-RPI-Signature: sha256=&lt;hex&gt;</code>
          . Hitung HMAC-SHA256 dari raw body memakai signing secret, lalu bandingkan
          dengan nilai header (constant-time compare). Tolak permintaan yang tidak cocok.
        </p>
        <pre className="bg-background border-border overflow-x-auto rounded-md border p-3 text-xs"><code>{`// Node.js
import { createHmac, timingSafeEqual } from 'node:crypto'

function verify(rawBody: string, header: string, secret: string) {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const got = header.replace(/^sha256=/, '')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(got, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}`}</code></pre>
      </section>
    </div>
  )
}
