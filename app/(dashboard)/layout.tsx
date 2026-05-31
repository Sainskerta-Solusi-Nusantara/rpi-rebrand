import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { getTenantBranding } from '@/lib/branding/server'
import { ThemeProvider } from '@/lib/branding/theme-provider'
import {
  getRecentNotifications,
  getUnreadNotificationCount,
} from '@/lib/notifications/queries'
import { SwRegister } from '@/app/sw-register'

// Resilient layout-template + SessionProvider lookup.
function makeFallback() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback({ children }: any) {
    return <div className="min-h-screen flex flex-col">{children}</div>
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DashboardLayout: any = makeFallback()
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/components/templates/dashboard-layout')
  if (mod?.DashboardLayout) DashboardLayout = mod.DashboardLayout
} catch {
  /* template not yet available */
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SessionProvider: any = ({ children }: any) => <>{children}</>
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/components/providers/session-provider')
  if (mod?.SessionProvider) SessionProvider = mod.SessionProvider
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod2 = require('next-auth/react')
    if (mod2?.SessionProvider) SessionProvider = mod2.SessionProvider
  } catch {
    /* keep passthrough */
  }
}

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  const h = headers()
  const slug = h.get('x-tenant-slug') ?? undefined
  const tenant = slug
    ? await prisma.tenant
        .findUnique({
          where: { slug },
          select: { id: true, slug: true, name: true, status: true },
        })
        .catch(() => null)
    : null
  const branding = await getTenantBranding(slug).catch(() => null)

  const userId = session.user.id
  const [notificationsUnreadCount, recentNotifications] = await Promise.all([
    getUnreadNotificationCount(userId).catch(() => 0),
    getRecentNotifications(userId, 10).catch(() => []),
  ])

  return (
    <SessionProvider session={session}>
      <ThemeProvider initial={branding ?? undefined}>
        <SwRegister />
        <DashboardLayout
          session={session}
          tenant={tenant ?? undefined}
          notificationsUnreadCount={notificationsUnreadCount}
          recentNotifications={recentNotifications}
        >
          {children}
        </DashboardLayout>
      </ThemeProvider>
    </SessionProvider>
  )
}
