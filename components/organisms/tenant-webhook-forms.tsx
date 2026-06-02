'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  createTenantWebhook,
  revokeTenantWebhook,
  rotateTenantWebhookSecret,
  toggleTenantWebhook,
} from '@/lib/tenants/webhook-actions'
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  type WebhookEvent,
} from '@/lib/webhooks/events'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

type CreateResult = { id: string; secret: string } | null

function OneTimeSecretBox({
  secret,
  onDone,
  title,
}: {
  secret: string
  onDone: () => void
  title: string
}) {
  const { t } = useI18n()
  const tw = t.formsTenantIntegration.webhooks
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-4 rounded-md border border-success/30 bg-success/10 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-muted-foreground text-xs">
        {tw.secretBoxHint}
      </p>
      <div className="bg-background border-border rounded-md border p-3">
        <code className="block break-all font-mono text-xs">{secret}</code>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard
              ?.writeText(secret)
              .then(() => setCopied(true))
              .catch(() => {})
          }}
          className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
        >
          <Copy className="h-3 w-3" aria-hidden="true" />
          {copied ? tw.copied : tw.copyToClipboard}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-muted-foreground hover:text-foreground ml-auto text-xs"
        >
          {tw.done}
        </button>
      </div>
    </div>
  )
}

export function CreateWebhookForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tw = t.formsTenantIntegration.webhooks
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '')
    const url = String(fd.get('url') ?? '')
    const events = fd.getAll('events').map((v) => String(v))

    startTransition(async () => {
      const r = await createTenantWebhook({ tenantSlug, name, url, events })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setResult({ id: r.data!.id, secret: r.data!.secret })
      router.refresh()
    })
  }

  if (result) {
    return (
      <OneTimeSecretBox
        title={tw.createSuccessTitle}
        secret={result.secret}
        onDone={() => {
          setResult(null)
          setOpen(false)
        }}
      />
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {tw.createButton}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="border-border space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="space-y-1">
        <label htmlFor="wh-name" className="block text-sm font-medium text-foreground">
          {tw.nameLabel}
        </label>
        <input
          id="wh-name"
          name="name"
          type="text"
          placeholder={tw.namePlaceholder}
          required
          disabled={pending}
          maxLength={80}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="wh-url" className="block text-sm font-medium text-foreground">
          {tw.urlLabel}
        </label>
        <input
          id="wh-url"
          name="url"
          type="url"
          placeholder={tw.urlPlaceholder}
          required
          disabled={pending}
          maxLength={2048}
          className={inputClass}
        />
        <p className="text-muted-foreground text-xs">
          {tw.urlHint}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-foreground">{tw.eventsLegend}</legend>
        <p className="text-muted-foreground text-xs">
          {tw.eventsHint}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WEBHOOK_EVENTS.map((ev) => (
            <label key={ev} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="events"
                value={ev}
                disabled={pending}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <span className="font-medium">{WEBHOOK_EVENT_LABELS[ev]}</span>
                <span className="text-muted-foreground block font-mono text-xs">{ev}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tw.submitPending : tw.submit}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground text-sm font-medium disabled:opacity-60"
        >
          {tw.cancel}
        </button>
      </div>
    </form>
  )
}

export function WebhookRowActions({
  webhook,
}: {
  webhook: { id: string; name: string; enabled: boolean }
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tw = t.formsTenantIntegration.webhooks
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rotated, setRotated] = useState<string | null>(null)

  function onToggle() {
    setError(null)
    startTransition(async () => {
      const r = await toggleTenantWebhook({
        webhookId: webhook.id,
        enabled: !webhook.enabled,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  function onRotate() {
    if (
      !window.confirm(
        tw.confirmRotate.replace('{name}', webhook.name),
      )
    )
      return
    setError(null)
    startTransition(async () => {
      const r = await rotateTenantWebhookSecret(webhook.id)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setRotated(r.data!.secret)
      router.refresh()
    })
  }

  function onDelete() {
    if (
      !window.confirm(
        tw.confirmDelete.replace('{name}', webhook.name),
      )
    )
      return
    setError(null)
    startTransition(async () => {
      const r = await revokeTenantWebhook(webhook.id)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  if (rotated) {
    return (
      <OneTimeSecretBox
        title={tw.rotateSecretNewTitle}
        secret={rotated}
        onDone={() => setRotated(null)}
      />
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          className="text-foreground inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {webhook.enabled ? tw.disable : tw.enable}
        </button>
        <button
          type="button"
          onClick={onRotate}
          disabled={pending}
          className="text-foreground inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {tw.rotateSecret}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="text-destructive inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
          {tw.delete}
        </button>
      </div>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
