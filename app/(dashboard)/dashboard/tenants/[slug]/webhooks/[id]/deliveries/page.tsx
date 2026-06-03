import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, History } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  getDeliveriesForWebhook,
  getDeliveryStats,
} from '@/lib/webhooks/delivery-queries'
import { WebhookDeliveryTable } from '@/components/organisms/webhook-delivery-table'
import { WebhookStatsCard } from '@/components/organisms/webhook-stats-card'
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from '@/lib/webhooks/events'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Riwayat pengiriman webhook — Dasbor' }

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default async function WebhookDeliveriesPage({
  params,
  searchParams,
}: {
  params: { slug: string; id: string }
  searchParams: {
    status?: string
    event?: string
    from?: string
    to?: string
    page?: string
  }
}) {
  const t = await getServerT()
  const wd = t.pagesTenant4.webhookDeliveries

  const STATUS_OPTIONS = [
    { value: '', label: wd.filterStatusAll },
    { value: 'success', label: wd.filterStatusSuccess },
    { value: 'pending', label: wd.filterStatusPending },
    { value: 'failed', label: wd.filterStatusFailed },
    { value: 'dead_letter', label: wd.filterStatusDeadLetter },
  ] as const

  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/webhooks/${params.id}/deliveries`,
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

  const webhook = await prisma.tenantWebhook
    .findFirst({
      where: { id: params.id, tenantId: tenant.id },
      select: { id: true, name: true, url: true, enabled: true, events: true },
    })
    .catch(() => null)
  if (!webhook) notFound()

  const status = searchParams.status
  const event = searchParams.event
  const from = parseDate(searchParams.from)
  const to = parseDate(searchParams.to)
  const pageNum = Math.max(1, Number(searchParams.page ?? '1') || 1)

  const [{ items, total, page, pageSize, totalPages }, stats] = await Promise.all([
    getDeliveriesForWebhook(webhook.id, {
      status: status && status !== '' ? status : undefined,
      event: event && event !== '' ? event : undefined,
      from,
      to,
      page: pageNum,
    }),
    getDeliveryStats(webhook.id),
  ])

  const baseQuery = new URLSearchParams()
  if (status) baseQuery.set('status', status)
  if (event) baseQuery.set('event', event)
  if (searchParams.from) baseQuery.set('from', searchParams.from)
  if (searchParams.to) baseQuery.set('to', searchParams.to)
  const prevHref =
    page > 1
      ? `?${(() => {
          const q = new URLSearchParams(baseQuery)
          q.set('page', String(page - 1))
          return q.toString()
        })()}`
      : null
  const nextHref =
    page < totalPages
      ? `?${(() => {
          const q = new URLSearchParams(baseQuery)
          q.set('page', String(page + 1))
          return q.toString()
        })()}`
      : null

  void pageSize

  return (
    <div className="max-w-6xl space-y-8 p-6">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/webhooks` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {wd.backToList}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            {wd.heading.replace('{name}', webhook.name)}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Tenant <span className="text-foreground font-medium">{tenant.name}</span>{' '}
          •{' '}
          <code className="bg-muted rounded px-1 text-xs">{webhook.url}</code>
          {!webhook.enabled && (
            <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
              {wd.statusInactive}
            </span>
          )}
        </p>
      </header>

      <WebhookStatsCard stats={stats} />

      <section
        aria-label="Filter & riwayat pengiriman"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <form
          method="get"
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground text-xs">{wd.labelStatus}</span>
            <select
              name="status"
              defaultValue={status ?? ''}
              className="border-input bg-background block w-full rounded-md border px-2 py-1.5 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground text-xs">{wd.labelEvent}</span>
            <select
              name="event"
              defaultValue={event ?? ''}
              className="border-input bg-background block w-full rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">{wd.filterEventAll}</option>
              {WEBHOOK_EVENTS.map((ev) => (
                <option key={ev} value={ev}>
                  {WEBHOOK_EVENT_LABELS[ev]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground text-xs">{wd.labelFrom}</span>
            <input
              type="date"
              name="from"
              defaultValue={searchParams.from ?? ''}
              className="border-input bg-background block w-full rounded-md border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground text-xs">{wd.labelTo}</span>
            <input
              type="date"
              name="to"
              defaultValue={searchParams.to ?? ''}
              className="border-input bg-background block w-full rounded-md border px-2 py-1.5 text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-1.5 text-sm font-medium text-white"
            >
              {wd.btnApply}
            </button>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/webhooks/${webhook.id}/deliveries` as any}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {wd.btnReset}
            </Link>
          </div>
        </form>

        <WebhookDeliveryTable webhookId={webhook.id} deliveries={items} />

        <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
          <span>
            {wd.pagination
              .replace('{page}', String(page))
              .replace('{totalPages}', String(totalPages))
              .replace('{total}', String(total))}
          </span>
          <div className="flex gap-3">
            {prevHref ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={prevHref as any}
                className="hover:text-foreground"
              >
                {wd.prevPage}
              </Link>
            ) : (
              <span className="opacity-50">{wd.prevPage}</span>
            )}
            {nextHref ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={nextHref as any}
                className="hover:text-foreground"
              >
                {wd.nextPage}
              </Link>
            ) : (
              <span className="opacity-50">{wd.nextPage}</span>
            )}
          </div>
        </div>
      </section>

      <p className="text-muted-foreground text-xs">
        {wd.footerNote}
      </p>
    </div>
  )
}
