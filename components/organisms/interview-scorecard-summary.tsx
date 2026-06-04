import Link from 'next/link'
import { ClipboardCheck, NotebookText } from 'lucide-react'
import { aggregateApplicationScorecards } from '@/lib/interviews/scorecard-queries'
import {
  RECOMMENDATION_LABELS,
  RECOMMENDATION_VALUES,
  type RecommendationValue,
} from '@/lib/interviews/scorecard-defaults'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server-dictionary'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const numberFmt = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Tailwind class tables — kept as literal strings so the JIT can extract
 * them. Maps each recommendation onto a chip + a stacked-bar segment color.
 */
const CHIP_CLASS: Record<RecommendationValue, string> = {
  strong_hire: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300',
  hire: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  no_hire: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300',
  strong_no_hire: 'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300',
}

const BAR_CLASS: Record<RecommendationValue, string> = {
  strong_hire: 'bg-green-500',
  hire: 'bg-emerald-500',
  no_hire: 'bg-red-500',
  strong_no_hire: 'bg-rose-500',
}

const CONSENSUS_LABEL_OVERRIDES: Record<string, string> = {
  split: 'Split',
}

const CONSENSUS_CHIP_CLASS: Record<string, string> = {
  split: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200',
}

function formatScore(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return numberFmt.format(value)
}

function recommendationLabel(value: string): string {
  if (value in CONSENSUS_LABEL_OVERRIDES) {
    return CONSENSUS_LABEL_OVERRIDES[value]!
  }
  if ((RECOMMENDATION_VALUES as readonly string[]).includes(value)) {
    return RECOMMENDATION_LABELS[value as RecommendationValue].label
  }
  return value
}

function recommendationChipClass(value: string): string {
  if (value in CONSENSUS_CHIP_CLASS) return CONSENSUS_CHIP_CLASS[value]!
  if ((RECOMMENDATION_VALUES as readonly string[]).includes(value)) {
    return CHIP_CLASS[value as RecommendationValue]
  }
  return 'bg-slate-100 text-slate-800'
}

/**
 * Aggregate summary card rendered on the application detail page.
 * Server-component — does its own data fetching via the cached query so it
 * can be dropped in anywhere without coordination with the parent.
 *
 * Empty-state friendly: when there are zero scorecards we still render a
 * small panel telling the recruiter to start adding them, so the section
 * doesn't silently disappear.
 */
