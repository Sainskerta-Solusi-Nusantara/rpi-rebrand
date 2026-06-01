/**
 * Read-side queries for the public status page and admin panel.
 *
 * The queries here are intentionally narrow (no joins beyond what each card
 * needs) because the page is cached at 30 s via `revalidate`, so we want a
 * fast cold-render. The query that derives the overall status also calls
 * the health-check probes, which adds ~10–50 ms in practice.
 */

import { prisma } from '@/lib/db'
import { runAllHealthChecks, type HealthResult } from '@/lib/status/health-checks'

export type IncidentSeverity = 'minor' | 'major' | 'critical'
export type IncidentStatus =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved'
export type MaintenanceStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type OverallStatus =
  | 'operational'
  | 'degraded'
  | 'major_outage'
  | 'maintenance'

export interface IncidentSummary {
  id: string
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  affectedServices: string[]
  startedAt: Date
  resolvedAt: Date | null
  latestUpdate: {
    id: string
    status: IncidentStatus
    message: string
    postedAt: Date
  } | null
}

export interface MaintenanceSummary {
  id: string
  title: string
  description: string | null
  affectedServices: string[]
  scheduledStart: Date
  scheduledEnd: Date
  status: MaintenanceStatus
}

function parseServices(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === 'string')
  }
  return []
}

/** Incidents that are still active (not resolved). Includes most recent update. */
export async function getActiveIncidents(): Promise<IncidentSummary[]> {
  const rows = await prisma.incidentReport.findMany({
    where: { status: { not: 'resolved' } },
    orderBy: [{ startedAt: 'desc' }],
    include: {
      updates: { orderBy: { postedAt: 'desc' }, take: 1 },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity as IncidentSeverity,
    status: r.status as IncidentStatus,
    affectedServices: parseServices(r.affectedServices),
    startedAt: r.startedAt,
    resolvedAt: r.resolvedAt,
    latestUpdate:
      r.updates[0] != null
        ? {
            id: r.updates[0].id,
            status: r.updates[0].status as IncidentStatus,
            message: r.updates[0].message,
            postedAt: r.updates[0].postedAt,
          }
        : null,
  }))
}

/** Past N days of incidents (any status). Used by the history strip. */
export async function getRecentIncidents(days = 30): Promise<IncidentSummary[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const rows = await prisma.incidentReport.findMany({
    where: { startedAt: { gte: since } },
    orderBy: [{ startedAt: 'desc' }],
    include: {
      updates: { orderBy: { postedAt: 'desc' }, take: 1 },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity as IncidentSeverity,
    status: r.status as IncidentStatus,
    affectedServices: parseServices(r.affectedServices),
    startedAt: r.startedAt,
    resolvedAt: r.resolvedAt,
    latestUpdate:
      r.updates[0] != null
        ? {
            id: r.updates[0].id,
            status: r.updates[0].status as IncidentStatus,
            message: r.updates[0].message,
            postedAt: r.updates[0].postedAt,
          }
        : null,
  }))
}

/** Full detail of a single incident, including the reverse-chronological updates timeline. */
export async function getIncidentDetail(id: string) {
  const row = await prisma.incidentReport.findUnique({
    where: { id },
    include: {
      updates: { orderBy: { postedAt: 'desc' } },
    },
  })
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    severity: row.severity as IncidentSeverity,
    status: row.status as IncidentStatus,
    affectedServices: parseServices(row.affectedServices),
    startedAt: row.startedAt,
    resolvedAt: row.resolvedAt,
    updates: row.updates.map((u) => ({
      id: u.id,
      status: u.status as IncidentStatus,
      message: u.message,
      postedAt: u.postedAt,
    })),
  }
}

/** Upcoming maintenance windows (start is in the future, not cancelled). */
export async function getUpcomingMaintenance(): Promise<MaintenanceSummary[]> {
  const now = new Date()
  const rows = await prisma.scheduledMaintenance.findMany({
    where: {
      scheduledStart: { gt: now },
      status: { not: 'cancelled' },
    },
    orderBy: { scheduledStart: 'asc' },
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    affectedServices: parseServices(r.affectedServices),
    scheduledStart: r.scheduledStart,
    scheduledEnd: r.scheduledEnd,
    status: r.status as MaintenanceStatus,
  }))
}

/** Maintenance windows currently in progress. */
export async function getOngoingMaintenance(): Promise<MaintenanceSummary[]> {
  const rows = await prisma.scheduledMaintenance.findMany({
    where: { status: 'in_progress' },
    orderBy: { scheduledStart: 'asc' },
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    affectedServices: parseServices(r.affectedServices),
    scheduledStart: r.scheduledStart,
    scheduledEnd: r.scheduledEnd,
    status: r.status as MaintenanceStatus,
  }))
}

/** Past N days of maintenance windows for the admin/history list. */
export async function getRecentMaintenance(days = 30): Promise<MaintenanceSummary[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const rows = await prisma.scheduledMaintenance.findMany({
    where: { scheduledStart: { gte: since } },
    orderBy: { scheduledStart: 'desc' },
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    affectedServices: parseServices(r.affectedServices),
    scheduledStart: r.scheduledStart,
    scheduledEnd: r.scheduledEnd,
    status: r.status as MaintenanceStatus,
  }))
}

export async function getMaintenanceDetail(id: string) {
  const row = await prisma.scheduledMaintenance.findUnique({ where: { id } })
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    affectedServices: parseServices(row.affectedServices),
    scheduledStart: row.scheduledStart,
    scheduledEnd: row.scheduledEnd,
    status: row.status as MaintenanceStatus,
  }
}

export interface OverallStatusResult {
  status: OverallStatus
  health: Record<string, HealthResult>
  activeIncidents: IncidentSummary[]
  ongoingMaintenance: MaintenanceSummary[]
}

/**
 * Derive the headline status for the page badge. Order of precedence:
 *
 *   1. Any critical, unresolved incident → `major_outage` (worst case wins).
 *   2. Any major, unresolved incident → `degraded`.
 *   3. Any maintenance currently `in_progress` → `maintenance`
 *      (overrides `degraded`, but never overrides `major_outage`).
 *   4. Any health probe not `operational` → `degraded`.
 *   5. Otherwise → `operational`.
 */
export async function getOverallStatus(): Promise<OverallStatusResult> {
  const [activeIncidents, ongoingMaintenance, health] = await Promise.all([
    getActiveIncidents(),
    getOngoingMaintenance(),
    runAllHealthChecks(),
  ])

  const hasCritical = activeIncidents.some((i) => i.severity === 'critical')
  const hasMajor = activeIncidents.some((i) => i.severity === 'major')
  const hasMaintenance = ongoingMaintenance.length > 0
  const hasUnhealthy = Object.values(health).some(
    (h) => h.status !== 'operational',
  )

  // 1. Critical → major_outage (cannot be overridden by anything else).
  // 2. Otherwise if maintenance is running → maintenance (overrides degraded).
  // 3. Otherwise if a major incident or any health probe is unhealthy → degraded.
  // 4. Otherwise → operational.
  let status: OverallStatus = 'operational'
  if (hasCritical) {
    status = 'major_outage'
  } else if (hasMaintenance) {
    status = 'maintenance'
  } else if (hasMajor || hasUnhealthy) {
    status = 'degraded'
  }

  return { status, health, activeIncidents, ongoingMaintenance }
}
