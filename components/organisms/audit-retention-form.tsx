'use client'

import { inputClassBare as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  upsertRetentionPolicy,
  deleteRetentionPolicy,
  previewRetentionImpact,
} from '@/lib/audit/retention-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export const RESOURCE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '*', label: '* (semua sumber daya)' },
  { value: 'login', label: 'login' },
  { value: 'login.failed', label: 'login.failed' },
  { value: 'login.success', label: 'login.success' },
  { value: 'application.message', label: 'application.message' },
  { value: 'application.submitted', label: 'application.submitted' },
  { value: 'application.status.changed', label: 'application.status.changed' },
  { value: 'interview.scheduled', label: 'interview.scheduled' },
  { value: 'interview.canceled', label: 'interview.canceled' },
  { value: 'tenant.invited', label: 'tenant.invited' },
  { value: 'tenant.member.removed', label: 'tenant.member.removed' },
  { value: 'billing.checkout.started', label: 'billing.checkout.started' },
  { value: 'billing.subscription.updated', label: 'billing.subscription.updated' },
  { value: 'course.published', label: 'course.published' },
  { value: 'audit.export', label: 'audit.export' },
  { value: 'data.export', label: 'data.export' },
]

export type RetentionFormDefaults = {
  id?: string
  resourceType?: string
  retentionDays?: number
  archiveEnabled?: boolean
}

export function AuditRetentionForm({
  scope,
  tenantId,
  defaults,
  submitLabel,
}: {
  scope: 'global' | 'tenant'
  tenantId?: string
  defaults?: RetentionFormDefaults
  submitLabel?: string
}) {
  const { t } = useI18n()
  const ns = t.formsTenantAdmin2.auditRetentionForm
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const RETENTION_DAY_OPTIONS: { value: number; label: string }[] = [
    { value: 90, label: ns.retentionDay90 },
    { value: 180, label: ns.retentionDay180 },
    { value: 365, label: ns.retentionDay365 },
    { value: 730, label: ns.retentionDay730 },
    { value: 1825, label: ns.retentionDay1825 },
    { value: 0, label: ns.retentionDayForever },
  ]

  const resolvedResourceOptions = RESOURCE_TYPE_OPTIONS.map((o) =>
    o.value === '*' ? { ...o, label: ns.resourceTypeAll } : o,
  )

  function onSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    if (defaults?.id) formData.set('id', defaults.id)
    formData.set('scope', scope)
    if (tenantId) formData.set('tenantId', tenantId)
    if (!formData.get('archiveEnabled')) formData.set('archiveEnabled', '')

    startTransition(async () => {
      const result = await upsertRetentionPolicy(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }


  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="resourceType" className="block text-sm font-medium text-foreground">
          {ns.labelResourceType}
        </label>
        <select
          id="resourceType"
          name="resourceType"
          defaultValue={defaults?.resourceType ?? '*'}
          required
          className={inputClass}
        >
          {resolvedResourceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-foreground">
          {ns.legendRetentionDays}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RETENTION_DAY_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="border-border bg-background hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="retentionDays"
                value={o.value}
                defaultChecked={
                  (defaults?.retentionDays ?? 365) === o.value
                }
                required
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="archiveEnabled"
          name="archiveEnabled"
          defaultChecked={defaults?.archiveEnabled ?? false}
          className="size-4 rounded border-input"
        />
        <label htmlFor="archiveEnabled" className="text-sm">
          {ns.labelArchiveEnabled}
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {ns.successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? ns.btnPending : (submitLabel ?? ns.defaultSubmitLabel)}
      </button>
    </form>
  )
}

export function DeleteRetentionPolicyButton({ id }: { id: string }) {
  const { t } = useI18n()
  const ns = t.formsTenantAdmin2.auditRetentionForm
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!confirm(ns.deleteConfirm)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteRetentionPolicy(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium disabled:opacity-60"
      >
        {isPending ? ns.deletePending : ns.deleteBtn}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}

export function PreviewImpactButton({ tenantId }: { tenantId: string }) {
  const { t } = useI18n()
  const ns = t.formsTenantAdmin2.auditRetentionForm
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<
    {
      resourceType: string
      currentCount: number
      willDeleteCount: number
      willArchiveCount: number
      retentionDays: number
    }[]
    | null
  >(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const result = await previewRetentionImpact(tenantId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setRows(result.data)
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="border-border bg-background hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? ns.previewPending : ns.previewBtn}
      </button>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {rows && (
        <div className="border-border overflow-x-auto rounded-2xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">{ns.thResourceType}</th>
                <th className="p-3 font-medium">{ns.thRetentionDays}</th>
                <th className="p-3 font-medium text-right">{ns.thCurrentCount}</th>
                <th className="p-3 font-medium text-right">{ns.thWillDelete}</th>
                <th className="p-3 font-medium text-right">{ns.thWillArchive}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((r) => (
                <tr key={r.resourceType}>
                  <td className="p-3 font-mono text-xs">{r.resourceType}</td>
                  <td className="p-3 text-xs">
                    {r.retentionDays === 0
                      ? ns.retentionForever
                      : ns.retentionDays.replace('{n}', String(r.retentionDays))}
                  </td>
                  <td className="p-3 text-right text-xs tabular-nums">
                    {r.currentCount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right text-xs tabular-nums">
                    {r.willDeleteCount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right text-xs tabular-nums">
                    {r.willArchiveCount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="text-muted-foreground p-6 text-center" colSpan={5}>
                    {ns.emptyPolicies}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
