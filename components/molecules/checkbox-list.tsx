'use client'

import * as React from 'react'
import { Checkbox } from '@/components/atoms/checkbox'
import { cn } from '@/lib/utils'

export interface CheckboxListOption {
  value: string
  label: React.ReactNode
  count?: number
  disabled?: boolean
}

export interface CheckboxListProps {
  options: CheckboxListOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (next: string[]) => void
  className?: string
  legend?: React.ReactNode
  emptyText?: React.ReactNode
}

export const CheckboxList = React.forwardRef<HTMLFieldSetElement, CheckboxListProps>(
  ({ options, value, defaultValue, onChange, className, legend, emptyText = 'Tidak ada opsi' }, ref) => {
    const [internal, setInternal] = React.useState<string[]>(defaultValue ?? [])
    const current = value ?? internal

    const toggle = (v: string, checked: boolean) => {
      const next = checked ? [...current, v] : current.filter((x) => x !== v)
      if (value === undefined) setInternal(next)
      onChange?.(next)
    }

    return (
      <fieldset ref={ref} className={cn('flex flex-col gap-2', className)}>
        {legend && (
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {legend}
          </legend>
        )}
        {options.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
        {options.map((opt) => {
          const id = `chk-${opt.value}`
          const checked = current.includes(opt.value)
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted/50',
                opt.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  disabled={opt.disabled}
                  onCheckedChange={(c) => toggle(opt.value, Boolean(c))}
                />
                <span className="text-foreground">{opt.label}</span>
              </span>
              {opt.count != null && (
                <span className="text-xs tabular-nums text-muted-foreground">{opt.count}</span>
              )}
            </label>
          )
        })}
      </fieldset>
    )
  },
)
CheckboxList.displayName = 'CheckboxList'
