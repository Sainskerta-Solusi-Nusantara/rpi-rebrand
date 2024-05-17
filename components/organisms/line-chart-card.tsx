'use client'

import * as React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/atoms/card'
import { cn } from '@/lib/utils'

export interface LineChartCardSeries {
  key: string
  label: string
  /** Optional override; defaults rotate through theme tokens. */
  color?: string
}

export interface LineChartCardProps<T extends Record<string, number | string>> {
  title: string
  description?: string
  data: T[]
  xKey: keyof T & string
  dataKeys: LineChartCardSeries[]
  height?: number
  className?: string
}

const DEFAULT_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--success)']

export function LineChartCard<T extends Record<string, number | string>>({
  title,
  description,
  data,
  xKey,
  dataKeys,
  height = 280,
  className,
}: LineChartCardProps<T>) {
  return (
    <Card className={cn('p-5', className)}>
      <header className="mb-3">
        <h3 className="font-heading text-lg">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {dataKeys.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default LineChartCard
