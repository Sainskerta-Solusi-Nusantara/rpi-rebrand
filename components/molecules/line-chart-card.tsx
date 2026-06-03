'use client'

import * as React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface LineChartDatum {
  label: string
  value: number
}

export interface LineChartCardProps {
  data: LineChartDatum[]
  title?: string
  description?: string
  height?: number
  className?: string
}

/**
 * Small card wrapping a single-series line chart. Used for trend widgets
 * (applications/jobs per month) across the partner and admin dashboards.
 * Mirrors the card chrome of FunnelChart for visual consistency.
 */
export function LineChartCard({
  data,
  title,
  description,
  height = 280,
  className,
}: LineChartCardProps) {
  const isEmpty = !data || data.length === 0

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-5 text-card-foreground',
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-3">
          {title ? <h3 className="font-heading text-lg">{title}</h3> : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}
      <div style={{ width: '100%', height }}>
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            —
          </div>
        ) : (
          <ResponsiveContainer>
            <RLineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 2, fill: 'var(--primary)' }}
                activeDot={{ r: 4 }}
                isAnimationActive
              />
            </RLineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

export default LineChartCard
