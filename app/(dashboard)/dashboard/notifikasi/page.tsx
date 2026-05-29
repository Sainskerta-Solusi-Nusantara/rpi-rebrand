import { Bell, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getNotificationPrefs } from '@/lib/auth/notification-prefs'
import { NotificationPrefsForm } from '@/components/organisms/notification-prefs-form'

export const metadata = { title: 'Notifikasi — Dasbor' }

export default async function NotifikasiPage() {
  const session = await requireAuth('/dashboard/notifikasi')
  const prefs = await getNotificationPrefs(session.user.id)

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Preferensi Notifikasi</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Atur email mana saja yang ingin Anda terima dari RPI.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <NotificationPrefsForm initial={prefs} />
      </section>

      <section className="border-border bg-muted/40 rounded-2xl border p-6">
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-base">Email transaksional</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Beberapa email selalu dikirim terlepas dari preferensi ini karena
          terkait kepatuhan dan keamanan akun: tautan reset password,
          verifikasi email, konfirmasi perubahan email, dan pemberitahuan ke
          email lama saat email diganti.
        </p>
      </section>
    </div>
  )
}
