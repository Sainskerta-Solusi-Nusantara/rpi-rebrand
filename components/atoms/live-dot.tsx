import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LiveDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'success' | 'warning' | 'destructive' | 'primary'
  label?: string
}

const sizeMap = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
} as const

const toneMap = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  primary: 'bg-primary',
} as const

export const LiveDot = React.forwardRef<HTMLSpanElement, LiveDotProps>(
  ({ className, size = 'md', tone = 'success', label = 'Live', ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={cn('relative inline-flex shrink-0', sizeMap[size], className)}
      {...props}
    >
      <span
        className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-70', toneMap[tone])}
        aria-hidden="true"
      />
      <span className={cn('relative inline-flex h-full w-full rounded-full', toneMap[tone])} aria-hidden="true" />
    </span>
  ),
)
LiveDot.displayName = 'LiveDot'
