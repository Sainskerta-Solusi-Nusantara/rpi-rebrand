import { History } from 'lucide-react'
import { DeliveryRowActions } from '@/components/organisms/webhook-delivery-row-actions'
import { WEBHOOK_EVENT_LABELS, type WebhookEvent } from '@/lib/webhooks/events'
import type { DeliveryListItem } from '@/lib/webhooks/delivery-queries'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function statusBadge(status: string): { label: string; tone: string } {
  switch (status) {
    case 'success':
      return { label: 'Berhasil', tone: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' }
    case 'failed':
      return { label: 'Gagal', tone: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' }
    case 'pending':
      return { label: 'Tertunda', tone: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200' }
    case 'dead_letter':
      return { label: 'Surat mati', tone: 'bg-zinc-200 dark:bg-zinc-500/20 text-zinc-800 dark:text-zinc-300' }
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

function truncatePreview(value: string | null, max = 120): string {
  if (!value) return ''
  return value.length <= max ? value : `${value.slice(0, max)}…`
}

function formatNullableDate(value: Date | null): string {
  if (!value) return '—'
  return dateFmt.format(value)
}

/**
 * Server component: tabular history of webhook deliveries with per-row admin
 * controls. The "Retry now" + "Mark dead" buttons live in a client island
 * (`DeliveryRowActions`) so the rest of the table can stream from the server.
 */
export function WebhookDeliveryTable({
  deliveries,
  showRetryActions = true,
}: {
  webhookId: string
  deliveries: DeliveryListItem[]
  showRetryActions?: boolean
}) {
  if (deliveries.length === 0) {
    return (
      <div className="border-border bg-muted/20 text-muted-foreground rounded-md border p-6 text-center text-sm">
        <History className="mx-auto mb-2 h-5 w-5 opacity-60" aria-hidden="true" />
        Belum ada pengiriman tercatat.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
            <th className="py-2 pr-3 font-medium">Event</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Percobaan</th>
            <th className="py-2 pr-3 font-medium">HTTP</th>
            <th className="py-2 pr-3 font-medium">Galat / Berikutnya</th>
            <th className="py-2 pr-3 font-medium">Waktu</th>
            {showRetryActions && (
              <th className="py-2 font-medium">Tindakan</th>
            )}
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => {
            const s = statusBadge(d.status)
            const nextLabel =
              d.status === 'pending' && d.nextRetryAt
                ? `Berikutnya: ${dateFmt.format(d.nextRetryAt)}`
                : null
            const timeLabel = d.deliveredAt
              ? `Terkirim ${dateFmt.format(d.deliveredAt)}`
              : `Dibuat ${dateFmt.format(d.createdAt)}`
            return (
              <tr
                key={d.id}
                className="border-border/60 align-top border-b last:border-b-0"
              >
                <td className="py-3 pr-3">
                  <div className="font-medium text-foreground">
                    {eventLabel(d.event)}
                  </div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {d.event}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}
                  >
                    {s.label}
                  </span>
                </td>
                <td className="py-3 pr-3 font-mono text-xs">{d.attempt}</td>
                <td className="py-3 pr-3 font-mono text-xs">
                  {d.statusCode ?? '—'}
                </td>
                <td className="py-3 pr-3 text-xs">
                  {d.error ? (
                    <span
                      className="text-destructive break-words"
                      title={d.error}
                    >
                      {truncatePreview(d.error)}
                    </span>
                  ) : nextLabel ? (
                    <span className="text-muted-foreground">{nextLabel}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-xs">
                  <div>{timeLabel}</div>
                  {nextLabel && d.error && (
                    <div className="text-muted-foreground mt-1">{nextLabel}</div>
                  )}
                  <details className="text-muted-foreground mt-2">
                    <summary className="cursor-pointer hover:text-foreground">
                      Lihat payload &amp; respons
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="mb-0.5 font-medium">Payload</div>
                        <pre className="bg-background border-border max-h-48 overflow-auto rounded border p-2 text-[10px] leading-snug">
                          {JSON.stringify(d.payload, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-0.5 font-medium">Respons</div>
                        <pre className="bg-background border-border max-h-48 overflow-auto rounded border p-2 text-[10px] leading-snug">
                          {d.responseBody ?? '(kosong)'}
                        </pre>
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        Dibuat: {formatNullableDate(d.createdAt)} • Terkirim:{' '}
                        {formatNullableDate(d.deliveredAt)}
                      </div>
                    </div>
                  </details>
                </td>
                {showRetryActions && (
                  <td className="py-3">
                    <DeliveryRowActions
                      deliveryId={d.id}
                      status={d.status}
                    />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
