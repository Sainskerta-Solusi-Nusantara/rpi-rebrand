import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  label?: React.ReactNode
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', label, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn('mx-2 h-full w-px bg-border', className)}
          {...props}
        />
      )
    }
    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn('relative flex items-center py-2', className)}
          {...props}
        >
          <span className="h-px flex-1 bg-border" />
          <span className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )
    }
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn('my-2 h-px w-full bg-border', className)}
        {...props}
      />
    )
  },
)
Divider.displayName = 'Divider'
