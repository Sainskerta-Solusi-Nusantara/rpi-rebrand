import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { CalendarClock, ChevronLeft } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getMaintenanceDetail } from '@/lib/status/status-queries'
import { getComponentName } from '@/lib/status/components'
import { MaintenanceStatusActions } from '@/components/organisms/status-admin-controls'
import { StatusBadge, type StatusBadgeVariant } from '@/components/organisms/status-badge'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatDate } from '@/lib/i18n/format'

export const metadata = { title: 'Kelola pemeliharaan — Admin' }

const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  planned: 'maintenance',
  in_progress: 'maintenance',
  completed: 'operational',
  cancelled: 'down',
}

type MaintenanceStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export default async function AdminMaintenancePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(`/admin/status/maintenance/${params.id}`)
  if (session.user.globalRole !== 'SUPERADMIN') notFound()

  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const ts = t.admin.status
  const tme = ts.maintenanceEdit
  const STATUS_LABELS: Record<string, string> = ts.maintenanceStatus
  const fmt = (d: Date): string =>
    formatDate(d, locale, { dateStyle: 'medium', timeStyle: 'short' })

  const m = await getMaintenanceDetail(params.id)
  if (!m) notFound()

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={'/admin/status' as Route}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {tme.back}
        </Link>
        <Link
          href={`/status/maintenance/${m.id}` as Route}
          className="text-muted-foreground hover:text-foreground text-xs underline"
        >
          {tme.viewPublic}
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6" aria-hidden />
          <h1 className="font-heading text-2xl md:text-3xl">{m.title}</h1>
        </div>
        <StatusBadge
          variant={STATUS_VARIANT[m.status] ?? 'maintenance'}
          label={STATUS_LABELS[m.status] ?? m.status}
        />
        <dl className="text-muted-foreground grid gap-1 text-sm">
          <div>
            <dt className="inline">{tme.startLabel}</dt>
            <dd className="text-foreground inline">{fmt(m.scheduledStart)}</dd>
          </div>
          <div>
            <dt className="inline">{tme.endLabel}</dt>
            <dd className="text-foreground inline">{fmt(m.scheduledEnd)}</dd>
          </div>
          {m.affectedServices.length > 0 ? (
            <div>
              <dt className="inline">{tme.affectedLabel}</dt>
              <dd className="text-foreground inline">
                {m.affectedServices.map(getComponentName).join(', ')}
              </dd>
            </div>
          ) : null}
        </dl>
        {m.description ? (
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">{m.description}</p>
        ) : null}
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading text-lg">{tme.changeStatusHeading}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{tme.changeStatusDesc}</p>
        <div className="mt-4">
          <MaintenanceStatusActions
            id={m.id}
            currentStatus={m.status as MaintenanceStatus}
          />
        </div>
      </section>
    </div>
  )
}
