import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Webhook, History, Info, Skull } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  CreateWebhookForm,
  WebhookRowActions,
} from '@/components/organisms/tenant-webhook-forms'
import { WebhookStatsCard } from '@/components/organisms/webhook-stats-card'
import { getDeliveryStats } from '@/lib/webhooks/delivery-queries'
import { WEBHOOK_EVENT_LABELS, type WebhookEvent } from '@/lib/webhooks/events'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Webhook Tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

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
  const t = await getServerT()
  const w_ = t.pagesTenant4.webhooks

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

  const [webhooks, deliveries, deadLetterCount] = await Promise.all([
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
    prisma.webhookDelivery
      .count({
        where: { status: 'dead_letter', webhook: { tenantId: tenant.id } },
      })
      .catch(() => 0),
  ])

  // Load per-webhook stats in parallel for the inline summary card.
  const statsByWebhook = await Promise.all(
    webhooks.map((w) =>
      getDeliveryStats(w.id).catch(() => null),
    ),
  )

  function statusBadge(status: string): { label: string; tone: string } {
    switch (status) {
      case 'success':
        return { label: w_.statusSuccess, tone: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' }
      case 'failed':
        return { label: w_.statusFailed, tone: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' }
      case 'pending':
        return { label: w_.statusPending, tone: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200' }
      case 'dead_letter':
        return { label: w_.statusDeadLetter, tone: 'bg-zinc-200 dark:bg-zinc-500/20 text-zinc-800 dark:text-zinc-300' }
      default:
        return { label: status, tone: 'bg-muted text-muted-foreground' }
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {w_.backTo.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">{w_.heading}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {w_.description.replace('{name}', tenant.name)}
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/webhooks/dead-letter` as any}
          className="border-border bg-card hover:bg-muted/40 inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
        >
          <Skull className="h-4 w-4" aria-hidden="true" />
          {w_.deadLetterBtn.replace('{count}', String(deadLetterCount))}
        </Link>
      </header>

      <section
        aria-label={w_.sectionEndpoints}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Webhook className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            {w_.sectionEndpointsHeading.replace('{count}', String(webhooks.length))}
          </h2>
        </div>

        <CreateWebhookForm tenantSlug={tenant.slug} />

        {webhooks.length > 0 && (
          <ul className="mt-6 space-y-3">
            {webhooks.map((wh, idx) => {
              const last = wh.deliveries[0]
              const stats = statsByWebhook[idx]
              return (
                <li
                  key={wh.id}
                  className="border-border bg-background space-y-3 rounded-md border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{wh.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            wh.enabled
                              ? 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {wh.enabled ? w_.statusActive : w_.statusInactive}
                        </span>
                      </div>
                      <div className="text-muted-foreground break-all font-mono text-xs">
                        {wh.url}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map((ev) => (
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
                            {w_.lastDelivery}{' '}
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
                          <>{w_.noDelivery}</>
                        )}
                      </div>
                      <div>
                        <Link
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          href={`/dashboard/tenants/${tenant.slug}/webhooks/${wh.id}/deliveries` as any}
                          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                        >
                          <History className="h-3 w-3" aria-hidden="true" />
                          {w_.viewHistory}
                        </Link>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <WebhookRowActions
                        webhook={{ id: wh.id, name: wh.name, enabled: wh.enabled }}
                      />
                    </div>
                  </div>
                  {stats && stats.total > 0 && (
                    <div className="border-border/60 border-t pt-3">
                      <WebhookStatsCard stats={stats} compact />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section
        aria-label={w_.sectionHistory}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">
            {w_.sectionHistoryHeading.replace('{count}', String(deliveries.length))}
          </h2>
        </div>
        {deliveries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {w_.emptyHistory}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{w_.thTime}</th>
                  <th className="py-2 pr-3 font-medium">{w_.thWebhook}</th>
                  <th className="py-2 pr-3 font-medium">{w_.thEvent}</th>
                  <th className="py-2 pr-3 font-medium">{w_.thStatus}</th>
                  <th className="py-2 font-medium">{w_.thHttp}</th>
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
          <h2 className="font-heading text-lg">{w_.sectionVerify}</h2>
        </div>
        <p className="text-muted-foreground mb-3 text-sm">
          {w_.verifyDescription}
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
