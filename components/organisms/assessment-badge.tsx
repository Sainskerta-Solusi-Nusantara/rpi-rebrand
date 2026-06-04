import { BadgeCheck } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Teknis',
  soft: 'Soft skill',
  language: 'Bahasa',
  cognitive: 'Kognitif',
}

const CATEGORY_TONES: Record<string, string> = {
  technical: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  soft: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200',
  language: 'border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300',
  cognitive: 'border-violet-200 bg-violet-50 text-violet-800',
}

export type AssessmentBadgeProps = {
  title: string
  category: string
  score?: number
  /** Set to true to render as a smaller inline chip (default) or false for a card-like block. */
  compact?: boolean
}

/**
 * Display a passed-assessment badge on the public profile. Renders as a chip
 * by default. Category drives the colour tone. Includes a verification
 * checkmark icon to convey "verified by RPI".
 */
export function AssessmentBadge({
  title,
  category,
  score,
  compact = true,
}: AssessmentBadgeProps) {
  const tone =
    CATEGORY_TONES[category] ?? 'border-border bg-muted text-foreground'
  const label = CATEGORY_LABELS[category] ?? category

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${tone}`}
        title={`${title} · ${label}${score !== undefined ? ` · skor ${score}` : ''}`}
      >
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-semibold">{title}</span>
        <span className="opacity-70">· {label}</span>
        {score !== undefined && (
          <span className="opacity-70">· {score}</span>
        )}
      </span>
    )
  }

  return (
    <article
      className={`flex items-start gap-3 rounded-lg border p-3 ${tone}`}
    >
      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-heading text-sm font-semibold leading-tight">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] opacity-80">
          Kategori: {label}
          {score !== undefined ? ` · skor ${score}/100` : ''}
        </p>
      </div>
    </article>
  )
}
