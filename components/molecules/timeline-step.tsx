import * as React from 'react'
import { Check, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TimelineStatus = 'pending' | 'current' | 'completed' | 'error'

export interface TimelineStepProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode
  description?: React.ReactNode
  status?: TimelineStatus
  isLast?: boolean
  index?: number
}

const statusStyles: Record<TimelineStatus, { node: string; line: string }> = {
  pending: {
    node: 'border-border bg-background text-muted-foreground',
    line: 'bg-border',
  },
  current: {
    node: 'border-secondary bg-secondary/15 text-secondary',
    line: 'bg-border',
  },
  completed: {
    node: 'border-success bg-success text-background',
    line: 'bg-success',
  },
  error: {
    node: 'border-destructive bg-destructive text-background',
    line: 'bg-destructive',
  },
}

export const TimelineStep = React.forwardRef<HTMLDivElement, TimelineStepProps>(
  ({ className, label, description, status = 'pending', isLast, index, ...props }, ref) => {
    const styles = statusStyles[status]
    return (
      <div ref={ref} className={cn('relative flex gap-3 pb-6 last:pb-0', className)} {...props}>
        <div className="flex flex-col items-center">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
              styles.node,
            )}
            aria-hidden="true"
          >
            {status === 'completed' ? (
              <Check className="h-3.5 w-3.5" />
            ) : status === 'current' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : index != null ? (
              index
            ) : (
              <Circle className="h-2 w-2 fill-current" />
            )}
          </span>
          {!isLast && <span className={cn('mt-1 w-px flex-1', styles.line)} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className={cn(
              'text-sm font-semibold',
              status === 'current' ? 'text-foreground' : 'text-foreground',
              status === 'pending' && 'text-muted-foreground',
            )}
          >
            {label}
          </p>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
    )
  },
)
TimelineStep.displayName = 'TimelineStep'
