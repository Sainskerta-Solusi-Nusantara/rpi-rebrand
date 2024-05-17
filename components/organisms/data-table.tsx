'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  /** Cell renderer; defaults to `String(row[key])`. */
  render?: (row: T) => React.ReactNode
  /** Accessor for filtering/sorting; defaults to `row[key]`. */
  accessor?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  className?: string
}

export interface DataTableBulkAction<T> {
  label: string
  onSelect: (rows: T[]) => void
  variant?: 'default' | 'destructive' | 'outline'
}

export interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[]
  rows: T[]
  pageSize?: number
  selectable?: boolean
  bulkActions?: DataTableBulkAction<T>[]
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  pageSize = 10,
  selectable = false,
  bulkActions = [],
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tidak ada data.',
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [selected, setSelected] = React.useState<Set<T['id']>>(new Set())

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      columns.some((col) => {
        const v = col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.key]
        return String(v ?? '').toLowerCase().includes(q)
      }),
    )
  }, [columns, rows, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleAll = () => {
    setSelected((cur) => {
      const next = new Set(cur)
      const allOnPage = pageRows.every((r) => next.has(r.id))
      if (allOnPage) pageRows.forEach((r) => next.delete(r.id))
      else pageRows.forEach((r) => next.add(r.id))
      return next
    })
  }

  const toggleOne = (id: T['id']) => {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedRows = rows.filter((r) => selected.has(r.id))

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <div className="min-w-[200px] flex-1">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
            aria-label="Cari"
          />
        </div>
        {selectable && selectedRows.length > 0 && bulkActions.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedRows.length} dipilih</span>
            {bulkActions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.variant ?? 'outline'}
                onClick={() => {
                  a.onSelect(selectedRows)
                  setSelected(new Set())
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              {selectable ? (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua"
                    checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-input accent-[var(--secondary)]"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-medium',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={String(row.id)} className="border-b border-border last:border-0 hover:bg-muted/40">
                {selectable ? (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Pilih baris ${row.id}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 rounded border-input accent-[var(--secondary)]"
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <p>
          {filtered.length === 0
            ? '0 hasil'
            : `Menampilkan ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} dari ${filtered.length}`}
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

export default DataTable
