'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react'
import {
  analyzeMyResume,
  applySuggestion,
} from '@/lib/resume/suggestion-actions'
import type {
  AnalysisResult,
  Severity,
  Suggestion,
  SuggestionCategory,
} from '@/lib/resume/analyzer'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Props = {
  resumeId: string
  initialAnalysis: AnalysisResult
}

type Filter = 'all' | Severity

function scoreColor(score: number): {
  bar: string
  text: string
  bg: string
} {
  if (score < 50) {
    return {
      bar: 'bg-red-500',
      text: 'text-red-600 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-500/10',
    }
  }
  if (score < 80) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-200',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    }
  }
  return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  }
}

function severityClass(s: Severity): string {
  if (s === 'high') return 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
  if (s === 'medium') return 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200'
  return 'border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300'
}

function severityIcon(s: Severity) {
  if (s === 'high') return <AlertTriangle className="h-4 w-4" aria-hidden />
  if (s === 'medium') return <Info className="h-4 w-4" aria-hidden />
  return <CheckCircle2 className="h-4 w-4" aria-hidden />
}

const AUTOFIX_IDS = new Set<string>(['summary-too-long'])
const AUTOFIX_PREFIXES = ['add-skill-']

function isAutoFixable(id: string): boolean {
  if (AUTOFIX_IDS.has(id)) return true
  return AUTOFIX_PREFIXES.some((p) => id.startsWith(p))
}

