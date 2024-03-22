'use client'

import * as React from 'react'
import { Input } from '@/components/atoms/input'
import { ColorSwatch } from '@/components/atoms/color-swatch'
import { cn } from '@/lib/utils'

export interface ColorPickerProps {
  value: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

function normalizeHex(input: string): string {
  let v = input.trim()
  if (!v.startsWith('#')) v = `#${v}`
  return v
}

function isValidHex(v: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(v)
}

export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ className, value, defaultValue, onChange, disabled, id, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue ?? '#0F2A4A')
    const current = value ?? internal
    const [draft, setDraft] = React.useState(current)

    React.useEffect(() => {
      setDraft(current)
    }, [current])

    const commit = (next: string) => {
      const normalized = normalizeHex(next)
      if (!isValidHex(normalized)) return
      if (value === undefined) setInternal(normalized)
      onChange?.(normalized)
    }

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <label
          className={cn(
            'relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className="sr-only">{props['aria-label'] ?? 'Pilih warna'}</span>
          <input
            id={id}
            type="color"
            value={isValidHex(current) ? current.slice(0, 7) : '#000000'}
            disabled={disabled}
            onChange={(e) => commit(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0 opacity-0"
            aria-label={props['aria-label']}
          />
          <ColorSwatch color={current} size="md" className="pointer-events-none border-0" />
        </label>
        <Input
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(draft)
            }
          }}
          spellCheck={false}
          className="font-mono uppercase"
          aria-label="Nilai heksadesimal warna"
        />
      </div>
    )
  },
)
ColorPicker.displayName = 'ColorPicker'
