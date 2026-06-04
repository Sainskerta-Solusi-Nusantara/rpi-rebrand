import { TAG_LABELS } from '@/lib/applications/screening'

type Props = {
  score: number | null
  tags: string[]
  /** Compact mode hides the tag chips and only shows the score chip. */
  compact?: boolean
}

function toneFor(score: number | null): { box: string; label: string } {
  if (score === null) {
    return {
      box: 'bg-zinc-100 dark:bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-500/30',
      label: 'Belum di-screening',
    }
  }
  if (score >= 75) {
    return {
      box: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/30',
      label: `${score}/100`,
    }
  }
  if (score >= 50) {
    return {
      box: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30',
      label: `${score}/100`,
    }
  }
  return {
    box: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/30',
    label: `${score}/100`,
  }
}

function tagTone(tag: string): string {
  if (tag === 'match-tinggi') return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30'
  if (tag === 'match-sedang') return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-500/30'
  if (tag === 'perlu-tinjauan' || tag === 'tidak-ada-cv')
    return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
  return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30'
}

/**
 * Score badge + tag chips for an Application's AI screening state. Renders
 * a compact gray "Belum di-screening" pill when score is null.
 */
export function ApplicationScreeningBadge({ score, tags, compact }: Props) {
  const tone = toneFor(score)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.box}`}
        aria-label={
          score === null ? 'Belum di-screening' : `Skor AI ${score} dari 100`
        }
      >
        AI: {tone.label}
      </span>
      {!compact &&
        tags.map((t) => (
          <span
            key={t}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagTone(t)}`}
          >
            {TAG_LABELS[t] ?? t}
          </span>
        ))}
    </div>
  )
}

export default ApplicationScreeningBadge
