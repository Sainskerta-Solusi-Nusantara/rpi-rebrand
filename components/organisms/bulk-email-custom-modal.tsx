'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkSendEmail } from '@/lib/applications/bulk-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const MAX_BODY = 5000

/**
 * Render `{{varName}}` tokens locally for the live preview. Mirrors the
 * server's `renderTemplate` shape (regex `\{\{(\w+)\}\}`). Kept inline so the
 * preview stays in sync without a server round-trip.
 */
function renderPreview(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (m, name: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      const v = vars[name]
      return v == null ? '' : v
    }
    return m
  })
}

const PREVIEW_VARS: Record<string, string> = {
  candidateName: 'Aji Santoso',
  name: 'Aji Santoso',
  jobTitle: 'Senior Frontend Engineer',
  tenantName: 'PT Contoh Karya',
}

export function BulkEmailCustomModal({
  open,
  onClose,
  selectedIds,
  onSent,
}: {
  open: boolean
  onClose: () => void
  selectedIds: string[]
  onSent?: () => void
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsBulk.emailModal
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const tooLong = body.length > MAX_BODY

  function submit() {
    setError(null)
    if (!subject.trim() || !body.trim()) {
      setError(tl.errorRequired)
      return
    }
    if (tooLong) {
      setError(tl.errorTooLong)
      return
    }
    startTransition(async () => {
      const r = await bulkSendEmail({
        applicationIds: selectedIds,
        subject: subject.trim(),
        body: body.trim(),
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      onSent?.()
      onClose()
      setSubject('')
      setBody('')
      router.refresh()
    })
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tl.ariaLabel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="bg-card text-foreground border-border w-full max-w-2xl rounded-2xl border p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg">{tl.heading}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {tl.descRecipients.replace('{count}', String(selectedIds.length))}{' '}
              <code className="bg-muted rounded px-1 text-xs">
                {'{{candidateName}}'}
              </code>
              ,{' '}
              <code className="bg-muted rounded px-1 text-xs">
                {'{{jobTitle}}'}
              </code>
              , dan{' '}
              <code className="bg-muted rounded px-1 text-xs">
                {'{{tenantName}}'}
              </code>
              .
            </p>
          </div>
        </div>

        <label
          htmlFor="bulk-email-subject"
          className="text-foreground mt-4 block text-sm font-medium"
        >
          {tl.subjectLabel}
        </label>
        <input
          id="bulk-email-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={pending}
          maxLength={300}
          placeholder={tl.subjectPlaceholder}
          className="border-input bg-background focus:border-ring focus:ring-ring/30 mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <label
          htmlFor="bulk-email-body"
          className="text-foreground mt-4 block text-sm font-medium"
        >
          {tl.bodyLabel}
        </label>
        <textarea
          id="bulk-email-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
          rows={8}
          maxLength={MAX_BODY + 100}
          placeholder={tl.bodyPlaceholder}
          className="border-input bg-background focus:border-ring focus:ring-ring/30 mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between text-xs">
          <span
            className={`${
              tooLong ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {body.length.toLocaleString('id-ID')} / {MAX_BODY}
          </span>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showPreview ? tl.hidePreview : tl.togglePreview}
          </button>
        </div>

        {showPreview && (
          <div className="border-border bg-muted/40 mt-3 rounded-md border p-3 text-sm">
            <div className="text-muted-foreground text-xs uppercase">
              {tl.previewHeading}
            </div>
            <div className="mt-2 font-medium">
              {renderPreview(subject || tl.noSubject, PREVIEW_VARS)}
            </div>
            <pre className="text-foreground mt-2 whitespace-pre-wrap font-sans text-sm">
              {renderPreview(body || tl.noBody, PREVIEW_VARS)}
            </pre>
          </div>
        )}

        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onClose()
              setError(null)
            }}
            disabled={pending}
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            {tl.cancelButton}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || tooLong}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? tl.sendingButton
              : tl.sendButton.replace('{count}', selectedIds.length.toLocaleString('id-ID'))}
          </button>
        </div>
      </div>
    </div>
  )
}
