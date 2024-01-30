import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ColorSwatchProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  color: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
} as const

export const ColorSwatch = React.forwardRef<HTMLSpanElement, ColorSwatchProps>(
  ({ className, color, size = 'md', label, ...props }, ref) => (
    <span
      ref={ref}
      role="img"
      aria-label={label ?? `Warna ${color}`}
      className={cn(
        'inline-block rounded-md border border-border shadow-inner',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: color }}
      {...props}
    />
  ),
)
ColorSwatch.displayName = 'ColorSwatch'
