'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/atoms/card'
import { Icon, type IconProps } from '@/components/atoms/icon'
import { cn } from '@/lib/utils'

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  icon?: IconProps['icon']
  iconName?: IconProps['name']
  delta?: number | null
  deltaSuffix?: string
  trendDirection?: 'up' | 'down' | 'flat'
  sparkline?: React.ReactNode
  description?: React.ReactNode
}

function resolveTrend(delta?: number | null, override?: 'up' | 'down' | 'flat') {
  if (override) return override
  if (delta == null) return 'flat'
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  (
    {
      className,
      label,
      value,
      icon,
      iconName,
      delta,
      deltaSuffix = '%',
      trendDirection,
      sparkline,
      description,
      ...props
    },
    ref,
  ) => {
    const trend = resolveTrend(delta, trendDirection)
    const trendClass =
      trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
    const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {(icon || iconName) && (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon icon={icon} name={iconName} size="md" />
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-heading text-3xl font-bold leading-none text-foreground">{value}</p>
            {sparkline && <div className="h-10 max-w-[120px] flex-1">{sparkline}</div>}
          </div>
          {(delta != null || description) && (
            <div className="flex items-center gap-2 text-xs">
              {delta != null && (
                <span className={cn('inline-flex items-center gap-0.5 font-semibold', trendClass)}>
                  <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {Math.abs(delta)}
                  {deltaSuffix}
                </span>
              )}
              {description && <span className="text-muted-foreground">{description}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)
KpiCard.displayName = 'KpiCard'
