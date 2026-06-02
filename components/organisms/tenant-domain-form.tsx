'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Copy, ShieldCheck, Trash2 } from 'lucide-react'
import {
  removeCustomDomain,
  setCustomDomain,
  verifyCustomDomain,
} from '@/lib/tenants/domain-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'

const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-60'

type Banner =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

type Initial = {
  customDomain: string | null
  hasToken: boolean
  verifiedAt: Date | null
  /** TXT record name to publish, computed server-side: `_rpi-verify.<domain>`. */
  recordName: string | null
  /** Token value (only ever rendered server-side from the DB, not echoed). */
  tokenPreview: string | null
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t } = useI18n()
  const td = t.formsTenantIntegration.domain
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => {})
      }}
      className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
      aria-label={label ? td.copyAriaLabel.replace('{label}', label) : td.copyAriaLabelDefault}
    >
      <Copy className="h-3 w-3" aria-hidden="true" />
      {copied ? td.copied : td.copy}
    </button>
  )
}

export function CustomDomainSetupForm({
  tenantSlug,
  initial,
}: {
  tenantSlug: string
  initial: Initial
}) {
  const router = useRouter()
  const { t } = useI18n()
  const td = t.formsTenantIntegration.domain
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [domain, setDomain] = useState(initial.customDomain ?? '')

  const isVerified = Boolean(initial.verifiedAt)
  const needsVerify =
    Boolean(initial.customDomain) && initial.hasToken && !isVerified
  const recordName = initial.recordName
  const tokenPreview = initial.tokenPreview

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    const value = domain.trim()
    if (!value) {
      setBanner({ kind: 'error', message: td.errorDomainRequired })
      return
    }
    startTransition(async () => {
      const r = await setCustomDomain({ tenantSlug, domain: value })
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setBanner({
        kind: 'success',
        message: td.successDomainSaved,
      })
      router.refresh()
    })
  }

  function onVerify() {
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await verifyCustomDomain(tenantSlug)
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setBanner({
        kind: 'success',
        message: r.data?.bypass ? td.successBypass : td.successVerified,
      })
      router.refresh()
    })
  }

  function onRemove() {
    if (!window.confirm(td.confirmRemove)) return
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await removeCustomDomain(tenantSlug)
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setDomain('')
      setBanner({ kind: 'success', message: td.successRemoved })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="td-domain"
            className="block text-sm font-medium text-foreground"
          >
            {td.domainLabel}
          </label>
          <input
            id="td-domain"
            name="domain"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={td.domainPlaceholder}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={pending}
            className={`${inputClass} font-mono`}
          />
          <p className="text-muted-foreground text-xs">
            {td.domainHint}
          </p>
        </div>

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
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {banner.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? td.savePending : td.save}
          </button>
        </div>
      </form>

      {isVerified && initial.verifiedAt && (
        <div className="border-success/30 bg-success/10 space-y-3 rounded-md border p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2
              className="text-success mt-0.5 h-5 w-5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">
                {td.verifiedLabel}
              </p>
              <p className="text-muted-foreground text-xs">
                {td.verifiedAt.replace('{date}', dateFmt.format(new Date(initial.verifiedAt)))}
              </p>
            </div>
            <span className="bg-success/20 text-success rounded-full px-2 py-0.5 text-xs font-medium">
              {td.activeTag}
            </span>
          </div>
          <div>
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className={btnDanger}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {pending ? td.removePending : td.removeButton}
            </button>
          </div>
        </div>
      )}

      {needsVerify && recordName && tokenPreview && (
        <div className="border-border bg-card space-y-4 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h3 className="font-heading text-sm">{td.dnsVerifyHeading}</h3>
          </div>
          <p className="text-muted-foreground text-xs">
            {td.dnsVerifyHint}
          </p>

          <div className="border-border overflow-hidden rounded-md border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{td.tableType}</th>
                  <th className="px-3 py-2 font-medium">{td.tableNameHost}</th>
                  <th className="px-3 py-2 font-medium">{td.tableValue}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-border border-t">
                  <td className="px-3 py-2 font-mono">TXT</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <code className="break-all font-mono">{recordName}</code>
                      <CopyButton value={recordName} label="nama record" />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <code className="break-all font-mono">{tokenPreview}</code>
                      <CopyButton value={tokenPreview} label="nilai record" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onVerify}
              disabled={pending}
              className={btnSecondary}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {pending ? td.checkVerifyPending : td.checkVerify}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className="text-muted-foreground hover:text-foreground text-xs font-medium disabled:opacity-60"
            >
              {td.cancelAndRemove}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
