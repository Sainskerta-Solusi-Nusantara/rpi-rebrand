'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanTier, TenantStatus } from '@prisma/client'
import { updateTenantPlan, updateTenantStatus } from '@/lib/admin/actions'

const STATUS_OPTIONS: { value: TenantStatus; label: string }[] = [
  { value: 'PROVISIONING', label: 'Provisioning' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'SUSPENDED', label: 'Ditangguhkan' },
]

const PLAN_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: 'FREE', label: 'Gratis' },
  { value: 'PRO', label: 'Pro' },
  { value: 'BUSINESS', label: 'Bisnis' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

type Banner = { kind: 'idle' } | { kind: 'success'; message: string } | { kind: 'error'; message: string }

export function AdminTenantActions({
  tenantId,
  currentStatus,
  currentPlan,
}: {
  tenantId: string
  currentStatus: TenantStatus
  currentPlan: PlanTier
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<TenantStatus>(currentStatus)
  const [plan, setPlan] = useState<PlanTier>(currentPlan)
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })

  function onStatusSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await updateTenantStatus({ tenantId, status })
      if (r.ok) {
        setBanner({ kind: 'success', message: 'Status tenant diperbarui.' })
        router.refresh()
      } else {
        setBanner({ kind: 'error', message: r.error })
      }
    })
  }

  function onPlanSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await updateTenantPlan({ tenantId, plan })
      if (r.ok) {
        setBanner({ kind: 'success', message: 'Paket tenant diperbarui.' })
        router.refresh()
      } else {
        setBanner({ kind: 'error', message: r.error })
      }
    })
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'
  const btnClass =
    'inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="space-y-6">
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

      <form onSubmit={onStatusSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TenantStatus)}
          disabled={pending}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending || status === currentStatus}
          className={btnClass}
        >
          {pending ? 'Menyimpan…' : 'Simpan status'}
        </button>
      </form>

      <form onSubmit={onPlanSubmit} className="space-y-3 border-t border-border pt-6">
        <label className="block text-sm font-medium text-foreground">Paket</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanTier)}
          disabled={pending}
          className={inputClass}
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending || plan === currentPlan}
          className={btnClass}
        >
          {pending ? 'Menyimpan…' : 'Simpan paket'}
        </button>
      </form>
    </div>
  )
}
