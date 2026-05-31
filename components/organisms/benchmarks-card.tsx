import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import type { BenchmarkMetric } from '@/lib/benchmarks/queries'

const numberFmt = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
})

const intFmt = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
})

function formatValue(value: number | null, unit: BenchmarkMetric['unit']): string {
  if (value == null) return '—'
  switch (unit) {
    case 'days':
      return `${numberFmt.format(value)} hari`
    case 'percent':
      return `${numberFmt.format(value)}%`
    case 'count':
      return numberFmt.format(value)
    case 'idr_diff': {
      const sign = value > 0 ? '+' : ''
      return `${sign}${numberFmt.format(value)}%`
    }
  }
}

function formatPlatform(value: number | null, unit: BenchmarkMetric['unit']): string {
  if (value == null) return '—'
  if (unit === 'idr_diff') return 'pasar'
  return formatValue(value, unit)
}

const STATUS_TONE: Record<BenchmarkMetric['status'], string> = {
  above: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  at: 'bg-muted text-muted-foreground border-border',
  below: 'bg-rose-100 text-rose-800 border-rose-200',
  unknown: 'bg-muted text-muted-foreground border-border',
}

const STATUS_LABEL: Record<BenchmarkMetric['status'], string> = {
  above: 'Di atas median',
  at: 'Sebanding',
  below: 'Di bawah median',
  unknown: 'Belum cukup data',
}

const STATUS_BAR: Record<BenchmarkMetric['status'], string> = {
  above: 'bg-emerald-500',
  at: 'bg-slate-400',
  below: 'bg-rose-500',
  unknown: 'bg-slate-300',
}

function StatusIcon({ status }: { status: BenchmarkMetric['status'] }) {
  if (status === 'above')
    return <TrendingUp className="h-3 w-3" aria-hidden="true" />
  if (status === 'below')
    return <TrendingDown className="h-3 w-3" aria-hidden="true" />
  if (status === 'at')
    return <Minus className="h-3 w-3" aria-hidden="true" />
  return <HelpCircle className="h-3 w-3" aria-hidden="true" />
}

export function BenchmarksCard({ metric }: { metric: BenchmarkMetric }) {
  const tone = STATUS_TONE[metric.status]
  const label = STATUS_LABEL[metric.status]
  const isUnknown = metric.status === 'unknown' || metric.tenantValue == null

  // Sparkline bars: scale tenant vs platform.
  const tenantBarPct = (() => {
    if (isUnknown) return 0
    if (metric.unit === 'idr_diff') {
      // Show absolute diff up to 100% of bar
      const v = Math.abs(metric.tenantValue ?? 0)
      return Math.min(100, v)
    }
    const max = Math.max(
      metric.tenantValue ?? 0,
      metric.platformMedian ?? 0,
    )
    if (max <= 0) return 0
    return Math.max(2, ((metric.tenantValue ?? 0) / max) * 100)
  })()

  const platformBarPct = (() => {
    if (metric.unit === 'idr_diff') return 50 // baseline at center
    const max = Math.max(
      metric.tenantValue ?? 0,
      metric.platformMedian ?? 0,
    )
    if (max <= 0 || metric.platformMedian == null) return 0
    return Math.max(2, (metric.platformMedian / max) * 100)
  })()

  return (
    <article
      className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5"
      aria-label={metric.label}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-sm font-medium">{metric.label}</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {metric.direction === 'higher_better'
              ? 'Lebih tinggi = lebih baik'
              : 'Lebih rendah = lebih baik'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}
        >
          <StatusIcon status={metric.status} />
          {label}
        </span>
      </header>

      {isUnknown ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <p className="text-muted-foreground text-sm">Data tidak cukup</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl tabular-nums">
              {formatValue(metric.tenantValue, metric.unit)}
            </span>
            <span className="text-muted-foreground text-xs">
              vs {formatPlatform(metric.platformMedian, metric.unit)}
            </span>
          </div>

          {/* Comparison bars */}
          <div className="space-y-1.5" aria-hidden="true">
            <div>
              <div className="text-muted-foreground mb-0.5 flex justify-between text-[10px]">
                <span>Tenant</span>
                <span className="tabular-nums">
                  {formatValue(metric.tenantValue, metric.unit)}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`${STATUS_BAR[metric.status]} h-full rounded-full transition-all`}
                  style={{ width: `${tenantBarPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5 flex justify-between text-[10px]">
                <span>Median platform</span>
                <span className="tabular-nums">
                  {formatPlatform(metric.platformMedian, metric.unit)}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-slate-500 h-full rounded-full transition-all"
                  style={{ width: `${platformBarPct}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <footer className="text-muted-foreground border-border/60 mt-auto border-t pt-2 text-[10px]">
        Sampel: {intFmt.format(metric.sampleSize)} entri
        {metric.sampleSize < 5 ? ' · minimum 5 untuk pembandingan' : ''}
      </footer>
    </article>
  )
}

export default BenchmarksCard
