'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { GlobalRole, UserStatus } from '@prisma/client'
import { updateUserRole, updateUserStatus } from '@/lib/admin/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const ROLE_OPTIONS: { value: GlobalRole; label: string }[] = [
  { value: 'SUPERADMIN', label: 'SUPERADMIN' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'PARTNER', label: 'PARTNER' },
  { value: 'USER', label: 'USER' },
]

type Banner = { kind: 'idle' } | { kind: 'success'; message: string } | { kind: 'error'; message: string }

export function AdminUserActions({
  userId,
  currentRole,
  currentStatus,
  canChangeRole,
  canChangeStatus,
  isSelf,
}: {
  userId: string
  currentRole: GlobalRole
  currentStatus: UserStatus
  canChangeRole: boolean
  canChangeStatus: boolean
  isSelf: boolean
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tr = t.formsActions.userActions
  const [pending, startTransition] = useTransition()
  const [role, setRole] = useState<GlobalRole>(currentRole)
  const [status, setStatus] = useState<UserStatus>(currentStatus)
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })

  function onRoleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await updateUserRole({ userId, role })
      if (r.ok) {
        setBanner({ kind: 'success', message: tr.roleUpdated })
        router.refresh()
      } else {
        setBanner({ kind: 'error', message: r.error })
      }
    })
  }

  function onStatusSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await updateUserStatus({ userId, status })
      if (r.ok) {
        setBanner({ kind: 'success', message: tr.statusUpdated })
        router.refresh()
      } else {
        setBanner({ kind: 'error', message: r.error })
      }
    })
  }

  const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
    { value: 'ACTIVE', label: tr.statusActive },
    { value: 'PENDING', label: tr.statusPending },
    { value: 'SUSPENDED', label: tr.statusSuspended },
    { value: 'DELETED', label: tr.statusDeleted },
  ]

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

      <form onSubmit={onRoleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          {tr.roleLabel}
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as GlobalRole)}
          disabled={!canChangeRole || pending || isSelf}
          className={inputClass}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!canChangeRole && (
          <p className="text-xs text-muted-foreground">
            {tr.roleOnlySuperadmin}
          </p>
        )}
        {isSelf && (
          <p className="text-xs text-muted-foreground">
            {tr.roleSelfWarning}
          </p>
        )}
        <button
          type="submit"
          disabled={!canChangeRole || pending || isSelf || role === currentRole}
          className={btnClass}
        >
          {pending ? tr.btnPending : tr.btnSaveRole}
        </button>
      </form>

      <form onSubmit={onStatusSubmit} className="space-y-3 border-t border-border pt-6">
        <label className="block text-sm font-medium text-foreground">{tr.statusLabel}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as UserStatus)}
          disabled={!canChangeStatus || pending || isSelf}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {isSelf && (
          <p className="text-xs text-muted-foreground">
            {tr.statusSelfWarning}
          </p>
        )}
        <button
          type="submit"
          disabled={!canChangeStatus || pending || isSelf || status === currentStatus}
          className={btnClass}
        >
          {pending ? tr.btnPending : tr.btnSaveStatus}
        </button>
      </form>
    </div>
  )
}
