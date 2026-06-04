/**
 * MatchScoreBadge — compact circular badge surfacing an Application's
 * `aiScore` value.
 *
 * Server component (no client interactivity). Render-anywhere — used in the
 * applications list as a `sm` chip and in the application detail page as a
 * `md` summary chip.
 */

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<Size, { wrap: string; num: string; label: string }> =
  {
    sm: {
      wrap: 'h-7 px-2 text-[11px]',
      num: 'text-[11px] font-mono font-semibold',
      label: 'sr-only',
    },
    md: {
      wrap: 'h-9 px-3 text-xs',
      num: 'text-sm font-mono font-semibold',
      label: 'text-[10px] uppercase tracking-wide',
    },
    lg: {
      wrap: 'h-12 px-4 text-sm',
      num: 'text-lg font-mono font-bold',
      label: 'text-xs uppercase tracking-wide',
    },
  }

function toneFor(score: number | null | undefined): {
  classes: string
  label: string
} {
  if (score === null || score === undefined) {
    return {
      classes: 'border-zinc-200 dark:border-zinc-500/30 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
      label: 'Belum',
    }
  }
  if (score >= 80) {
    return {
      classes: 'border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-300',
      label: 'Cocokkan sangat kuat',
    }
  }
  if (score >= 60) {
    return {
      classes: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200',
      label: 'Cocok',
    }
  }
  if (score >= 40) {
    return {
      classes: 'border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-300',
      label: 'Cocok sebagian',
    }
  }
  return {
    classes: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300',
    label: 'Kurang cocok',
  }
}

export function MatchScoreBadge({
  score,
  size = 'md',
}: {
  score?: number | null
  size?: Size
}) {
  const tone = toneFor(score)
  const sz = SIZE_CLASSES[size]
  const display = score === null || score === undefined ? '—' : String(score)
  const a11y =
    score === null || score === undefined
      ? 'Belum dihitung'
      : `Skor kecocokan ${score} dari 100`
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${tone.classes} ${sz.wrap}`}
      aria-label={a11y}
      title={a11y}
    >
      <span className={sz.num}>{display}</span>
      <span className={sz.label}>{tone.label}</span>
    </span>
  )
}

export default MatchScoreBadge
