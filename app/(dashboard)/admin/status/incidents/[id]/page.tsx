import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { Activity, ChevronLeft } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getIncidentDetail } from '@/lib/status/status-queries'
import { getComponentName } from '@/lib/status/components'
import { IncidentUpdateForm } from '@/components/organisms/incident-update-form'
import { IncidentDeleteButton } from '@/components/organisms/status-admin-controls'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'

export const metadata = { title: 'Kelola insiden — Admin' }

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

export default async function AdminIncidentEditPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(`/admin/status/incidents/${params.id}`)
  if (session.user.globalRole !== 'SUPERADMIN') notFound()

  const incident = await getIncidentDetail(params.id)
  if (!incident) notFound()

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={'/admin/status' as Route}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali ke status
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/status/incidents/${incident.id}` as Route}
            className="text-muted-foreground hover:text-foreground text-xs underline"
          >
            Lihat halaman publik
          </Link>
          <IncidentDeleteButton id={incident.id} />
        </div>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" aria-hidden />
          <h1 className="font-heading text-2xl md:text-3xl">{incident.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            variant={SEVERITY_VARIANT[incident.severity] ?? 'degraded'}
            label={SEVERITY_LABELS[incident.severity] ?? incident.severity}
            size="sm"
          />
          <StatusBadge
            variant={STATUS_VARIANT[incident.status] ?? 'degraded'}
            label={STATUS_LABELS[incident.status] ?? incident.status}
            size="sm"
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

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading text-lg">Kirim pembaruan</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Pembaruan ini akan ditambahkan ke linimasa publik insiden.
        </p>
        <div className="mt-4">
          <IncidentUpdateForm incidentId={incident.id} currentStatus={incident.status} />
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border">
        <header className="border-border border-b p-4">
          <h2 className="font-medium">Linimasa</h2>
        </header>
        {incident.updates.length === 0 ? (
          <div className="p-4">
            <p className="text-muted-foreground text-sm">Belum ada pembaruan.</p>
          </div>
        ) : (
          <ol className="divide-border divide-y">
            {incident.updates.map((u) => (
              <li key={u.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge
                    variant={STATUS_VARIANT[u.status] ?? 'degraded'}
                    label={STATUS_LABELS[u.status] ?? u.status}
                    size="sm"
                  />
                  <time className="text-muted-foreground text-xs">{fmt(u.postedAt)}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{u.message}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
