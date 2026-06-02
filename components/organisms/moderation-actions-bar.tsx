'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateFlagStatus, removeContent } from '@/lib/moderation/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Banner =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

type RemovalAction = 'suspend_user' | 'archive_job' | 'archive_course' | 'soft_delete_message'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnGhost =
  'inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'

const btnDestructive =
  'inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'

export function ModerationActionsBar({
  flagId,
  currentStatus,
  resourceType,
}: {
  flagId: string
  currentStatus: string
  resourceType: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tr = t.formsActions.moderationActions
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [resolutionText, setResolutionText] = useState<string>('')

  function allowedRemovalActions(type: string): { value: RemovalAction; label: string }[] {
    switch (type) {
      case 'job':
        return [{ value: 'archive_job', label: tr.removalArchiveJob }]
      case 'course':
        return [{ value: 'archive_course', label: tr.removalArchiveCourse }]
      case 'user':
      case 'profile':
        return [{ value: 'suspend_user', label: tr.removalSuspendUser }]
      case 'message':
        return [{ value: 'soft_delete_message', label: tr.removalDeleteMessage }]
      default:
        return []
    }
  }

  const removalActions = allowedRemovalActions(resourceType)
  const [removalAction, setRemovalAction] = useState<RemovalAction | ''>(
    (removalActions[0]?.value as RemovalAction | undefined) ?? '',
  )

  const isTerminal = currentStatus === 'resolved' || currentStatus === 'dismissed'

  function withBanner(
    fn: () => Promise<{ ok: true } | { ok: false; error: string }>,
    successMsg: string,
  ) {
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await fn()
      if (r.ok) {
        setBanner({ kind: 'success', message: successMsg })
        router.refresh()
      } else {
        setBanner({ kind: 'error', message: r.error })
      }
    })
  }

  return (
    <div className="space-y-5">
      {banner.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {banner.message}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnGhost}
          disabled={pending || currentStatus === 'reviewing' || isTerminal}
          onClick={() =>
            withBanner(
              () => updateFlagStatus({ flagId, status: 'reviewing' }),
              tr.successReviewing,
            )
          }
        >
          {pending ? tr.btnPending : tr.btnReview}
        </button>
        <button
          type="button"
          className={btnGhost}
          disabled={pending || isTerminal}
          onClick={() =>
            withBanner(
              () => updateFlagStatus({ flagId, status: 'dismissed', resolution: resolutionText || undefined }),
              tr.successDismissed,
            )
          }
        >
          {tr.btnDismiss}
        </button>
      </div>

      <div className="border-border rounded-md border p-4 space-y-3">
        <label className="block text-sm font-medium text-foreground">
          {tr.resolutionLabel}
        </label>
        <textarea
          className={inputClass}
          rows={3}
          maxLength={2000}
          value={resolutionText}
          onChange={(e) => setResolutionText(e.target.value)}
          disabled={pending || isTerminal}
          placeholder={tr.resolutionPlaceholder}
        />
        <button
          type="button"
          className={btnPrimary}
          disabled={pending || isTerminal}
          onClick={() =>
            withBanner(
              () =>
                updateFlagStatus({
                  flagId,
                  status: 'resolved',
                  resolution: resolutionText || undefined,
                }),
              tr.successResolved,
            )
          }
        >
          {tr.btnResolve}
        </button>
      </div>

      {removalActions.length > 0 ? (
        <div className="border-border rounded-md border p-4 space-y-3">
          <label className="block text-sm font-medium text-foreground">
            {tr.contentActionLabel}
          </label>
          <select
            className={inputClass}
            value={removalAction}
            onChange={(e) => setRemovalAction(e.target.value as RemovalAction)}
            disabled={pending || isTerminal}
          >
            {removalActions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            {tr.contentActionHint}
          </p>
          <button
            type="button"
            className={btnDestructive}
            disabled={pending || isTerminal || !removalAction}
            onClick={() => {
              if (!removalAction) return
              withBanner(
                () => removeContent({ flagId, action: removalAction }),
                tr.successAction,
              )
            }}
          >
            {tr.btnExecute}
          </button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          {tr.noAutoAction}
        </p>
      )}

      {isTerminal ? (
        <p className="text-muted-foreground text-xs">
          {tr.terminalNote}
        </p>
      ) : null}
    </div>
  )
}
