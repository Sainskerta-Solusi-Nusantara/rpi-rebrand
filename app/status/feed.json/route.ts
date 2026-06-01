/**
 * Public JSON feed for the status page.
 *
 * Intended for external monitoring tools that want a structured snapshot of
 * the platform's current state. Cached for 60 s at the CDN — short enough
 * that operators see fresh data, long enough to absorb scrape bursts.
 *
 * Shape (Atom-style):
 *   {
 *     title: string,
 *     generatedAt: ISO-8601,
 *     status: 'operational' | 'degraded' | 'major_outage' | 'maintenance',
 *     activeIncidents: IncidentEntry[],
 *     upcomingMaintenance: MaintenanceEntry[],
 *   }
 */

import { NextResponse } from 'next/server'
import {
  getOverallStatus,
  getUpcomingMaintenance,
} from '@/lib/status/status-queries'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(): Promise<Response> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://rumahpekerja.id'
  const [{ status, activeIncidents }, upcomingMaintenance] = await Promise.all([
    getOverallStatus(),
    getUpcomingMaintenance(),
  ])

  const payload = {
    title: 'Rumah Pekerja Indonesia — Status',
    generatedAt: new Date().toISOString(),
    status,
    statusPageUrl: `${baseUrl}/status`,
    activeIncidents: activeIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      affectedServices: i.affectedServices,
      startedAt: i.startedAt.toISOString(),
      resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
      url: `${baseUrl}/status/incidents/${i.id}`,
      latestUpdate: i.latestUpdate
        ? {
            id: i.latestUpdate.id,
            status: i.latestUpdate.status,
            message: i.latestUpdate.message,
            postedAt: i.latestUpdate.postedAt.toISOString(),
          }
        : null,
    })),
    upcomingMaintenance: upcomingMaintenance.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      affectedServices: m.affectedServices,
      scheduledStart: m.scheduledStart.toISOString(),
      scheduledEnd: m.scheduledEnd.toISOString(),
      status: m.status,
      url: `${baseUrl}/status/maintenance/${m.id}`,
    })),
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
