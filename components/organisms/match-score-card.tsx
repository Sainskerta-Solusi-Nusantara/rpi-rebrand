/**
 * MatchScoreCard — full breakdown view for an Application's match score.
 *
 * Server component. Renders 6 horizontal progress bars (one per dimension),
 * matched / missed keyword chips, a tags strip, and a "Skor ulang" action
 * (client-only sub-component).
 */

import { Sparkles } from 'lucide-react'
import {
  MATCH_DIMENSION_LABELS,
  MATCH_TAG_LABELS,
  type MatchBreakdown,
} from '@/lib/match/match-scorer'
import { MatchRescoreButton } from './match-rescore-button'

type Props = {
  applicationId: string
  score?: number | null
  breakdown?: MatchBreakdown | null
  tags?: string[]
  notes?: string[]
  scoredAt?: Date | null
  canManage: boolean
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function tagTone(tag: string): string {
  if (tag === 'strong_match')
    return 'bg-green-50 text-green-700 border-green-200'
  if (tag === 'partial_match')
    return 'bg-amber-50 text-amber-700 border-amber-200'
  if (tag === 'weak_match')
    return 'bg-orange-50 text-orange-700 border-orange-200'
  if (tag === 'low_match' || tag === 'skills_gap')
    return 'bg-red-50 text-red-700 border-red-200'
  if (tag === 'location_remote_ok')
    return 'bg-sky-50 text-sky-700 border-sky-200'
  if (tag === 'overqualified' || tag === 'junior_for_role')
    return 'bg-violet-50 text-violet-700 border-violet-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

function dimDetail(
  key: keyof MatchBreakdown,
  breakdown: MatchBreakdown,
): string | null {
  switch (key) {
    case 'locationFit':
      return breakdown.locationFit.note || null
    case 'experienceFit':
      return breakdown.experienceFit.note || null
    case 'employmentFit':
      return breakdown.employmentFit.note || null
    case 'educationFit':
      return breakdown.educationFit.note || null
    default:
      return null
  }
}

export function MatchScoreCard({
  applicationId,
  score,
  breakdown,
  tags = [],
  notes = [],
  scoredAt,
  canManage,
}: Props) {
  const hasScore = typeof score === 'number' && breakdown !== null && breakdown !== undefined
  const keys: Array<keyof MatchBreakdown> = [
    'keywordOverlap',
    'skillsCoverage',
    'locationFit',
    'experienceFit',
    'employmentFit',
    'educationFit',
  ]

  return (
    <section
      aria-label="Skor kecocokan"
      className="border-border bg-card space-y-4 rounded-2xl border p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">Skor kecocokan</h2>
          </div>
          <p className="text-muted-foreground text-xs">
            Skor 0-100 berbasis aturan untuk membantu memprioritaskan tinjauan.
            Bukan pengganti penilaian rekruter.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-3xl font-bold tabular-nums"
              aria-label={
                hasScore
                  ? `Skor kecocokan ${score} dari 100`
                  : 'Belum dihitung'
              }
            >
              {hasScore ? score : '—'}
            </span>
            <span className="text-muted-foreground text-xs">/ 100</span>
          </div>
          {canManage ? <MatchRescoreButton applicationId={applicationId} /> : null}
        </div>
      </div>

      {scoredAt ? (
        <p className="text-muted-foreground text-[11px]">
          Dihitung {dateFmt.format(scoredAt)}.
        </p>
      ) : (
        <p className="text-muted-foreground text-[11px]">
          Skor belum pernah dihitung untuk lamaran ini.
        </p>
      )}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Label kecocokan">
          {tags.map((t) => (
            <li
              key={t}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tagTone(t)}`}
            >
              {MATCH_TAG_LABELS[t] ?? t}
            </li>
          ))}
        </ul>
      ) : null}

      {hasScore && breakdown ? (
        <div className="space-y-3">
          {keys.map((k) => {
            const dim = breakdown[k]
            const pct = dim.max > 0 ? Math.min(100, (dim.score / dim.max) * 100) : 0
            const detail = dimDetail(k, breakdown)
            return (
              <div key={k} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">
                    {MATCH_DIMENSION_LABELS[k]}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {dim.score}/{dim.max}
                  </span>
                </div>
                <div
                  className="bg-muted h-2 w-full overflow-hidden rounded-full"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={dim.max}
                  aria-valuenow={dim.score}
                >
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                </div>
                {detail ? (
                  <p className="text-muted-foreground text-[11px]">{detail}</p>
                ) : null}
              </div>
            )
          })}

          {/* Keyword chips */}
          {(breakdown.keywordOverlap.matchedKeywords.length > 0 ||
            breakdown.keywordOverlap.missedKeywords.length > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1 text-[11px] uppercase">
                  Kata kunci tertutup
                </p>
                {breakdown.keywordOverlap.matchedKeywords.length === 0 ? (
                  <p className="text-muted-foreground text-xs italic">—</p>
                ) : (
                  <ul className="flex flex-wrap gap-1">
                    {breakdown.keywordOverlap.matchedKeywords.map((kw) => (
                      <li
                        key={kw}
                        className="border-green-200 bg-green-50 text-green-800 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      >
                        {kw}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-[11px] uppercase">
                  Kata kunci hilang
                </p>
                {breakdown.keywordOverlap.missedKeywords.length === 0 ? (
                  <p className="text-muted-foreground text-xs italic">—</p>
                ) : (
                  <ul className="flex flex-wrap gap-1">
                    {breakdown.keywordOverlap.missedKeywords.map((kw) => (
                      <li
                        key={kw}
                        className="border-red-200 bg-red-50 text-red-700 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      >
                        {kw}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Skills chips */}
          {(breakdown.skillsCoverage.present.length > 0 ||
            breakdown.skillsCoverage.missing.length > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1 text-[11px] uppercase">
                  Keterampilan ada
                </p>
                <ul className="flex flex-wrap gap-1">
                  {breakdown.skillsCoverage.present.map((s) => (
                    <li
                      key={s}
                      className="border-sky-200 bg-sky-50 text-sky-800 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    >
                      {s}
                    </li>
                  ))}
                  {breakdown.skillsCoverage.present.length === 0 && (
                    <span className="text-muted-foreground text-xs italic">
                      —
                    </span>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-[11px] uppercase">
                  Keterampilan kurang
                </p>
                <ul className="flex flex-wrap gap-1">
                  {breakdown.skillsCoverage.missing.map((s) => (
                    <li
                      key={s}
                      className="border-red-200 bg-red-50 text-red-700 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    >
                      {s}
                    </li>
                  ))}
                  {breakdown.skillsCoverage.missing.length === 0 && (
                    <span className="text-muted-foreground text-xs italic">
                      —
                    </span>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Klik &quot;Skor ulang&quot; untuk menghitung skor kecocokan kandidat
          dengan lowongan ini.
        </p>
      )}

      {notes.length > 0 && hasScore ? (
        <div className="border-border border-t pt-3">
          <p className="text-muted-foreground mb-1 text-[11px] uppercase">
            Ringkasan
          </p>
          <ul className="text-foreground space-y-1 text-sm">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

export default MatchScoreCard
