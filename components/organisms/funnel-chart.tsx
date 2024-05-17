'use client'

import * as React from 'react'
import {
  Funnel,
  FunnelChart as RFunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface FunnelDatum {
  name: string
  value: number
  /** When true, render with the gold accent. */
  highlight?: boolean
}

export interface FunnelChartProps {
  data: FunnelDatum[]
  title?: string
  description?: string
  height?: number
  className?: string
}

export function FunnelChart({ data, title, description, height = 320, className }: FunnelChartProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 text-card-foreground', className)}>
      {(title || description) && (
        <header className="mb-3">
          {title ? <h3 className="font-heading text-lg">{title}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </header>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RFunnelChart>
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
            <Funnel dataKey="value" data={data} isAnimationActive>
              {data.map((entry, i) => (
                <Cell
                  key={entry.name + i}
                  fill={entry.highlight ? 'var(--secondary)' : 'var(--primary)'}
                  stroke="var(--background)"
                />
              ))}
              <LabelList
                position="right"
                fill="var(--foreground)"
                stroke="none"
                dataKey="name"
                style={{ fontSize: 12 }}
              />
              <LabelList
                position="center"
                fill="var(--primary-foreground)"
                stroke="none"
                dataKey="value"
                style={{ fontSize: 12, fontWeight: 600 }}
              />
            </Funnel>
          </RFunnelChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default FunnelChart
