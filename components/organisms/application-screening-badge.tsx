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
      box: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      label: 'Belum di-screening',
    }
  }
  if (score >= 75) {
    return {
      box: 'bg-green-100 text-green-800 border-green-200',
      label: `${score}/100`,
    }
  }
  if (score >= 50) {
    return {
      box: 'bg-amber-100 text-amber-800 border-amber-200',
      label: `${score}/100`,
    }
  }
  return {
    box: 'bg-red-100 text-red-800 border-red-200',
    label: `${score}/100`,
  }
}

function tagTone(tag: string): string {
  if (tag === 'match-tinggi') return 'bg-green-50 text-green-700 border-green-200'
  if (tag === 'match-sedang') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (tag === 'perlu-tinjauan' || tag === 'tidak-ada-cv')
    return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
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
