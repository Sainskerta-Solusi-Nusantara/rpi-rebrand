'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addOverride, removeOverride } from '@/lib/feature-flags/flag-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

export type OverrideRowProps = {
  id: string
  userId: string | null
  tenantId: string | null
  value: boolean
  reason: string | null
  user: { id: string; name: string | null; email: string | null } | null
  tenant: { id: string; name: string; slug: string } | null
  createdAt: Date
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function FeatureFlagOverridesTable({
  flagId,
  overrides,
}: {
  flagId: string
  overrides: OverrideRowProps[]
}) {
  return (
    <div className="space-y-6">
      <AddOverrideForm flagId={flagId} />
      <OverridesTable overrides={overrides} />
    </div>
  )
}

function AddOverrideForm({ flagId }: { flagId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [scope, setScope] = useState<'user' | 'tenant' | 'both'>('user')

  function onSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    formData.set('scope', scope)
    if (!formData.get('value')) formData.set('value', '')
    startTransition(async () => {
      const result = await addOverride(flagId, formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <form
      action={onSubmit}
      className="border-border bg-card space-y-4 rounded-2xl border p-4"
      aria-label="Tambah override"
    >
      <h3 className="font-heading text-base">Tambah override</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium">Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'user' | 'tenant' | 'both')}
            className={inputClass}
          >
            <option value="user">Override pengguna</option>
            <option value="tenant">Override tenant</option>
            <option value="both">Pengguna + tenant</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium" htmlFor="userId">
            userId
          </label>
          <input
            id="userId"
            name="userId"
            type="text"
            placeholder={scope === 'tenant' ? '(tidak dipakai)' : 'cuid pengguna'}
            disabled={scope === 'tenant'}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium" htmlFor="tenantId">
            tenantId
          </label>
          <input
            id="tenantId"
            name="tenantId"
            type="text"
            placeholder={scope === 'user' ? '(tidak dipakai)' : 'cuid tenant'}
            disabled={scope === 'user'}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="value" className="size-4 rounded border-input" />
          Nilai = true (Aktif)
        </label>
        <input
          name="reason"
          type="text"
          maxLength={500}
          placeholder="Alasan (opsional)"
          className={inputClass}
        />
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
          Override tersimpan.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? 'Menyimpan…' : 'Tambah override'}
      </button>
    </form>
  )
}

function OverridesTable({ overrides }: { overrides: OverrideRowProps[] }) {
  if (overrides.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Belum ada override.</p>
    )
  }
  return (
    <div className="border-border overflow-x-auto rounded-2xl border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Scope</th>
            <th className="p-3 font-medium">Pengguna</th>
            <th className="p-3 font-medium">Tenant</th>
            <th className="p-3 font-medium">Nilai</th>
            <th className="p-3 font-medium">Alasan</th>
            <th className="p-3 font-medium">Dibuat</th>
            <th className="p-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {overrides.map((o) => {
            const scope = o.userId && o.tenantId ? 'Pengguna + tenant' : o.userId ? 'Pengguna' : 'Tenant'
            return (
              <tr key={o.id}>
                <td className="p-3 text-xs">{scope}</td>
                <td className="p-3 text-xs">
                  {o.user ? o.user.name ?? o.user.email ?? o.user.id : o.userId ?? '—'}
                </td>
                <td className="p-3 text-xs">
                  {o.tenant ? o.tenant.name : o.tenantId ?? '—'}
                </td>
                <td className="p-3 text-xs">
                  {o.value ? (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">
                      Aktif
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground rounded px-2 py-0.5">
                      Nonaktif
                    </span>
                  )}
                </td>
                <td className="text-muted-foreground p-3 text-xs">{o.reason ?? '—'}</td>
                <td className="text-muted-foreground p-3 text-xs">{formatDate(o.createdAt)}</td>
                <td className="p-3 text-right">
                  <RemoveOverrideButton id={o.id} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RemoveOverrideButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!confirm('Hapus override ini?')) return
    setError(null)
    startTransition(async () => {
      const result = await removeOverride(id)
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
        {isPending ? 'Menghapus…' : 'Hapus override'}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
