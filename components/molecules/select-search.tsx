'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectSearchOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SelectSearchProps {
  options: SelectSearchOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: React.ReactNode
  disabled?: boolean
  className?: string
  contentClassName?: string
  id?: string
  'aria-label'?: string
}

export const SelectSearch = React.forwardRef<HTMLButtonElement, SelectSearchProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = 'Pilih...',
      searchPlaceholder = 'Cari...',
      emptyText = 'Tidak ada hasil',
      disabled,
      className,
      contentClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false)
    const [internal, setInternal] = React.useState(defaultValue ?? '')
    const [query, setQuery] = React.useState('')
    const current = value ?? internal

    const selected = options.find((o) => o.value === current)
    const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase()
      if (!q) return options
      return options.filter(
        (o) => o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false),
      )
    }, [options, query])

    const select = (v: string) => {
      if (value === undefined) setInternal(v)
      onChange?.(v)
      setOpen(false)
      setQuery('')
    }

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label={props['aria-label']}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={6}
            align="start"
            className={cn(
              'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-border bg-background p-0 text-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              contentClassName,
            )}
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                autoFocus
              />
            </div>
            <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 && (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
              )}
              {filtered.map((o) => (
                <li key={o.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === current}
                    disabled={o.disabled}
                    onClick={() => select(o.value)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-muted focus:bg-muted disabled:pointer-events-none disabled:opacity-50',
                      o.value === current && 'bg-muted',
                    )}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        o.value === current ? 'opacity-100 text-primary' : 'opacity-0',
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.label}</span>
                      {o.description && (
                        <span className="block truncate text-xs text-muted-foreground">{o.description}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  },
)
SelectSearch.displayName = 'SelectSearch'
