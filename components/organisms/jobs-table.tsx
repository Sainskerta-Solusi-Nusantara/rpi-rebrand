'use client'

import * as React from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/atoms/badge'
import { cn, formatDate } from '@/lib/utils'

export type JobsTableStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'DRAFT'

export interface JobsTableRow {
  id: string
  position: string
  department?: string
  applicants: number
  status: JobsTableStatus
  postedAt: string | Date
}

export interface JobsTableProps {
  rows: JobsTableRow[]
  pageSize?: number
  onRowAction?: (row: JobsTableRow) => void
  className?: string
}

type SortKey = 'position' | 'applicants' | 'status' | 'postedAt'

const STATUS_VARIANTS: Record<JobsTableStatus, { label: string; tone: 'success' | 'warning' | 'muted' | 'destructive' }> = {
  ACTIVE: { label: 'Aktif', tone: 'success' },
  PAUSED: { label: 'Dijeda', tone: 'warning' },
  CLOSED: { label: 'Ditutup', tone: 'destructive' },
  DRAFT: { label: 'Draf', tone: 'muted' },
}

export function JobsTable({ rows, pageSize = 10, onRowAction, className }: JobsTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>('postedAt')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [page, setPage] = React.useState(1)

  const sorted = React.useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let av: number | string = ''
      let bv: number | string = ''
      if (sortKey === 'position') {
        av = a.position
        bv = b.position
      } else if (sortKey === 'applicants') {
        av = a.applicants
        bv = b.applicants
      } else if (sortKey === 'status') {
        av = a.status
        bv = b.status
      } else {
        av = new Date(a.postedAt).getTime()
        bv = new Date(b.postedAt).getTime()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <SortableTh label="Posisi" active={sortKey === 'position'} dir={sortDir} onClick={() => toggleSort('position')} />
              <SortableTh label="Pelamar" active={sortKey === 'applicants'} dir={sortDir} onClick={() => toggleSort('applicants')} />
              <SortableTh label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
              <SortableTh label="Diposting" active={sortKey === 'postedAt'} dir={sortDir} onClick={() => toggleSort('postedAt')} />
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const s = STATUS_VARIANTS[row.status]
              return (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.position}</p>
                    {row.department ? (
                      <p className="text-xs text-muted-foreground">{row.department}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.applicants}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(row.postedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRowAction?.(row)}
                      aria-label="Aksi"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Belum ada lowongan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <p>
          Menampilkan {(safePage - 1) * pageSize + 1}&ndash;
          {Math.min(safePage * pageSize, sorted.length)} dari {sorted.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground')}
      >
        {label}
        <ArrowUpDown className={cn('h-3 w-3 transition-transform', active && dir === 'desc' && 'rotate-180')} />
      </button>
    </th>
  )
}

export default JobsTable
