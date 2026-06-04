import Link from 'next/link'
import { Pencil, Star } from 'lucide-react'
import { QuestionCardClientActions } from '@/components/organisms/interview-question-card-actions'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Teknis',
  behavioral: 'Perilaku',
  situational: 'Situasional',
  culture: 'Budaya',
  other: 'Lainnya',
}

const CATEGORY_TONES: Record<string, string> = {
  technical: 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300',
  behavioral: 'bg-violet-100 text-violet-800',
  situational: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200',
  culture: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  other: 'bg-muted text-muted-foreground',
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
})

export type InterviewQuestionCardData = {
  id: string
  text: string
  category: string
  difficulty: number
  tags: string[]
  createdAt: Date
  createdBy: { name: string | null; email: string } | null
}

function DifficultyStars({ value }: { value: number }) {
  const clamped = Math.max(1, Math.min(5, value))
  return (
    <span
      aria-label={`Tingkat kesulitan ${clamped} dari 5`}
      className="inline-flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= clamped
              ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
              : 'h-3.5 w-3.5 text-muted-foreground/40'
          }
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export function InterviewQuestionCard({
  tenantSlug,
  question,
  canManage,
}: {
  tenantSlug: string
  question: InterviewQuestionCardData
  canManage: boolean
}) {
  const tone = CATEGORY_TONES[question.category] ?? CATEGORY_TONES.other
  const label = CATEGORY_LABELS[question.category] ?? question.category
  const editHref =
    `/dashboard/tenants/${tenantSlug}/interview-questions/${question.id}/edit`

  return (
    <article className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
        >
          {label}
        </span>
        <DifficultyStars value={question.difficulty} />
        <span className="text-muted-foreground text-xs">
          {dateFmt.format(question.createdAt)}
        </span>
        {question.createdBy && (
          <span className="text-muted-foreground text-xs">
            • oleh {question.createdBy.name ?? question.createdBy.email}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {question.text}
      </p>

      {question.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tag pertanyaan">
          {question.tags.map((t) => (
            <li
              key={t}
              className="border-border bg-muted/60 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="border-border flex flex-wrap items-center gap-2 border-t pt-3">
        <QuestionCardClientActions
          questionId={question.id}
          text={question.text}
          canManage={canManage}
        />
        {canManage && (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={editHref as any}
            className="border-input text-foreground inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Ubah
          </Link>
        )}
      </div>
    </article>
  )
}
