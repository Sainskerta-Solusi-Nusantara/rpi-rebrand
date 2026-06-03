'use client'

import { inputClass, btnPrimary } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Plus, Trash2 } from 'lucide-react'
import {
  createTenantApiKey,
  revokeTenantApiKey,
} from '@/lib/tenants/api-key-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'



type CreateResult = { plain: string; prefix: string; expiresAt: string | null } | null

export function CreateTenantApiKeyForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tk = t.formsTenantIntegration.tenantApiKeys
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult>(null)
  const [copied, setCopied] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setCopied(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await createTenantApiKey({ tenantSlug, values: fd })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setResult({
        plain: r.data!.plain,
        prefix: r.data!.prefix,
        expiresAt: r.data!.expiresAt
          ? new Date(r.data!.expiresAt).toISOString()
          : null,
      })
      router.refresh()
    })
  }

  if (result) {
    return (
      <div className="space-y-4 rounded-md border border-success/30 bg-success/10 p-4">
        <p className="text-sm font-medium text-foreground">{tk.createSuccessTitle}</p>
        <p className="text-muted-foreground text-xs">
          {tk.createSuccessHint}
        </p>
        <div className="bg-background border-border rounded-md border p-3">
          <code className="block break-all font-mono text-xs">{result.plain}</code>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard
                ?.writeText(result.plain)
                .then(() => setCopied(true))
                .catch(() => {})
            }}
            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            {copied ? tk.copied : tk.copyToClipboard}
          </button>
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setOpen(false)
              setCopied(false)
            }}
            className="text-muted-foreground hover:text-foreground ml-auto text-xs"
          >
            {tk.done}
          </button>
        </div>
        {result.expiresAt && (
          <p className="text-muted-foreground text-xs">
            {tk.expiresAt.replace('{date}', new Date(result.expiresAt).toLocaleString('id-ID'))}
          </p>
        )}
      </div>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {tk.createButton}
      </button>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border space-y-4 rounded-md border bg-muted/30 p-4"
    >
      <div className="space-y-1">
        <label htmlFor="tkey-name" className="block text-sm font-medium text-foreground">
          {tk.nameLabel}
        </label>
        <input
          id="tkey-name"
          name="name"
          type="text"
          placeholder={tk.namePlaceholder}
          required
          disabled={pending}
          maxLength={80}
          className={inputClass}
        />
        <p className="text-muted-foreground text-xs">
          {tk.nameHint}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-foreground">{tk.scopesLegend}</legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="scopes"
            value="read"
            defaultChecked
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            <span className="font-medium">read</span>
            <span className="text-muted-foreground"> {tk.scopeReadDesc}</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="scopes"
            value="write"
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            <span className="font-medium">write</span>
            <span className="text-muted-foreground"> {tk.scopeWriteDesc}</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="scopes"
            value="admin"
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            <span className="font-medium">admin</span>
            <span className="text-muted-foreground"> {tk.scopeAdminDesc}</span>
          </span>
        </label>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="tkey-expiry" className="block text-sm font-medium text-foreground">
          {tk.expiryLabel}
        </label>
        <select
          id="tkey-expiry"
          name="expiry"
          defaultValue="90d"
          disabled={pending}
          className={inputClass}
        >
          <option value="30d">{tk.expiry30d}</option>
          <option value="90d">{tk.expiry90d}</option>
          <option value="180d">{tk.expiry180d}</option>
          <option value="365d">{tk.expiry365d}</option>
          <option value="none">{tk.expiryNone}</option>
        </select>
      </div>

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
          {pending ? tk.submitPending : tk.submit}
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
          {tk.cancel}
        </button>
      </div>
    </form>
  )
}

export function RevokeTenantApiKeyButton({
  keyId,
  keyName,
}: {
  keyId: string
  keyName: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tk = t.formsTenantIntegration.tenantApiKeys
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!window.confirm(tk.confirmRevoke.replace('{name}', keyName))) return
    setError(null)
    startTransition(async () => {
      const r = await revokeTenantApiKey(keyId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-destructive inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
        {pending ? tk.revokePending : tk.revoke}
      </button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
