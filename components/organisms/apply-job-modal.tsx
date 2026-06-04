'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, Send, X } from 'lucide-react'
import { submitApplication } from '@/lib/applications/actions'
import {
  JobQuestionRenderer,
  type AnswerMap,
  type JobQuestionForRenderer,
} from '@/components/organisms/job-question-renderer'
import { useI18n } from '@/lib/i18n/i18n-provider'

export type ApplyJobResume = {
  id: string
  name: string
  fileUrl: string | null
  isPrimary: boolean
}

export function ApplyJobModal({
  jobSlug,
  jobTitle,
  tenantName,
  resumes,
  questions = [],
}: {
  jobSlug: string
  jobTitle: string
  tenantName: string
  resumes: ApplyJobResume[]
  questions?: JobQuestionForRenderer[]
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsApplications.applyModal
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const sortedResumes = useMemo(() => {
    const copy = [...resumes]
    copy.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      return a.name.localeCompare(b.name)
    })
    return copy
  }, [resumes])

  const primaryId = sortedResumes.find((r) => r.isPrimary)?.id ?? ''
  const [resumeId, setResumeId] = useState<string>(primaryId)
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [answers, setAnswers] = useState<AnswerMap>({})

  function reset() {
    setError(null)
    setSuccess(false)
    setResumeId(primaryId)
    setCoverLetter('')
    setAnswers({})
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Client-side required-question guard -- server re-validates.
    for (const q of questions) {
      if (!q.required) continue
      const v = answers[q.id]
      if (!v || v.trim().length === 0) {
        setError(tl.errorRequired.replace('{label}', q.label))
        return
      }
    }

    const answersPayload = questions
      .map((q) => ({ questionId: q.id, value: answers[q.id] ?? '' }))
      .filter((a) => a.value.length > 0)

    startTransition(async () => {
      const r = await submitApplication({
        jobSlug,
        resumeId: resumeId || undefined,
        coverLetter: coverLetter.trim() || undefined,
        answers: answersPayload.length > 0 ? answersPayload : undefined,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          reset()
          setOpen(true)
        }}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition"
      >
        <Send className="h-4 w-4" aria-hidden />
        {tl.applyNow}
      </button>
    )
  }

  return (
    <div className="border-border bg-card relative space-y-4 rounded-2xl border p-5">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={tl.closeAriaLabel}
        className="text-muted-foreground hover:text-foreground absolute right-3 top-3 rounded p-1 transition"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="pr-6">
        <div className="font-heading text-foreground text-base font-semibold">
          {tl.heading}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {jobTitle} · {tenantName}
        </p>
      </div>

      {success ? (
        <div
          role="status"
          className="space-y-3 rounded-md border border-emerald-300 dark:border-emerald-500/30/40 bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{tl.successTitle}</p>
              <p className="mt-1 text-xs opacity-90">
                {tl.successBody}
              </p>
            </div>
          </div>
          <a
            href="/dashboard/lamaran"
            className="text-foreground hover:text-primary inline-flex items-center gap-1 text-xs font-medium underline"
          >
            {tl.successLink}
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="apply-resume"
              className="text-foreground block text-sm font-medium"
            >
              {tl.cvLabel}
            </label>
            {sortedResumes.length === 0 ? (
              <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
                {tl.cvEmpty}{' '}
                <a href="/dashboard/cv" className="text-primary underline">
                  {tl.cvEmptyUploadLink}
                </a>
                .
              </p>
            ) : (
              <select
                id="apply-resume"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                disabled={pending}
                className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">{tl.cvNoAttachment}</option>
                {sortedResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.isPrimary ? tl.cvPrimaryBadge : ''}
                  </option>
                ))}
              </select>
            )}
            {resumeId && sortedResumes.find((r) => r.id === resumeId) && (
              <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3" aria-hidden />
                {tl.cvAttachmentHint}
              </p>
            )}
          </div>

          {questions.length > 0 && (
            <JobQuestionRenderer
              questions={questions}
              currentAnswers={answers}
              onChange={setAnswers}
              disabled={pending}
            />
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="apply-cover"
              className="text-foreground block text-sm font-medium"
            >
              {tl.coverLabel}{' '}
              <span className="text-muted-foreground font-normal">
                {tl.coverOptional}
              </span>
            </label>
            <textarea
              id="apply-cover"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value.slice(0, 5000))}
              rows={5}
              maxLength={5000}
              disabled={pending}
              placeholder={tl.coverPlaceholder}
              className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="text-muted-foreground text-right text-[10px]">
              {coverLetter.length} / 5000
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {pending ? tl.submitPending : tl.submitBtn}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="text-muted-foreground hover:text-foreground text-sm font-medium disabled:opacity-60"
            >
              {tl.cancelBtn}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
