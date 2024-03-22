'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn, formatRupiah } from '@/lib/utils'

export interface PriceRangeSliderProps {
  min: number
  max: number
  step?: number
  value?: [number, number]
  defaultValue?: [number, number]
  onChange?: (value: [number, number]) => void
  onCommit?: (value: [number, number]) => void
  formatValue?: (value: number) => string
  className?: string
  disabled?: boolean
  ariaLabel?: { min?: string; max?: string }
}

export const PriceRangeSlider = React.forwardRef<HTMLSpanElement, PriceRangeSliderProps>(
  (
    {
      min,
      max,
      step = 100_000,
      value,
      defaultValue,
      onChange,
      onCommit,
      formatValue = (v) => formatRupiah(v),
      className,
      disabled,
      ariaLabel,
    },
    ref,
  ) => {
    const [internal, setInternal] = React.useState<[number, number]>(defaultValue ?? [min, max])
    const current = value ?? internal

    const set = (next: [number, number]) => {
      if (value === undefined) setInternal(next)
      onChange?.(next)
    }

    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <SliderPrimitive.Root
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          onValueChange={(v) => set([v[0] ?? min, v[1] ?? max])}
          onValueCommit={(v) => onCommit?.([v[0] ?? min, v[1] ?? max])}
          className="relative flex h-5 w-full touch-none select-none items-center"
          aria-label="Rentang harga"
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
            <SliderPrimitive.Range className="absolute h-full bg-secondary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-label={ariaLabel?.min ?? 'Harga minimum'}
            className="block h-5 w-5 rounded-full border-2 border-secondary bg-background shadow ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
          <SliderPrimitive.Thumb
            aria-label={ariaLabel?.max ?? 'Harga maksimum'}
            className="block h-5 w-5 rounded-full border-2 border-secondary bg-background shadow ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        </SliderPrimitive.Root>
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{formatValue(current[0])}</span>
          <span>{formatValue(current[1])}</span>
        </div>
      </div>
    )
  },
)
PriceRangeSlider.displayName = 'PriceRangeSlider'
