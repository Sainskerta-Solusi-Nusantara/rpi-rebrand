import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight } from 'lucide-react'
import { getComponentName } from '@/lib/status/components'
import type {
  IncidentSummary,
  IncidentSeverity,
  IncidentStatus,
} from '@/lib/status/status-queries'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  minor: 'Ringan',
  major: 'Berat',
  critical: 'Kritis',
}

const SEVERITY_VARIANT: Record<IncidentSeverity, StatusBadgeVariant> = {
  minor: 'degraded',
  major: 'degraded',
  critical: 'major_outage',
}

const STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: 'Investigasi',
  identified: 'Teridentifikasi',
  monitoring: 'Pemantauan',
  resolved: 'Selesai',
}

const STATUS_VARIANT: Record<IncidentStatus, StatusBadgeVariant> = {
  investigating: 'down',
  identified: 'degraded',
  monitoring: 'degraded',
  resolved: 'operational',
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export interface IncidentCardProps {
  incident: IncidentSummary
  /** Whether to show the "Buka detail" CTA. Hidden on the detail page itself. */
  showDetailLink?: boolean
}

/**
 * Public-facing summary card. Used by the active incidents list and the
 * 30-day history strip.
 */
export function IncidentCard({ incident, showDetailLink = true }: IncidentCardProps) {
  const detailHref = `/status/incidents/${incident.id}` as Route
  return (
    <article className="border-border bg-card rounded-xl border p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug">{incident.title}</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Dimulai {formatTime(incident.startedAt)}
            {incident.resolvedAt
              ? ` · Diselesaikan ${formatTime(incident.resolvedAt)}`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            variant={SEVERITY_VARIANT[incident.severity]}
            label={SEVERITY_LABELS[incident.severity]}
            size="sm"
          />
          <StatusBadge
            variant={STATUS_VARIANT[incident.status]}
            label={STATUS_LABELS[incident.status]}
            size="sm"
          />
        </div>
      </header>

      {incident.affectedServices.length > 0 ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Layanan terdampak:{' '}
          <span className="text-foreground/80">
            {incident.affectedServices.map(getComponentName).join(', ')}
          </span>
        </p>
      ) : null}

      {incident.latestUpdate ? (
        <p className="bg-muted/40 mt-3 rounded-md p-3 text-sm leading-relaxed">
          {incident.latestUpdate.message}
          <span className="text-muted-foreground mt-1 block text-[11px]">
            {STATUS_LABELS[incident.latestUpdate.status]} ·{' '}
            {formatTime(incident.latestUpdate.postedAt)}
          </span>
        </p>
      ) : null}

      {showDetailLink ? (
        <div className="mt-3">
          <Link
            href={detailHref}
            className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
          >
            Buka detail
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : null}
    </article>
  )
}

export default IncidentCard
