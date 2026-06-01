import { Bell, Info, Smartphone } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getNotificationPrefs } from '@/lib/auth/notification-prefs'
import { NotificationPrefsForm } from '@/components/organisms/notification-prefs-form'
import { PushSubscribeToggle } from '@/components/organisms/push-subscribe-toggle'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Notifikasi — Dasbor' }

export default async function NotifikasiPage() {
  const session = await requireAuth('/dashboard/notifikasi')
  const t = await getServerT()
  const prefs = await getNotificationPrefs(session.user.id)
  const pushCount = await prisma.pushSubscription
    .count({ where: { userId: session.user.id } })
    .catch(() => 0)
  const hasActivePush = pushCount > 0

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.notifications.title}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.notifications.subtitle}
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-base">{t.dashboard.notifications.pushTitle}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.dashboard.notifications.pushDesc}
          {hasActivePush
            ? t.dashboard.notifications.pushActive.replace('{n}', String(pushCount))
            : t.dashboard.notifications.pushInactive}
        </p>
        <PushSubscribeToggle initialSubscribed={hasActivePush} />
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <NotificationPrefsForm initial={prefs} />
      </section>

      <section className="border-border bg-muted/40 rounded-2xl border p-6">
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-base">{t.dashboard.notifications.transactionalTitle}</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          {t.dashboard.notifications.transactionalDesc}
        </p>
      </section>
    </div>
  )
}
