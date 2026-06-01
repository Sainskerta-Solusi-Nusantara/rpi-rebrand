import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getMaintenanceDetail } from '@/lib/status/status-queries'
import { getComponentName } from '@/lib/status/components'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'

export const revalidate = 30

const STATUS_LABELS: Record<string, string> = {
  planned: 'Direncanakan',
  in_progress: 'Sedang berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}
const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  planned: 'maintenance',
  in_progress: 'maintenance',
  completed: 'operational',
  cancelled: 'down',
}

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const m = await getMaintenanceDetail(params.id)
  return {
    title: m ? `${m.title} — Status` : 'Pemeliharaan — Status',
  }
}

export default async function MaintenanceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const m = await getMaintenanceDetail(params.id)
  if (!m) notFound()

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
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
            Jadwal pemeliharaan
          </p>
          <h1 className="font-heading text-2xl md:text-3xl">{m.title}</h1>
          <StatusBadge
            variant={STATUS_VARIANT[m.status] ?? 'maintenance'}
            label={STATUS_LABELS[m.status] ?? m.status}
          />
          <dl className="text-muted-foreground grid gap-1 text-sm">
            <div>
              <dt className="inline">Mulai: </dt>
              <dd className="text-foreground inline">{fmt(m.scheduledStart)}</dd>
            </div>
            <div>
              <dt className="inline">Selesai: </dt>
              <dd className="text-foreground inline">{fmt(m.scheduledEnd)}</dd>
            </div>
            {m.affectedServices.length > 0 ? (
              <div>
                <dt className="inline">Layanan terdampak: </dt>
                <dd className="text-foreground inline">
                  {m.affectedServices.map(getComponentName).join(', ')}
                </dd>
              </div>
            ) : null}
          </dl>
        </header>

        {m.description ? (
          <section className="border-border bg-card rounded-xl border p-4">
            <h2 className="font-medium">Detail</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {m.description}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  )
}
