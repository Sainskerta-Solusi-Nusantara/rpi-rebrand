import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { Activity, ChevronLeft } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { IncidentForm } from '@/components/organisms/incident-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Insiden baru — Admin' }

export default async function NewIncidentPage() {
  const session = await requireAuth('/admin/status/incidents/new')
  if (session.user.globalRole !== 'SUPERADMIN') notFound()

  const t = await getServerT()
  const ti = t.admin.status.incidentNew

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          href={'/admin/status' as Route}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {ti.back}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" aria-hidden />
          <h1 className="font-heading text-2xl md:text-3xl">{ti.title}</h1>
        </div>
        <p className="text-muted-foreground mt-1">{ti.subtitle}</p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <IncidentForm />
      </section>
    </div>
  )
}
