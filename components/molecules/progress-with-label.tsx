import * as React from 'react'
import { Progress } from '@/components/atoms/progress'
import { cn } from '@/lib/utils'

export interface ProgressWithLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: React.ReactNode
  showPercentage?: boolean
  formatValue?: (value: number, max: number) => React.ReactNode
  indicatorClassName?: string
}

export const ProgressWithLabel = React.forwardRef<HTMLDivElement, ProgressWithLabelProps>(
  (
    { className, value, max = 100, label, showPercentage = true, formatValue, indicatorClassName, ...props },
    ref,
  ) => {
    const pct = Math.min(100, Math.max(0, max === 0 ? 0 : (value / max) * 100))
    const display = formatValue ? formatValue(value, max) : `${Math.round(pct)}%`
    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex items-baseline justify-between gap-2 text-xs">
            {label && <span className="font-medium text-foreground">{label}</span>}
            {showPercentage && <span className="tabular-nums text-muted-foreground">{display}</span>}
          </div>
        )}
        <Progress value={pct} indicatorClassName={indicatorClassName} />
      </div>
    )
  },
)
ProgressWithLabel.displayName = 'ProgressWithLabel'
