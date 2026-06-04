'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { TenantRole } from '@prisma/client'
import {
  leaveTenant,
  removeMember,
  transferOwnership,
  updateMemberRole,
} from '@/lib/tenants/actions'

const MEMBER_ROLES: { value: TenantRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'MEMBER', label: 'Member' },
]

const inputClass =
  'rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

/** Inline role-select + remove for a single tenant member row. */
export function MemberRowActions({
  tenantSlug,
  userId,
  currentRole,
  isOwner,
  isSelf,
  canUpdate,
  canRemove,
}: {
  tenantSlug: string
  userId: string
  currentRole: TenantRole
  isOwner: boolean
  isSelf: boolean
  canUpdate: boolean
  canRemove: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<TenantRole>(currentRole)

  const disableRole = isOwner || isSelf || !canUpdate || pending
  const disableRemove = isOwner || isSelf || !canRemove || pending

  function onRoleChange(next: TenantRole) {
    if (next === currentRole) return
    setRole(next)
    setError(null)
    startTransition(async () => {
      const r = await updateMemberRole({ tenantSlug, userId, role: next })
      if (!r.ok) {
        setError(r.error)
        setRole(currentRole)
        return
      }
      router.refresh()
    })
  }

  function onRemove() {
    if (!window.confirm('Keluarkan anggota ini dari tenant?')) return
    setError(null)
    startTransition(async () => {
      const r = await removeMember({ tenantSlug, userId })
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {isOwner ? (
          <span className="rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
            OWNER
          </span>
        ) : (
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as TenantRole)}
            disabled={disableRole}
            className={inputClass}
            aria-label="Peran anggota"
          >
            {MEMBER_ROLES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={disableRemove}
          className="text-destructive text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? '…' : 'Keluarkan'}
        </button>
      </div>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}

/** Self-leave button (refuses for OWNER). */
export function LeaveTenantButton({
  tenantSlug,
  disabled,
  disabledReason,
}: {
  tenantSlug: string
  disabled?: boolean
  disabledReason?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!window.confirm('Anda yakin ingin keluar dari tenant ini?')) return
    setError(null)
    startTransition(async () => {
      const r = await leaveTenant(tenantSlug)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.push('/dashboard/tenants')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Memproses…' : 'Keluar dari tenant'}
      </button>
      {disabled && disabledReason && (
        <p className="text-muted-foreground text-xs">{disabledReason}</p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/** Transfer ownership UI — picks a member as the new OWNER. */
export function TransferOwnershipForm({
  tenantSlug,
  candidates,
}: {
  tenantSlug: string
  candidates: { userId: string; label: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newOwnerUserId, setNewOwnerUserId] = useState<string>(candidates[0]?.userId ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newOwnerUserId) return
    if (
      !window.confirm(
        'Anda akan menjadi ADMIN dan kehilangan akses OWNER. Lanjutkan?',
      )
    ) {
      return
    }
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const r = await transferOwnership({ tenantSlug, newOwnerUserId })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSuccess('Kepemilikan berhasil ditransfer.')
      router.refresh()
    })
  }

  if (candidates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Tidak ada kandidat. Undang anggota lain dulu sebelum melakukan transfer.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="new-owner" className="block text-sm font-medium text-foreground">
        Calon OWNER baru
      </label>
      <select
        id="new-owner"
        value={newOwnerUserId}
        onChange={(e) => setNewOwnerUserId(e.target.value)}
        disabled={pending}
        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {candidates.map((c) => (
          <option key={c.userId} value={c.userId}>
            {c.label}
          </option>
        ))}
      </select>
      <p className="text-muted-foreground text-xs">
        Setelah transfer, Anda menjadi ADMIN. Hanya OWNER baru yang dapat
        mentransfer kembali ke Anda.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !newOwnerUserId}
        className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Mentransfer…' : 'Transfer kepemilikan'}
      </button>
    </form>
  )
}
