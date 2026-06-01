import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getIncidentDetail } from '@/lib/status/status-queries'
import { getComponentName } from '@/lib/status/components'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'

export const revalidate = 30

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'Ringan',
  major: 'Berat',
  critical: 'Kritis',
}
const SEVERITY_VARIANT: Record<string, StatusBadgeVariant> = {
  minor: 'degraded',
  major: 'degraded',
  critical: 'major_outage',
}
const STATUS_LABELS: Record<string, string> = {
  investigating: 'Investigasi',
  identified: 'Teridentifikasi',
  monitoring: 'Pemantauan',
  resolved: 'Selesai',
}
const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  investigating: 'down',
  identified: 'degraded',
  monitoring: 'degraded',
  resolved: 'operational',
}

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const incident = await getIncidentDetail(params.id)
  return {
    title: incident ? `${incident.title} — Status` : 'Insiden — Status',
  }
}

export default async function IncidentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const incident = await getIncidentDetail(params.id)
  if (!incident) notFound()

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-3xl px-6 py-10 space-y-6">
        <Link
          href={'/status' as Route}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali ke status
        </Link>

        <header className="space-y-3">
          <h1 className="font-heading text-2xl md:text-3xl">{incident.title}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              variant={SEVERITY_VARIANT[incident.severity] ?? 'degraded'}
              label={SEVERITY_LABELS[incident.severity] ?? incident.severity}
            />
            <StatusBadge
              variant={STATUS_VARIANT[incident.status] ?? 'degraded'}
              label={STATUS_LABELS[incident.status] ?? incident.status}
            />
          </div>
          <dl className="text-muted-foreground grid gap-1 text-sm">
            <div>
              <dt className="inline">Dimulai: </dt>
              <dd className="text-foreground inline">{fmt(incident.startedAt)}</dd>
            </div>
            {incident.resolvedAt ? (
              <div>
                <dt className="inline">Diselesaikan: </dt>
                <dd className="text-foreground inline">{fmt(incident.resolvedAt)}</dd>
              </div>
            ) : null}
            {incident.affectedServices.length > 0 ? (
              <div>
                <dt className="inline">Layanan terdampak: </dt>
                <dd className="text-foreground inline">
                  {incident.affectedServices.map(getComponentName).join(', ')}
                </dd>
              </div>
            ) : null}
          </dl>
        </header>

        <section aria-labelledby="timeline-heading" className="space-y-3">
          <h2 id="timeline-heading" className="font-heading text-lg">
            Linimasa pembaruan
          </h2>
          {incident.updates.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada pembaruan.</p>
          ) : (
            <ol className="space-y-3">
              {incident.updates.map((u) => (
                <li
                  key={u.id}
                  className="border-border bg-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge
                      variant={STATUS_VARIANT[u.status] ?? 'degraded'}
                      label={STATUS_LABELS[u.status] ?? u.status}
                      size="sm"
                    />
                    <time className="text-muted-foreground text-xs">{fmt(u.postedAt)}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {u.message}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
