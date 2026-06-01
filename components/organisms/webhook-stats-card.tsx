import { Activity, CheckCircle2, Clock, Skull, XCircle } from 'lucide-react'
import type { DeliveryStats } from '@/lib/webhooks/delivery-queries'

const numberFmt = new Intl.NumberFormat('id-ID')

function statusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
    case 'pending':
      return 'bg-amber-500'
    case 'dead_letter':
      return 'bg-zinc-500'
    default:
      return 'bg-muted'
  }
}

/**
 * Sparkline of the last N delivery statuses. Each bar is colored by status
 * so an operator can spot streaks of failure / dead-letter at a glance.
 * `recent` is expected newest-first; we reverse for left-to-right time.
 */
function Sparkline({
  recent,
}: {
  recent: { status: string; createdAt: Date }[]
}) {
  if (recent.length === 0) {
    return (
      <div className="text-muted-foreground text-[10px]">
        Belum ada pengiriman.
      </div>
    )
  }
  const ordered = [...recent].reverse()
  return (
    <div className="flex h-6 items-end gap-[1px]" aria-hidden="true">
      {ordered.map((r, i) => (
        <span
          key={`${i}-${r.createdAt.getTime()}`}
          title={`${r.status} • ${r.createdAt.toISOString()}`}
          className={`inline-block w-1 rounded-sm ${statusColor(r.status)}`}
          style={{ height: '100%' }}
        />
      ))}
    </div>
  )
}

/**
 * Server component summarising delivery health for one webhook:
 * total / success / failed / dead-letter counts, success rate %, mean
 * attempt count, and a sparkline of the last 50 attempts.
 */
export function WebhookStatsCard({
  stats,
  compact = false,
}: {
  stats: DeliveryStats
  compact?: boolean
}) {
  const rate = stats.successRate.toFixed(1)
  const mean = stats.meanAttempts.toFixed(2)

  if (compact) {
    return (
      <div className="border-border bg-card rounded-md border p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-muted-foreground text-[10px] uppercase">
              Tingkat keberhasilan
            </div>
            <div className="font-heading text-lg">{rate}%</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-[10px]">
              Total {numberFmt.format(stats.total)}
            </div>
            <div className="text-muted-foreground text-[10px]">
              Mati {numberFmt.format(stats.deadLetter)}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <Sparkline recent={stats.recent} />
        </div>
      </div>
    )
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" aria-hidden="true" />
        <h2 className="font-heading text-lg">Ringkasan pengiriman</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Berhasil"
          value={numberFmt.format(stats.success)}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
        <Stat
          label="Tertunda"
          value={numberFmt.format(stats.pending)}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
        />
        <Stat
          label="Gagal"
          value={numberFmt.format(stats.failed)}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <Stat
          label="Surat mati"
          value={numberFmt.format(stats.deadLetter)}
          icon={<Skull className="h-4 w-4 text-zinc-600" />}
        />
      </div>

      <div className="border-border mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
        <div>
          <div className="text-muted-foreground text-xs">
            Tingkat keberhasilan
          </div>
          <div className="font-heading text-2xl">{rate}%</div>
          <div className="text-muted-foreground text-[11px]">
            dari {numberFmt.format(stats.success + stats.failed + stats.deadLetter)}{' '}
            pengiriman selesai
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Rata-rata percobaan</div>
          <div className="font-heading text-2xl">{mean}</div>
          <div className="text-muted-foreground text-[11px]">
            per pengiriman tercatat
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">
            50 pengiriman terakhir
          </div>
          <div className="mt-1">
            <Sparkline recent={stats.recent} />
          </div>
          <div className="text-muted-foreground mt-1 text-[10px]">
            Hijau = berhasil • Kuning = tertunda • Merah = gagal • Abu-abu = surat mati
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="border-border bg-background rounded-md border p-3">
      <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
        {icon}
        {label}
      </div>
      <div className="font-heading text-lg">{value}</div>
    </div>
  )
}
