import { ClipboardCheck } from 'lucide-react'
import type { ApplicationScorecardSummary } from '@/lib/scorecards/queries'

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_hire: 'Sangat direkomendasikan',
  hire: 'Direkomendasikan',
  no_hire: 'Tidak direkomendasikan',
  strong_no_hire: 'Sangat tidak direkomendasikan',
}

const RECOMMENDATION_TONE: Record<string, string> = {
  strong_hire: 'bg-green-100 text-green-800',
  hire: 'bg-emerald-100 text-emerald-800',
  no_hire: 'bg-amber-100 text-amber-800',
  strong_no_hire: 'bg-red-100 text-red-800',
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const numberFmt = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

function formatScore(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return numberFmt.format(value)
}

function recommendationLabel(value: string): string {
  return RECOMMENDATION_LABELS[value] ?? value
}

function recommendationTone(value: string): string {
  return RECOMMENDATION_TONE[value] ?? 'bg-slate-100 text-slate-800'
}

/**
 * Renders the aggregate scorecard summary for an application. Empty-state
 * driven; pass the output of `summarizeApplicationScorecards`.
 */
export function ScorecardSummary({
  summary,
}: {
  summary: ApplicationScorecardSummary
}) {
  if (summary.count === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Ringkasan scorecard</h2>
        </div>
        <p className="text-muted-foreground text-sm">Belum ada scorecard.</p>
      </div>
    )
  }

  const breakdownEntries = Object.entries(summary.breakdownByCriterion)
  const recommendationEntries = Object.entries(summary.recommendations).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <div className="border-border bg-card rounded-2xl border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
        <h2 className="font-heading text-lg">Ringkasan scorecard</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-border bg-background rounded-md border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            Total scorecard
          </p>
          <p className="font-heading mt-1 text-2xl">{summary.count}</p>
        </div>
        <div className="border-border bg-background rounded-md border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            Skor rata-rata
          </p>
          <p className="font-heading mt-1 text-2xl">
            {formatScore(summary.averageScore)}
            <span className="text-muted-foreground ml-1 text-sm">/ 5</span>
          </p>
        </div>
        <div className="border-border bg-background rounded-md border p-4">
          <p className="text-muted-foreground text-xs uppercase">Kriteria</p>
          <p className="font-heading mt-1 text-2xl">
            {breakdownEntries.length}
          </p>
        </div>
      </div>

      {breakdownEntries.length > 0 && (
        <section aria-label="Breakdown per kriteria" className="space-y-2">
          <h3 className="text-sm font-semibold">Skor per kriteria</h3>
          <ul className="space-y-2">
            {breakdownEntries.map(([criterion, score]) => {
              const pct = Math.max(0, Math.min(100, (score / 5) * 100))
              return (
                <li key={criterion} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground">{criterion}</span>
                    <span className="text-muted-foreground font-mono">
                      {formatScore(score)} / 5
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={Number(score.toFixed(2))}
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-label={`${criterion}: ${formatScore(score)} dari 5`}
                    className="bg-muted h-2 w-full overflow-hidden rounded-full"
                  >
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {recommendationEntries.length > 0 && (
        <section aria-label="Sebaran rekomendasi" className="space-y-2">
          <h3 className="text-sm font-semibold">Sebaran rekomendasi</h3>
          <ul className="flex flex-wrap gap-2 text-xs">
            {recommendationEntries.map(([rec, count]) => (
              <li
                key={rec}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${recommendationTone(rec)}`}
              >
                <span>{recommendationLabel(rec)}</span>
                <span className="font-mono">×{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Daftar scorecard" className="space-y-2">
        <h3 className="text-sm font-semibold">Scorecard individu</h3>
        <ul className="divide-border divide-y text-sm">
          {summary.individualScorecards.map((item) => {
            const authorName = item.author.name ?? item.author.email
            return (
              <li key={item.interviewId} className="space-y-1 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {dateFmt.format(item.scheduledAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${recommendationTone(item.recommendation)}`}
                  >
                    {recommendationLabel(item.recommendation)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Skor: {formatScore(item.averageScore)} / 5
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Oleh {authorName} · {item.ratingsCount} kriteria
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
