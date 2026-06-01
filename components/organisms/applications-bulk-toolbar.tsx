'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { ApplicationStatus } from '@prisma/client'
import {
  bulkUpdateStatus,
  bulkSendEmail,
  bulkAddTag,
  bulkAssignReviewer,
  type BulkSummary,
  type BulkEmailSummary,
} from '@/lib/applications/bulk-actions'
import { BulkEmailCustomModal } from './bulk-email-custom-modal'

export type BulkTemplateOption = {
  id: string
  label: string // friendly label, usually "<status>: <subject>"
}

export type BulkMemberOption = {
  id: string
  label: string
}

const CUSTOM_TEMPLATE_VALUE = '__custom__'

function summarize(summary: BulkSummary | BulkEmailSummary): string {
  const updated = summary.updated.length
  const skipped = summary.skipped.length
  const base = `${updated} berhasil`
  if (skipped > 0) return `${base}, ${skipped} dilewati`
  return base
}

/**
 * Sticky toolbar shown only when at least one row is selected. Lives above
 * the table; each dropdown fires the matching bulk server action. Per-row
 * failures show as "X berhasil, Y dilewati" so recruiters can see partial
 * outcomes without leaving the page.
 */
export function ApplicationsBulkToolbar({
  tenantSlug: _tenantSlug,
  selectedIds,
  onClear,
  availableStatuses,
  availableTemplates,
  availableReviewers,
}: {
  tenantSlug: string
  selectedIds: string[]
  onClear: () => void
  availableStatuses: Array<{ value: ApplicationStatus; label: string }>
  availableTemplates: BulkTemplateOption[]
  availableReviewers: BulkMemberOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<'ok' | 'error'>('ok')
  const [tag, setTag] = useState('')
  const [customOpen, setCustomOpen] = useState(false)

  if (selectedIds.length === 0) return null

  const hasTemplates = availableTemplates.length > 0

  function showFeedback(msg: string, tone: 'ok' | 'error' = 'ok') {
    setFeedback(msg)
    setFeedbackTone(tone)
  }

  function onStatusChange(value: string) {
    if (!value) return
    startTransition(async () => {
      const r = await bulkUpdateStatus({
        applicationIds: selectedIds,
        newStatus: value,
      })
      if (!r.ok) {
        showFeedback(r.error, 'error')
        return
      }
      showFeedback(`Status: ${summarize(r.data)}`, 'ok')
      router.refresh()
    })
  }

  function onTemplateChange(value: string) {
    if (!value) return
    if (value === CUSTOM_TEMPLATE_VALUE) {
      setCustomOpen(true)
      return
    }
    startTransition(async () => {
      const r = await bulkSendEmail({
        applicationIds: selectedIds,
        templateId: value,
      })
      if (!r.ok) {
        showFeedback(r.error, 'error')
        return
      }
      showFeedback(
        `Email: ${r.data.sent} terkirim · ${r.data.failed} gagal`,
        r.data.failed > 0 ? 'error' : 'ok',
      )
      router.refresh()
    })
  }

  function onAddTag() {
    if (!tag.trim()) return
    startTransition(async () => {
      const r = await bulkAddTag({
        applicationIds: selectedIds,
        tag: tag.trim(),
      })
      if (!r.ok) {
        showFeedback(r.error, 'error')
        return
      }
      showFeedback(`Tag: ${summarize(r.data)}`, 'ok')
      setTag('')
      router.refresh()
    })
  }

  function onAssign(value: string) {
    if (!value) return
    startTransition(async () => {
      const r = await bulkAssignReviewer({
        applicationIds: selectedIds,
        reviewerId: value,
      })
      if (!r.ok) {
        showFeedback(r.error, 'error')
        return
      }
      showFeedback(`Tugaskan: ${summarize(r.data)}`, 'ok')
      router.refresh()
    })
  }

  return (
    <>
      <div
        role="region"
        aria-label="Aksi massal lamaran"
        className="border-primary/30 bg-primary/5 sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-2xl border p-3 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium">
            {selectedIds.length.toLocaleString('id-ID')} dipilih
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={pending}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Batal
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Ubah status"
            disabled={pending}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              e.currentTarget.value = ''
              onStatusChange(v)
            }}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
          >
            <option value="">Ubah status…</option>
            {availableStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Kirim email"
            disabled={pending}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              e.currentTarget.value = ''
              onTemplateChange(v)
            }}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
          >
            <option value="">Kirim email…</option>
            {availableTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
            {/* Custom email is always available — when tenant has 0 templates
                this is the only emit path. */}
            {!hasTemplates && (
              <option value="" disabled>
                (tidak ada template)
              </option>
            )}
            <option value={CUSTOM_TEMPLATE_VALUE}>Email kustom…</option>
          </select>

          <div className="flex items-center gap-1">
            <input
              type="text"
              aria-label="Tambah tag"
              placeholder="Tambah tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={pending}
              maxLength={40}
              className="border-input bg-background w-32 rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
            />
            <button
              type="button"
              onClick={onAddTag}
              disabled={pending || !tag.trim()}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tambah
            </button>
          </div>

          <select
            aria-label="Tugaskan ke"
            disabled={pending}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              e.currentTarget.value = ''
              onAssign(v)
            }}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
          >
            <option value="">Tugaskan ke…</option>
            {availableReviewers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {feedback && (
          <p
            role="status"
            className={`ml-auto text-xs ${
              feedbackTone === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {feedback}
          </p>
        )}
      </div>

      <BulkEmailCustomModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        selectedIds={selectedIds}
        onSent={() => showFeedback('Email kustom dikirim.', 'ok')}
      />
    </>
  )
}
