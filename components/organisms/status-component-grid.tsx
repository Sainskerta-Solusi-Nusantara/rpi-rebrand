import * as React from 'react'
import { STATUS_COMPONENTS } from '@/lib/status/components'
import type { HealthResult } from '@/lib/status/health-checks'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'

function healthToVariant(status: HealthResult['status']): StatusBadgeVariant {
  if (status === 'operational') return 'operational'
  if (status === 'degraded') return 'degraded'
  return 'down'
}

const HEALTH_LABELS: Record<HealthResult['status'], string> = {
  operational: 'Beroperasi',
  degraded: 'Terdegradasi',
  down: 'Tidak tersedia',
}

export interface StatusComponentGridProps {
  health: Record<string, HealthResult>
}

/**
 * Grid of per-component health cards. Renders even when a probe is missing —
 * we fall back to "down" so the operator sees the gap.
 */
export function StatusComponentGrid({ health }: StatusComponentGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STATUS_COMPONENTS.map((c) => {
        const h: HealthResult = health[c.key] ?? {
          status: 'down',
          latencyMs: 0,
          error: 'Probe tidak tersedia',
        }
        const variant = healthToVariant(h.status)
        return (
          <article
            key={c.key}
            className="border-border bg-card flex flex-col rounded-xl border p-4"
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium leading-tight">{c.name}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">
                  {c.description}
                </p>
              </div>
              <StatusBadge
                variant={variant}
                label={HEALTH_LABELS[h.status]}
                size="sm"
              />
            </header>
            <footer className="text-muted-foreground mt-3 flex items-center justify-between text-[11px]">
              <span className="font-mono">{c.key}</span>
              <span className="tabular-nums">{h.latencyMs} ms</span>
            </footer>
            {h.error && h.status !== 'operational' ? (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-[11px]">
                {h.error}
              </p>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export default StatusComponentGrid
