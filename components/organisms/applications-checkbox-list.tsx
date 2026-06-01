'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ApplicationStatus } from '@prisma/client'
import {
  ApplicationsBulkToolbar,
  type BulkTemplateOption,
  type BulkMemberOption,
} from './applications-bulk-toolbar'
import { ApplicationStatusSelect } from './application-status-form'
import { ApplicationScreeningBadge } from './application-screening-badge'

export type ApplicationRow = {
  id: string
  status: ApplicationStatus
  appliedAt: string // ISO – serialized for client transfer
  updatedAt: string
  aiScore: number | null
  aiTags: string[]
  user: { id: string; name: string | null; email: string; image: string | null }
  job: { id: string; title: string; slug: string }
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Dilamar',
  REVIEWED: 'Ditinjau',
  SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Wawancara',
  OFFERED: 'Penawaran',
  HIRED: 'Diterima',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Dibatalkan',
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-slate-100 text-slate-800',
  REVIEWED: 'bg-sky-100 text-sky-800',
  SHORTLISTED: 'bg-indigo-100 text-indigo-800',
  INTERVIEW: 'bg-violet-100 text-violet-800',
  OFFERED: 'bg-amber-100 text-amber-800',
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-zinc-100 text-zinc-800',
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Client wrapper for the recruiter applications table.
 *
 * Owns: checkbox column + per-row + select-all selection state, plus the
 * sticky bulk-action toolbar. Renders the rows inline (vs. server-rendered)
 * because mixing server-rendered <tr> children with client-owned selection
 * state requires bouncing through `cloneElement` across the RSC boundary —
 * not feasible. Rows include the existing status-select dropdown for
 * recruiters who still want inline edits.
 */
export function ApplicationsCheckboxList({
  tenantSlug,
  rows,
  statusOptions,
  availableStatuses,
  availableTemplates,
  availableReviewers,
  canManage,
}: {
  tenantSlug: string
  rows: ApplicationRow[]
  /** Options surfaced inside the per-row inline select. */
  statusOptions: Array<{ value: string; label: string }>
  /** Options surfaced inside the bulk-toolbar "Ubah status" dropdown. */
  availableStatuses: Array<{ value: ApplicationStatus; label: string }>
  availableTemplates: BulkTemplateOption[]
  availableReviewers: BulkMemberOption[]
  canManage: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows])
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someSelected =
    !allSelected && visibleIds.some((id) => selected.has(id))

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of visibleIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <ApplicationsBulkToolbar
          tenantSlug={tenantSlug}
          selectedIds={Array.from(selected)}
          onClear={() => setSelected(new Set())}
          availableStatuses={availableStatuses}
          availableTemplates={availableTemplates}
          availableReviewers={availableReviewers}
        />
      )}

      <div className="border-border bg-card overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              {canManage && (
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua di halaman ini"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="text-primary focus:ring-ring/30 rounded border-input"
                  />
                </th>
              )}
              <th className="p-3 font-medium">Pelamar</th>
              <th className="p-3 font-medium">Lowongan</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Dilamar</th>
              <th className="p-3 font-medium">AI Score</th>
              <th className="p-3 font-medium">Diperbarui</th>
              <th className="p-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => {
              const checked = selected.has(row.id)
              const tone = STATUS_TONE[row.status]
              return (
                <tr
                  key={row.id}
                  className={checked ? 'bg-primary/5' : undefined}
                >
                  {canManage && (
                    <td className="p-3 align-top">
                      <input
                        type="checkbox"
                        aria-label="Pilih lamaran"
                        checked={checked}
                        onChange={(e) => toggleOne(row.id, e.target.checked)}
                        className="text-primary focus:ring-ring/30 rounded border-input"
                      />
                    </td>
                  )}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {row.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.user.image}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="bg-muted size-8 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium">
                          {row.user.name ?? row.user.email}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {row.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={
                        `/dashboard/tenants/${tenantSlug}/jobs/${row.job.id}` as any
                      }
                      className="text-foreground hover:underline"
                    >
                      {row.job.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    {canManage ? (
                      <ApplicationStatusSelect
                        applicationId={row.id}
                        current={row.status}
                        options={statusOptions}
                      />
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
                      >
                        {STATUS_LABELS[row.status]}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs">
                    {dateFmt.format(new Date(row.appliedAt))}
                  </td>
                  <td className="p-3">
                    <ApplicationScreeningBadge
                      score={row.aiScore}
                      tags={row.aiTags}
                      compact
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs">
                    {dateFmt.format(new Date(row.updatedAt))}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={
                        `/dashboard/tenants/${tenantSlug}/lamaran/${row.id}` as any
                      }
                      className="text-foreground text-xs font-medium hover:underline"
                    >
                      Tampilkan detail
                    </Link>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  className="text-muted-foreground p-6 text-center"
                  colSpan={canManage ? 8 : 7}
                >
                  Belum ada lamaran yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
