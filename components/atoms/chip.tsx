'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-foreground',
        primary: 'border-primary/20 bg-primary/10 text-primary',
        secondary: 'border-secondary/30 bg-secondary/15 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void
  removable?: boolean
  removeLabel?: string
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, onRemove, removable = true, removeLabel = 'Hapus', children, ...props }, ref) => (
    <span ref={ref} className={cn(chipVariants({ variant }), className)} {...props}>
      <span className="truncate">{children}</span>
      {onRemove && removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  ),
)
Chip.displayName = 'Chip'

export { chipVariants }
