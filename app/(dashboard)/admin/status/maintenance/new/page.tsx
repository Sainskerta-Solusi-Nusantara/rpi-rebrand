import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { CalendarClock, ChevronLeft } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { MaintenanceForm } from '@/components/organisms/maintenance-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Jadwal pemeliharaan — Admin' }

export default async function NewMaintenancePage() {
  const session = await requireAuth('/admin/status/maintenance/new')
  if (session.user.globalRole !== 'SUPERADMIN') notFound()

  const t = await getServerT()
  const tm = t.admin.status.maintenanceNew

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          href={'/admin/status' as Route}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {tm.back}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6" aria-hidden />
          <h1 className="font-heading text-2xl md:text-3xl">{tm.title}</h1>
        </div>
        <p className="text-muted-foreground mt-1">{tm.subtitle}</p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <MaintenanceForm />
      </section>
    </div>
  )
}
