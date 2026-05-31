import { GitBranch } from 'lucide-react'
import type { PipelineSummary } from '@/lib/scorecards/queries'

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

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Terjadwal',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak hadir',
}

const STATUS_TONE: Record<string, string> = {
  scheduled: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-slate-100 text-slate-800',
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  onsite: 'Onsite',
  phone: 'Telepon',
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

function statusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value
}

function statusTone(value: string): string {
  return STATUS_TONE[value] ?? 'bg-slate-100 text-slate-800'
}

function recommendationLabel(value: string): string {
  return RECOMMENDATION_LABELS[value] ?? value
}

function recommendationTone(value: string): string {
  return RECOMMENDATION_TONE[value] ?? 'bg-slate-100 text-slate-800'
}

/**
 * Server component rendering the multi-stage interview pipeline. Each stage
 * gets a column on desktop; on small screens we stack vertically. Empty
 * stages still render with their label + "Belum dijadwalkan" so recruiters
 * see the planned shape of the pipeline.
 */
export function InterviewPipelineView({
  pipeline,
}: {
  pipeline: PipelineSummary
}) {
  const { stages, overallRecommendation } = pipeline

  return (
    <section
      aria-label="Pipeline wawancara"
      className="border-border bg-card rounded-2xl border p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Pipeline wawancara</h2>
        </div>
        {overallRecommendation && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${recommendationTone(overallRecommendation)}`}
          >
            Rekomendasi keseluruhan: {recommendationLabel(overallRecommendation)}
          </span>
        )}
      </div>

      {stages.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Belum ada tahap wawancara dijadwalkan.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stages.map((stage) => {
            const stageLabel =
              stage.stageName ?? `Tahap ${stage.stageOrder}`
            const recommendationEntries = Object.entries(
              stage.recommendationTally,
            ).sort((a, b) => b[1] - a[1])
            return (
              <article
                key={stage.stageOrder}
                aria-label={`Tahap ${stage.stageOrder}: ${stageLabel}`}
                className="border-border bg-background flex flex-col gap-3 rounded-md border p-3"
              >
                <header className="space-y-1">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                    Tahap {stage.stageOrder}
                  </p>
                  <h3 className="text-sm font-semibold">{stageLabel}</h3>
                  <p className="text-muted-foreground text-xs">
                    {stage.interviews.length} wawancara ·{' '}
                    {stage.scorecardCount} scorecard
                    {stage.averageScore !== null && (
                      <>
                        {' '}· Skor {formatScore(stage.averageScore)} / 5
                      </>
                    )}
                  </p>
                </header>

                {stage.interviews.length === 0 ? (
                  <p className="text-muted-foreground text-xs italic">
                    Belum dijadwalkan
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {stage.interviews.map((iv) => (
                      <li
                        key={iv.id}
                        className="border-border bg-card space-y-1 rounded-md border p-2"
                      >
                        <p className="text-xs font-medium">
                          {dateFmt.format(iv.scheduledAt)}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-[10px]">
                            {TYPE_LABELS[iv.type] ?? iv.type}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${statusTone(iv.status)}`}
                          >
                            {statusLabel(iv.status)}
                          </span>
                          {iv.scorecard && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] ${recommendationTone(iv.scorecard.recommendation)}`}
                            >
                              {recommendationLabel(iv.scorecard.recommendation)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {recommendationEntries.length > 0 && (
                  <footer className="flex flex-wrap gap-1.5">
                    {recommendationEntries.map(([rec, count]) => (
                      <span
                        key={rec}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${recommendationTone(rec)}`}
                      >
                        <span>{recommendationLabel(rec)}</span>
                        <span className="font-mono">×{count}</span>
                      </span>
                    ))}
                  </footer>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