export async function InterviewScorecardSummary({
  applicationId,
}: {
  applicationId: string
}) {
  const t = await getServerT()
  const s = t.formsMisc4.interviewScorecardSummary

  const aggregate = await aggregateApplicationScorecards(applicationId)

  // We need the tenant slug to build interview detail links.
  const tenantSlug = await prisma.application
    .findUnique({
      where: { id: applicationId },
      select: { tenant: { select: { slug: true } } },
    })
    .catch(() => null)
    .then((row) => row?.tenant.slug ?? null)

  const totalCount = aggregate.interviews.length

  if (totalCount === 0) {
    return (
      <section
        aria-label="Scorecard Wawancara"
        className="border-border bg-card rounded-2xl border p-6 space-y-2"
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{s.heading}</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          {s.emptyState}
        </p>
      </section>
    )
  }

  const overall = aggregate.overallAverage
  const counts = aggregate.recommendationCounts
  const consensus = aggregate.consensusRecommendation

  // Stacked bar — show every segment present in the tally, in the canonical
  // strong_hire → strong_no_hire order so it visually mirrors the form.
  const totalRecs = RECOMMENDATION_VALUES.reduce((acc, k) => acc + counts[k], 0)

  const criterionEntries = Object.entries(aggregate.averageByCriterion).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <section
      aria-label="Scorecard Wawancara"
      className="border-border bg-card rounded-2xl border p-6 space-y-6"
    >
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
        <h2 className="font-heading text-lg">{s.heading}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-border bg-background rounded-md border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            {s.statAvgScore}
          </p>
          <p className="font-heading mt-1 text-2xl">
            {formatScore(overall)}
            <span className="text-muted-foreground ml-1 text-sm">/ 5</span>
          </p>
        </div>
        <div className="border-border bg-background rounded-md border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            {s.statTotal}
          </p>
          <p className="font-heading mt-1 text-2xl">{totalCount}</p>
        </div>
        <div className="border-border bg-background rounded-md border p-4">
          <p className="text-muted-foreground text-xs uppercase">{s.statConsensus}</p>
          {consensus ? (
            <p className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${recommendationChipClass(consensus)}`}
              >
                {recommendationLabel(consensus)}
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">{s.noData}</p>
          )}
        </div>
      </div>

      <section aria-label="Distribusi rekomendasi" className="space-y-2">
        <h3 className="text-sm font-semibold">{s.sectionDist}</h3>
        {totalRecs === 0 ? (
          <p className="text-muted-foreground text-xs">{s.emptyDist}</p>
        ) : (
          <>
            <div
              className="bg-muted flex h-3 w-full overflow-hidden rounded-full"
              role="img"
              aria-label="Distribusi rekomendasi sebagai bar bertumpuk"
            >
              {RECOMMENDATION_VALUES.map((value) => {
                const count = counts[value]
                if (count === 0) return null
                const pct = (count / totalRecs) * 100
                return (
                  <div
                    key={value}
                    className={`${BAR_CLASS[value]} h-full`}
                    style={{ width: `${pct}%` }}
                    title={`${RECOMMENDATION_LABELS[value].label}: ${count}`}
                  />
                )
              })}
            </div>
            <ul className="flex flex-wrap gap-2 text-xs">
              {RECOMMENDATION_VALUES.map((value) => {
                const count = counts[value]
                if (count === 0) return null
                return (
                  <li
                    key={value}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${CHIP_CLASS[value]}`}
                  >
                    <span>{RECOMMENDATION_LABELS[value].label}</span>
                    <span className="font-mono">×{count}</span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {criterionEntries.length > 0 && (
        <section aria-label="Rata-rata per kriteria" className="space-y-2">
          <h3 className="text-sm font-semibold">{s.sectionCriteria}</h3>
          <ul className="space-y-2">
            {criterionEntries.map(([criterion, score]) => {
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

      <section aria-label="Scorecard per wawancara" className="space-y-2">
        <h3 className="text-sm font-semibold">{s.sectionDetail}</h3>
        <ul className="divide-border divide-y text-sm">
          {aggregate.interviews.map((row) => {
            const authorName = row.author.name ?? row.author.email
            const stageLabel = row.interview.stageName
              ? `Stage ${row.interview.stageOrder} · ${row.interview.stageName}`
              : `Stage ${row.interview.stageOrder}`
            const notesPreview =
              row.notes && row.notes.length > 0
                ? row.notes.length > 140
                  ? `${row.notes.slice(0, 140)}…`
                  : row.notes
                : null
            const interviewHref = tenantSlug
              ? (`/dashboard/tenants/${tenantSlug}/lamaran/${applicationId}/wawancara/${row.interviewId}/scorecard` as const)
              : null
            return (
              <li key={row.interviewId} className="space-y-1 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{stageLabel}</span>
                  <span className="text-muted-foreground text-xs">
                    {dateFmt.format(row.interview.scheduledAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${recommendationChipClass(row.recommendation)}`}
                  >
                    {recommendationLabel(row.recommendation)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {s.rowScore.replace('{score}', formatScore(row.averageScore))}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {s.rowBy
                    .replace('{author}', String(authorName))
                    .replace('{count}', String(row.ratings.length))}
                </p>
                {notesPreview && (
                  <p className="text-foreground mt-1 inline-flex items-start gap-1.5 text-xs">
                    <NotebookText
                      className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="whitespace-pre-line">{notesPreview}</span>
                  </p>
                )}
                {interviewHref && (
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={interviewHref as any}
                    className="text-primary mt-1 inline-flex text-xs hover:underline"
                  >
                    {s.rowOpenDetail}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </section>
  )
}
