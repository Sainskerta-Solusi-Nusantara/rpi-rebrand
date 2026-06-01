import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { Activity, CalendarClock, ChevronLeft, Plus } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import {
  getActiveIncidents,
  getRecentIncidents,
  getUpcomingMaintenance,
  getRecentMaintenance,
} from '@/lib/status/status-queries'

export const metadata = { title: 'Status Sistem — Admin' }

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'Ringan',
  major: 'Berat',
  critical: 'Kritis',
}
const STATUS_LABELS: Record<string, string> = {
  investigating: 'Investigasi',
  identified: 'Teridentifikasi',
  monitoring: 'Pemantauan',
  resolved: 'Selesai',
}
const MAINTENANCE_LABELS: Record<string, string> = {
  planned: 'Direncanakan',
  in_progress: 'Sedang berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export default async function AdminStatusPage() {
  const session = await requireAuth('/admin/status')
  if (session.user.globalRole !== 'SUPERADMIN') notFound()

  const [active, recent, upcoming, recentMaintenance] = await Promise.all([
    getActiveIncidents(),
    getRecentIncidents(30),
    getUpcomingMaintenance(),
    getRecentMaintenance(30),
  ])

  // The "recent" list already includes active ones; show only the resolved ones in the history table.
  const recentResolved = recent.filter((i) => i.status === 'resolved')

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <Link
          href={'/admin' as Route}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali ke admin
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6" aria-hidden />
            <h1 className="font-heading text-2xl md:text-3xl">Status sistem</h1>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Kelola insiden publik dan jadwal pemeliharaan. Halaman publik:{' '}
            <Link href={'/status' as Route} className="underline">
              /status
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={'/admin/status/incidents/new' as Route}
            className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Insiden baru
          </Link>
          <Link
            href={'/admin/status/maintenance/new' as Route}
            className="border-border bg-background hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Jadwal pemeliharaan
          </Link>
        </div>
      </header>

      {/* Active incidents */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden />
          <h2 className="font-heading text-lg">Insiden aktif</h2>
        </div>
        <div className="border-border bg-card rounded-2xl border">
          {active.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground text-sm">Tidak ada insiden aktif.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-3 font-medium">Judul</th>
                    <th className="p-3 font-medium">Keparahan</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Dimulai</th>
                    <th className="p-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {active.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3">
                        <Link
                          href={`/admin/status/incidents/${i.id}` as Route}
                          className="font-medium hover:underline"
                        >
                          {i.title}
                        </Link>
                      </td>
                      <td className="p-3 text-xs">
                        {SEVERITY_LABELS[i.severity] ?? i.severity}
                      </td>
                      <td className="p-3 text-xs">
                        {STATUS_LABELS[i.status] ?? i.status}
                      </td>
                      <td className="p-3 text-xs">{fmt(i.startedAt)}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/status/incidents/${i.id}` as Route}
                          className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium"
                        >
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Recent resolved history */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden />
          <h2 className="font-heading text-lg">Riwayat 30 hari (terselesaikan)</h2>
        </div>
        <div className="border-border bg-card rounded-2xl border">
          {recentResolved.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                Belum ada insiden yang terselesaikan dalam 30 hari terakhir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-3 font-medium">Judul</th>
                    <th className="p-3 font-medium">Keparahan</th>
                    <th className="p-3 font-medium">Dimulai</th>
                    <th className="p-3 font-medium">Diselesaikan</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {recentResolved.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3">
                        <Link
                          href={`/admin/status/incidents/${i.id}` as Route}
                          className="font-medium hover:underline"
                        >
                          {i.title}
                        </Link>
                      </td>
                      <td className="p-3 text-xs">
                        {SEVERITY_LABELS[i.severity] ?? i.severity}
                      </td>
                      <td className="p-3 text-xs">{fmt(i.startedAt)}</td>
                      <td className="p-3 text-xs">
                        {i.resolvedAt ? fmt(i.resolvedAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming maintenance */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden />
          <h2 className="font-heading text-lg">Pemeliharaan mendatang</h2>
        </div>
        <div className="border-border bg-card rounded-2xl border">
          {upcoming.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                Belum ada pemeliharaan terjadwal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-3 font-medium">Judul</th>
                    <th className="p-3 font-medium">Mulai</th>
                    <th className="p-3 font-medium">Selesai</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {upcoming.map((m) => (
                    <tr key={m.id}>
                      <td className="p-3">
                        <Link
                          href={`/admin/status/maintenance/${m.id}` as Route}
                          className="font-medium hover:underline"
                        >
                          {m.title}
                        </Link>
                      </td>
                      <td className="p-3 text-xs">{fmt(m.scheduledStart)}</td>
                      <td className="p-3 text-xs">{fmt(m.scheduledEnd)}</td>
                      <td className="p-3 text-xs">
                        {MAINTENANCE_LABELS[m.status] ?? m.status}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/status/maintenance/${m.id}` as Route}
                          className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium"
                        >
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Recent maintenance history */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden />
          <h2 className="font-heading text-lg">Pemeliharaan 30 hari terakhir</h2>
        </div>
        <div className="border-border bg-card rounded-2xl border">
          {recentMaintenance.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                Tidak ada pemeliharaan dalam 30 hari terakhir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-3 font-medium">Judul</th>
                    <th className="p-3 font-medium">Mulai</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {recentMaintenance.map((m) => (
                    <tr key={m.id}>
                      <td className="p-3">
                        <Link
                          href={`/admin/status/maintenance/${m.id}` as Route}
                          className="font-medium hover:underline"
                        >
                          {m.title}
                        </Link>
                      </td>
                      <td className="p-3 text-xs">{fmt(m.scheduledStart)}</td>
                      <td className="p-3 text-xs">
                        {MAINTENANCE_LABELS[m.status] ?? m.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
