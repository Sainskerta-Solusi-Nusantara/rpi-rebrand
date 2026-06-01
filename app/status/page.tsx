import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Activity, CalendarClock, History, Rss } from 'lucide-react'
import {
  getOverallStatus,
  getUpcomingMaintenance,
  getRecentIncidents,
  type IncidentSummary,
  type OverallStatus,
} from '@/lib/status/status-queries'
import { getComponentName } from '@/lib/status/components'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'
import { StatusComponentGrid } from '@/components/organisms/status-component-grid'
import { IncidentCard } from '@/components/organisms/incident-card'
import { getServerT } from '@/lib/i18n/server-dictionary'

// Health checks + DB queries are cheap, but 30 s is enough to absorb a
// thundering herd from external monitoring tools polling the page.
export const revalidate = 30
export const metadata = {
  title: 'Status sistem — RPI',
  description: 'Status real-time layanan Rumah Pekerja Indonesia, insiden aktif, dan jadwal pemeliharaan.',
}

const OVERALL_VARIANT: Record<OverallStatus, StatusBadgeVariant> = {
  operational: 'operational',
  degraded: 'degraded',
  major_outage: 'major_outage',
  maintenance: 'maintenance',
}

// Labels are derived from the dictionary at render time.

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function formatDay(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(d)
}

/** Group resolved incidents into day buckets (newest first). */
function groupByDay(items: IncidentSummary[]): { day: string; date: Date; items: IncidentSummary[] }[] {
  const map = new Map<string, { day: string; date: Date; items: IncidentSummary[] }>()
  for (const it of items) {
    const date = new Date(
      it.startedAt.getFullYear(),
      it.startedAt.getMonth(),
      it.startedAt.getDate(),
    )
    const key = date.toISOString()
    const existing = map.get(key)
    if (existing) {
      existing.items.push(it)
    } else {
      map.set(key, { day: formatDay(date), date, items: [it] })
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )
}

// The page must render even when the DB is unreachable; fall back to a
// degraded view rather than a 500.
const FALLBACK_OVERALL = {
  status: 'degraded' as const,
  health: {},
  activeIncidents: [],
  ongoingMaintenance: [],
}

export default async function PublicStatusPage() {
  const t = await getServerT()
  const ts = t.public.status
  const OVERALL_LABEL: Record<OverallStatus, string> = ts.overallStatus
  const MAINTENANCE_STATUS_LABEL: Record<string, string> = ts.maintenanceStatus

  const [{ status: overall, health, activeIncidents, ongoingMaintenance }, upcomingMaintenance, recentIncidents] =
    await Promise.all([
      getOverallStatus().catch(() => FALLBACK_OVERALL),
      getUpcomingMaintenance().catch(() => []),
      getRecentIncidents(30).catch(() => []),
    ])

  const resolvedHistory = recentIncidents.filter((i) => i.status === 'resolved')
  const historyDays = groupByDay(resolvedHistory)

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-5xl px-6 py-12 space-y-10">
        {/* Header */}
        <header className="space-y-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
            {ts.eyebrow}
          </p>
          <h1 className="font-heading text-3xl md:text-4xl">
            {ts.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              variant={OVERALL_VARIANT[overall]}
              label={OVERALL_LABEL[overall]}
              size="lg"
            />
            <p className="text-muted-foreground text-sm">
              {ts.updatedEvery}
            </p>
          </div>
        </header>

        {/* Ongoing maintenance banner */}
        {ongoingMaintenance.length > 0 ? (
          <section
            aria-label={ts.sections.ongoingMaintenanceLabel}
            className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4"
          >
            <h2 className="font-medium text-blue-700 dark:text-blue-300">
              {ts.sections.ongoingMaintenanceTitle}
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {ongoingMaintenance.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/status/maintenance/${m.id}` as Route}
                    className="hover:underline"
                  >
                    {m.title}
                  </Link>{' '}
                  <span className="text-muted-foreground">
                    · {ts.sections.completesAt} {formatDate(m.scheduledEnd)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Components grid */}
        <section aria-labelledby="komponen-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden />
            <h2 id="komponen-heading" className="font-heading text-xl">
              {ts.sections.components}
            </h2>
          </div>
          <StatusComponentGrid health={health} />
        </section>

        {/* Active incidents */}
        <section aria-labelledby="insiden-aktif-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden />
            <h2 id="insiden-aktif-heading" className="font-heading text-xl">
              {ts.sections.activeIncidents}
            </h2>
          </div>
          {activeIncidents.length === 0 ? (
            <p className="border-border bg-card text-muted-foreground rounded-xl border p-4 text-sm">
              {ts.sections.noActiveIncidents}
            </p>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map((i) => (
                <IncidentCard key={i.id} incident={i} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming maintenance */}
        <section aria-labelledby="maintenance-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" aria-hidden />
            <h2 id="maintenance-heading" className="font-heading text-xl">
              {ts.sections.upcomingMaintenance}
            </h2>
          </div>
          {upcomingMaintenance.length === 0 ? (
            <p className="border-border bg-card text-muted-foreground rounded-xl border p-4 text-sm">
              {ts.sections.noUpcomingMaintenance}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingMaintenance.map((m) => (
                <article
                  key={m.id}
                  className="border-border bg-card rounded-xl border p-4"
                >
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium leading-snug">
                        <Link
                          href={`/status/maintenance/${m.id}` as Route}
                          className="hover:underline"
                        >
                          {m.title}
                        </Link>
                      </h3>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(m.scheduledStart)} → {formatDate(m.scheduledEnd)}
                      </p>
                    </div>
                    <StatusBadge
                      variant="maintenance"
                      label={MAINTENANCE_STATUS_LABEL[m.status] ?? m.status}
                      size="sm"
                    />
                  </header>
                  {m.description ? (
                    <p className="text-muted-foreground mt-2 text-sm">{m.description}</p>
                  ) : null}
                  {m.affectedServices.length > 0 ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      {ts.sections.affectedServices}{' '}
                      <span className="text-foreground/80">
                        {m.affectedServices.map(getComponentName).join(', ')}
                      </span>
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section aria-labelledby="history-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" aria-hidden />
            <h2 id="history-heading" className="font-heading text-xl">
              {ts.sections.history}
            </h2>
          </div>
          {historyDays.length === 0 ? (
            <p className="border-border bg-card text-muted-foreground rounded-xl border p-4 text-sm">
              {ts.sections.noHistory}
            </p>
          ) : (
            <details className="border-border bg-card rounded-xl border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                {ts.sections.viewResolved.replace('{count}', String(resolvedHistory.length))}
              </summary>
              <div className="mt-4 space-y-6">
                {historyDays.map((bucket) => (
                  <div key={bucket.day}>
                    <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {bucket.day}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {bucket.items.map((i) => (
                        <li
                          key={i.id}
                          className="border-border bg-background rounded-md border p-3 text-sm"
                        >
                          <Link
                            href={`/status/incidents/${i.id}` as Route}
                            className="font-medium hover:underline"
                          >
                            {i.title}
                          </Link>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {formatDate(i.startedAt)}
                            {i.resolvedAt ? ` → ${formatDate(i.resolvedAt)}` : null}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        <footer className="border-border flex flex-wrap items-center gap-3 border-t pt-6">
          <a
            href="/status/feed.json"
            className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
          >
            <Rss className="h-4 w-4" aria-hidden />
            {ts.subscribe}
          </a>
          <span className="text-muted-foreground text-xs">
            {ts.subscribeNote}
          </span>
        </footer>
      </div>
    </div>
  )
}
