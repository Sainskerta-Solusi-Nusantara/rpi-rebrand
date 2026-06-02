'use client'

/**
 * ArticleForm — admin create/edit form for `Article`.
 *
 * - Title, slug (auto-derived but read-only display since the server generates
 *   the real slug; we still show the auto-derived preview so the editor knows
 *   what to expect — the actual unique slug is created by the action).
 * - Summary, body (markdown textarea), coverImage URL, tags (chip input),
 *   status select.
 * - "Pratinjau" toggle swaps the body editor for rendered HTML so the editor
 *   can sanity-check the layout before saving.
 *
 * Validation messages from server actions are surfaced inline via a banner.
 */

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, X } from 'lucide-react'
import {
  createArticle,
  updateArticle,
  type ArticleStatus,
} from '@/lib/blog/actions'
import { renderMarkdownToHtml } from '@/lib/blog/markdown'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClass = `${inputClass} min-h-[20rem] resize-y font-mono text-[13px] leading-relaxed`

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondary =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'


export type ArticleFormInitial = {
  title: string
  summary: string
  body: string
  coverImage: string
  tags: string[]
  status: ArticleStatus
}

const EMPTY_INITIAL: ArticleFormInitial = {
  title: '',
  summary: '',
  body: '',
  coverImage: '',
  tags: [],
  status: 'DRAFT',
}

type Banner =
  | { kind: 'idle' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

function deriveSlugPreview(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function normaliseTag(raw: string): string | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, '-')
  if (!t) return null
  if (t.length > 40) return null
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(t)) return null
  return t
}

export function ArticleForm({
  articleId,
  initial,
}: {
  articleId?: string
  initial?: ArticleFormInitial
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsContent.articleForm
  const seed = initial ?? EMPTY_INITIAL
  const isEdit = Boolean(articleId)

  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })

  const [title, setTitle] = useState(seed.title)
  const [summary, setSummary] = useState(seed.summary)
  const [body, setBody] = useState(seed.body)
  const [coverImage, setCoverImage] = useState(seed.coverImage)
  const [tags, setTags] = useState<string[]>(seed.tags)
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<ArticleStatus>(seed.status)
  const [preview, setPreview] = useState(false)

  const slugPreview = useMemo(() => deriveSlugPreview(title), [title])
  const renderedBody = useMemo(() => renderMarkdownToHtml(body), [body])

  function addTagFromInput() {
    const t = normaliseTag(tagInput)
    setTagInput('')
    if (!t) return
    if (tags.includes(t)) return
    if (tags.length >= 10) return
    setTags([...tags, t])
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        body: body.trim(),
        coverImage: coverImage.trim() || undefined,
        tags,
      }

      const result = isEdit
        ? await updateArticle({
            articleId: articleId as string,
            ...payload,
            status,
          })
        : await createArticle(payload)

      if (!result.ok) {
        setBanner({ kind: 'error', message: result.error })
        return
      }
      setBanner({ kind: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/admin/articles' as any)
      router.refresh()
    })
  }

  const STATUS_LABELS: Record<ArticleStatus, string> = {
    DRAFT: tl.statusDraft,
    PUBLISHED: tl.statusPublished,
    ARCHIVED: tl.statusArchived,
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-foreground text-sm font-medium">{tl.fieldsetIdentity}</legend>

        <div className="space-y-1">
          <label htmlFor="f-title" className={labelClass}>
            {tl.titleLabel}
          </label>
          <input
            id="f-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            required
            minLength={5}
            maxLength={200}
            placeholder={tl.titlePlaceholder}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f-slug" className={labelClass}>
            {tl.slugLabel}
          </label>
          <input
            id="f-slug"
            type="text"
            value={slugPreview || ''}
            disabled
            placeholder={tl.slugPlaceholder}
            className={inputClass}
          />
          <p className="text-muted-foreground text-xs">
            {tl.slugHelper}
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="f-summary" className={labelClass}>
            {tl.summaryLabel}{' '}
            <span className="text-muted-foreground">{tl.summaryMaxHint}</span>
          </label>
          <textarea
            id="f-summary"
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={pending}
            maxLength={500}
            placeholder={tl.summaryPlaceholder}
            className={`${inputClass} min-h-[6rem] resize-y`}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f-cover" className={labelClass}>
            {tl.coverLabel}
          </label>
          <input
            id="f-cover"
            name="coverImage"
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            disabled={pending}
            placeholder={tl.coverPlaceholder}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-foreground text-sm font-medium">{tl.fieldsetTag}</legend>
        <div className="flex flex-wrap gap-2" aria-label={tl.tagAriaLabel}>
          {tags.length === 0 && (
            <span className="text-muted-foreground text-xs">
              {tl.tagEmpty}
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="border-border bg-muted/60 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={pending}
                aria-label={tl.tagRemoveAriaLabel.replace('{t}', tag)}
                className="text-muted-foreground hover:text-foreground inline-flex h-4 w-4 items-center justify-center rounded-full"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTagFromInput()
              }
            }}
            disabled={pending || tags.length >= 10}
            placeholder={tl.tagInputPlaceholder}
            className={inputClass}
            maxLength={40}
          />
          <button
            type="button"
            onClick={addTagFromInput}
            disabled={pending || !tagInput.trim() || tags.length >= 10}
            className={btnSecondary}
          >
            {tl.tagAddButton}
          </button>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <div className="flex items-center justify-between">
          <legend className="text-foreground text-sm font-medium">
            {tl.fieldsetBody}
          </legend>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            disabled={pending}
            className={btnSecondary}
          >
            {preview ? (
              <>
                <Pencil className="h-4 w-4" aria-hidden />
                {tl.bodyEditButton}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" aria-hidden />
                {tl.bodyPreviewButton}
              </>
            )}
          </button>
        </div>

        {!preview ? (
          <textarea
            id="f-body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={pending}
            required
            minLength={50}
            placeholder={tl.bodyPlaceholder}
            className={textareaClass}
          />
        ) : (
          <div
            className="prose prose-sm border-border bg-background max-w-none rounded-md border p-4"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
        )}
      </fieldset>

      {isEdit && (
        <fieldset className="space-y-3">
          <legend className="text-foreground text-sm font-medium">
            {tl.fieldsetStatus}
          </legend>
          <div className="space-y-1 sm:max-w-xs">
            <label htmlFor="f-status" className={labelClass}>
              {tl.statusLabel}
            </label>
            <select
              id="f-status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              disabled={pending}
              className={inputClass}
            >
              {(Object.keys(STATUS_LABELS) as ArticleStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              {tl.statusHelper}
            </p>
          </div>
        </fieldset>
      )}

      {banner.kind === 'success' && (
        <p
          role="status"
          className="border-success/30 bg-success/10 text-success rounded-md border px-3 py-2 text-sm"
        >
          {isEdit ? tl.bannerSuccess_edit : tl.bannerSuccess_create}
        </p>
      )}
      {banner.kind === 'error' && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {banner.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tl.submitPending : isEdit ? tl.submitEdit : tl.submitCreate}
        </button>
        <button
          type="button"
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push('/admin/articles' as any)
          }}
          disabled={pending}
          className={btnSecondary}
        >
          {tl.cancelButton}
        </button>
      </div>
    </form>
  )
}
