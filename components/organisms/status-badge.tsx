import * as React from 'react'
import { cn } from '@/lib/utils'

export type StatusBadgeVariant =
  | 'operational'
  | 'degraded'
  | 'major_outage'
  | 'maintenance'
  | 'down'

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  operational:
    'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
  degraded:
    'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300',
  down: 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300',
  major_outage:
    'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300',
  maintenance:
    'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300',
}

const DOT_STYLES: Record<StatusBadgeVariant, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
  major_outage: 'bg-red-500',
  maintenance: 'bg-blue-500',
}

const DEFAULT_LABELS: Record<StatusBadgeVariant, string> = {
  operational: 'Beroperasi',
  degraded: 'Terdegradasi',
  down: 'Tidak tersedia',
  major_outage: 'Gangguan mayor',
  maintenance: 'Pemeliharaan',
}

export interface StatusBadgeProps {
  variant: StatusBadgeVariant
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Visual badge used in two places:
 *   - the big headline at the top of /status
 *   - inside each component card to indicate per-component health
 *
 * Tones are tuned for both light + dark mode via Tailwind dark variants.
 */
export function StatusBadge({
  variant,
  label,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const text = label ?? DEFAULT_LABELS[variant]
  const sizeClass =
    size === 'lg'
      ? 'px-4 py-2 text-base'
      : size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-3 py-1 text-sm'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        VARIANT_STYLES[variant],
        sizeClass,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('inline-block h-2 w-2 rounded-full', DOT_STYLES[variant])}
      />
      {text}
    </span>
  )
}

export default StatusBadge