export function ResumeSuggestionsPanel({ resumeId, initialAnalysis }: Props) {
  const { t } = useI18n()
  const rs = t.formsInsights.resumeSuggestions

  const SEVERITY_LABEL: Record<Severity, string> = {
    high: rs.severityHigh,
    medium: rs.severityMedium,
    low: rs.severityLow,
  }

  const CATEGORY_LABEL: Record<SuggestionCategory | 'summary', string> = {
    length: rs.categoryLength,
    phrasing: rs.categoryPhrasing,
    completeness: rs.categoryCompleteness,
    skills: rs.categorySkills,
    achievements: rs.categoryAchievements,
    consistency: rs.categoryConsistency,
    contact: rs.categoryContact,
    summary: rs.categorySummary,
  }

  const [analysis, setAnalysis] = useState<AnalysisResult>(initialAnalysis)
  const [filter, setFilter] = useState<Filter>('all')
  const [isReanalyzing, startReanalyze] = useTransition()
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{
    kind: 'error' | 'success'
    text: string
  } | null>(null)

  const color = scoreColor(analysis.score)
  const filtered = useMemo(() => {
    if (filter === 'all') return analysis.suggestions
    return analysis.suggestions.filter((s) => s.severity === filter)
  }, [analysis.suggestions, filter])

  const counts = useMemo(() => {
    const acc = { high: 0, medium: 0, low: 0 }
    for (const s of analysis.suggestions) acc[s.severity] += 1
    return acc
  }, [analysis.suggestions])

  function handleReanalyze() {
    setBanner(null)
    startReanalyze(async () => {
      const r = await analyzeMyResume(resumeId)
      if (!r.ok) {
        setBanner({ kind: 'error', text: r.error })
        return
      }
      if (r.data) setAnalysis(r.data)
      setBanner({ kind: 'success', text: 'Analisis diperbarui.' })
    })
  }

  function handleApply(s: Suggestion) {
    setBanner(null)
    setApplyingId(s.id)
    startReanalyze(async () => {
      const r = await applySuggestion(resumeId, s.id)
      setApplyingId(null)
      if (!r.ok) {
        setBanner({ kind: 'error', text: r.error })
        return
      }
      if (r.data) setAnalysis(r.data)
      setBanner({ kind: 'success', text: rs.successApply })
    })
  }

  return (
    <section
      aria-label="Saran perbaikan CV"
      className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm"
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
            {rs.heading}
          </h2>
          <p className="text-muted-foreground text-sm">
            {rs.subheading}
          </p>
          {analysis.source === 'ai' && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-300">
              <Sparkles className="h-3 w-3" aria-hidden />
              {rs.aiEnhancedNote}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleReanalyze}
          disabled={isReanalyzing}
          className="border-input hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isReanalyzing ? 'animate-spin' : ''}`}
            aria-hidden
          />
          {rs.reanalyzeButton}
        </button>
      </header>

      {/* Score gauge */}
      <div className={`mb-5 rounded-md ${color.bg} p-4`}>
        <div className="mb-2 flex items-end justify-between gap-2">
          <span className="text-muted-foreground text-sm">{rs.scoreLabel}</span>
          <span className={`font-heading text-3xl ${color.text}`}>
            {analysis.score}
            <span className="text-muted-foreground text-base">/100</span>
          </span>
        </div>
        <div className="bg-background h-2.5 w-full overflow-hidden rounded-full">
          <div
            className={`h-full ${color.bar} transition-all`}
            style={{ width: `${analysis.score}%` }}
            aria-valuenow={analysis.score}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>

      {/* Breakdown grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {analysis.breakdown.map((b, idx) => {
          const pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0
          const c = scoreColor(pct)
          // The breakdown rows include a synthetic 'summary' row; treat the
          // category label permissively.
          const key = (b.category as unknown) as keyof typeof CATEGORY_LABEL
          const label = CATEGORY_LABEL[key] ?? String(b.category)
          return (
            <div
              key={`${b.category}-${idx}`}
              className="border-border/60 rounded-md border p-3"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">
                  {b.score}/{b.max}
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full ${c.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={rs.filterAll.replace('{count}', String(analysis.suggestions.length))}
        />
        <FilterChip
          active={filter === 'high'}
          onClick={() => setFilter('high')}
          label={rs.filterHigh.replace('{count}', String(counts.high))}
          color="red"
        />
        <FilterChip
          active={filter === 'medium'}
          onClick={() => setFilter('medium')}
          label={rs.filterMedium.replace('{count}', String(counts.medium))}
          color="amber"
        />
        <FilterChip
          active={filter === 'low'}
          onClick={() => setFilter('low')}
          label={rs.filterLow.replace('{count}', String(counts.low))}
          color="sky"
        />
      </div>

      {/* Banner */}
      {banner && (
        <div
          role="status"
          className={`mb-3 rounded-md border px-3 py-2 text-sm ${
            banner.kind === 'error'
              ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
              : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Suggestion list */}
      {filtered.length === 0 ? (
        <div className="bg-muted/30 rounded-md p-6 text-center">
          <CheckCircle2
            className="mx-auto mb-2 h-8 w-8 text-emerald-500"
            aria-hidden
          />
          <p className="text-muted-foreground text-sm">
            {analysis.suggestions.length === 0
              ? rs.emptyAll
              : rs.emptyFilter}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="border-border/60 rounded-md border p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${severityClass(
                    s.severity,
                  )}`}
                >
                  {severityIcon(s.severity)}
                  {SEVERITY_LABEL[s.severity]}
                </span>
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                  {CATEGORY_LABEL[s.category] ?? s.category}
                </span>
                {s.aiGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 text-xs text-violet-700 dark:text-violet-300">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {rs.aiBadge}
                  </span>
                )}
                {s.affectedSection && (
                  <span className="text-muted-foreground text-xs">
                    · {s.affectedSection}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{s.body}</p>

              {(s.exampleBefore || s.exampleAfter) && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {s.exampleBefore && (
                    <div className="bg-muted/40 rounded p-2 text-xs">
                      <div className="text-muted-foreground mb-1 font-medium">
                        {rs.exampleBefore}
                      </div>
                      <div>{s.exampleBefore}</div>
                    </div>
                  )}
                  {s.exampleAfter && (
                    <div className="rounded border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-2 text-xs text-emerald-900 dark:text-emerald-300">
                      <div className="mb-1 font-medium">{rs.exampleAfter}</div>
                      <div>{s.exampleAfter}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isAutoFixable(s.id) ? (
                  <button
                    type="button"
                    onClick={() => handleApply(s)}
                    disabled={applyingId === s.id || isReanalyzing}
                    className="bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    <Wand2 className="h-3.5 w-3.5" aria-hidden />
                    {applyingId === s.id
                      ? rs.applyingButton
                      : rs.applyButton}
                  </button>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {rs.manualEdit}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: 'red' | 'amber' | 'sky'
}) {
  const base =
    'inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors'
  const palette = active
    ? color === 'red'
      ? 'border-red-300 dark:border-red-500/30 bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300'
      : color === 'amber'
        ? 'border-amber-300 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200'
        : color === 'sky'
          ? 'border-sky-300 dark:border-sky-500/30 bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300'
          : 'border-foreground/30 bg-foreground/10 text-foreground'
    : 'border-border bg-background text-muted-foreground hover:bg-muted'
  return (
    <button type="button" onClick={onClick} className={`${base} ${palette}`}>
      {label}
    </button>
  )
}
