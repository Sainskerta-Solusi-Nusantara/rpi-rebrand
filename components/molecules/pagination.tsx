'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { cn } from '@/lib/utils'

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number
  pageCount: number
  pageSize?: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  siblingCount?: number
  showPageSize?: boolean
}

function pageNumbers(current: number, total: number, sibling: number): (number | 'ellipsis')[] {
  const range: (number | 'ellipsis')[] = []
  const first = 1
  const last = total
  if (total <= 7 + sibling * 2) {
    for (let i = 1; i <= total; i++) range.push(i)
    return range
  }
  const leftSibling = Math.max(current - sibling, first + 1)
  const rightSibling = Math.min(current + sibling, last - 1)
  range.push(first)
  if (leftSibling > first + 1) range.push('ellipsis')
  for (let i = leftSibling; i <= rightSibling; i++) range.push(i)
  if (rightSibling < last - 1) range.push('ellipsis')
  range.push(last)
  return range
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      page,
      pageCount,
      pageSize,
      pageSizeOptions = [10, 20, 50, 100],
      onPageChange,
      onPageSizeChange,
      siblingCount = 1,
      showPageSize = true,
      ...props
    },
    ref,
  ) => {
    const pages = pageNumbers(page, pageCount, siblingCount)

    return (
      <nav
        ref={ref}
        aria-label="Paginasi"
        className={cn('flex flex-wrap items-center justify-between gap-3', className)}
        {...props}
      >
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`e${idx}`} aria-hidden="true" className="px-2 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant={p === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Halaman ${p}`}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {showPageSize && pageSize != null && onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Per halaman</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </nav>
    )
  },
)
Pagination.displayName = 'Pagination'
