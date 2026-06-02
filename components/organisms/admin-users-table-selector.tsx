'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ShieldX } from 'lucide-react'
import type { GlobalRole, UserStatus } from '@prisma/client'
import { AdminBulkToolbar } from '@/components/organisms/admin-bulk-toolbar'
import { useI18n } from '@/lib/i18n/i18n-provider'

export type AdminUserRow = {
  id: string
  email: string
  name: string | null
  image: string | null
  globalRole: GlobalRole
  status: UserStatus
  emailVerified: Date | null
  createdAt: Date
  lastLoginAt: Date | null
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

export function AdminUsersTableSelector({ users }: { users: AdminUserRow[] }) {
  const { t } = useI18n()
  const tc = t.formsMisc2.adminUsersTable

  const statusLabels: Record<string, string> = {
    ACTIVE: tc.statusActive,
    PENDING: tc.statusPending,
    SUSPENDED: tc.statusSuspended,
    DELETED: tc.statusDeleted,
  }

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const pageIds = useMemo(() => users.map((u) => u.id), [users])
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someSelected =
    !allSelected && pageIds.some((id) => selected.has(id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of pageIds) next.delete(id)
      } else {
        for (const id of pageIds) next.add(id)
      }
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  return (
    <>
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  aria-label={tc.ariaSelectAll}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={toggleAll}
                  className="size-4 cursor-pointer rounded border-input"
                />
              </th>
              <th className="p-3">{tc.colUser}</th>
              <th className="p-3">{tc.colRole}</th>
              <th className="p-3">{tc.colStatus}</th>
              <th className="p-3">{tc.colVerified}</th>
              <th className="p-3">{tc.colRegistered}</th>
              <th className="p-3">{tc.colLastLogin}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {users.map((u) => {
              const isChecked = selected.has(u.id)
              return (
                <tr key={u.id} className={isChecked ? 'bg-muted/30' : undefined}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={tc.ariaSelectUser.replace('{name}', u.name ?? u.email)}
                      checked={isChecked}
                      onChange={() => toggleOne(u.id)}
                      className="size-4 cursor-pointer rounded border-input"
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/users/${u.id}` as never}
                      className="flex items-center gap-2 hover:underline"
                    >
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="bg-muted size-8 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium">{u.name ?? u.email}</div>
                        <div className="text-muted-foreground text-xs">{u.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3">{u.globalRole}</td>
                  <td className="p-3">{statusLabels[u.status] ?? u.status}</td>
                  <td className="p-3">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        {tc.verifiedYes}
                      </span>
                    ) : (
                      <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                        <ShieldX className="h-3 w-3" aria-hidden="true" />
                        {tc.verifiedNo}
                      </span>
                    )}
                  </td>
                  <td className="p-3">{dateFmt.format(u.createdAt)}</td>
                  <td className="p-3">
                    {u.lastLoginAt ? dateFmt.format(u.lastLoginAt) : '—'}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}` as never}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {tc.detailLink}
                    </Link>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={8}>
                  {tc.noUsers}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Spacer so sticky toolbar doesn't cover pagination */}
      {selectedIds.length > 0 ? <div className="h-24" aria-hidden="true" /> : null}

      <AdminBulkToolbar
        selectedIds={selectedIds}
        onClear={() => setSelected(new Set())}
      />
    </>
  )
}
