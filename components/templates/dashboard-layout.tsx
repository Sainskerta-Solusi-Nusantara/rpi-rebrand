'use client'

import * as React from 'react'
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { MiniSidebar, type MiniSidebarItem } from '@/components/organisms/mini-sidebar'
import { TopBar } from '@/components/organisms/top-bar'
import type { NotificationItem } from '@/components/organisms/notifications-bell'
import { CmdKPalette } from '@/components/organisms/cmd-k-palette'
import { MobileBottomNav } from '@/components/organisms/mobile-bottom-nav'

export interface DashboardLayoutProps {
  children: React.ReactNode
  /**
   * Override the role-derived sidebar items.
   */
  sidebarItems?: MiniSidebarItem[]
  sidebarFooterItems?: MiniSidebarItem[]
  /** Unread notification count (server-fetched, capped at 99 for display). */
  notificationsUnreadCount?: number
  /** Recent notifications for the topbar bell, server-fetched. */
  recentNotifications?: NotificationItem[]
  /** Unread @mention count for the current user. */
  mentionUnreadCount?: number
}

/**
 * Build sidebar items based on a session's global role.
 */
function buildMenuFromSession(globalRole?: string): MiniSidebarItem[] {
  const base: MiniSidebarItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/jobs', label: 'Lowongan', icon: Briefcase, matchPrefix: true },
    { href: '/dashboard/lms', label: 'Pelatihan', icon: GraduationCap, matchPrefix: true },
    { href: '/dashboard/messages', label: 'Pesan', icon: MessageSquare, matchPrefix: true },
    { href: '/dashboard/calendar', label: 'Kalender', icon: Calendar, matchPrefix: true },
  ]

  if (globalRole === 'PARTNER' || globalRole === 'ADMIN' || globalRole === 'SUPERADMIN') {
    base.push({
      href: '/dashboard/talents',
      label: 'Talenta',
      icon: Users,
      matchPrefix: true,
    })
    base.push({
      href: '/dashboard/analytics',
      label: 'Analitik',
      icon: BarChart3,
      matchPrefix: true,
    })
  }

  if (globalRole === 'ADMIN' || globalRole === 'SUPERADMIN') {
    base.push({
      href: '/dashboard/tenants',
      label: 'Tenant',
      icon: Building2,
      matchPrefix: true,
    })
  }

  return base
}

const DEFAULT_FOOTER: MiniSidebarItem[] = [
  { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings, matchPrefix: true },
  { href: '/help', label: 'Bantuan', icon: HelpCircle },
]

export function DashboardLayout({
  children,
  sidebarItems,
  sidebarFooterItems,
  notificationsUnreadCount,
  recentNotifications,
  mentionUnreadCount,
}: DashboardLayoutProps) {
  const { data: session } = useSession()
  const [cmdOpen, setCmdOpen] = React.useState(false)

  const items = React.useMemo(
    () => sidebarItems ?? buildMenuFromSession(session?.user?.globalRole),
    [sidebarItems, session?.user?.globalRole],
  )

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <MiniSidebar items={items} footerItems={sidebarFooterItems ?? DEFAULT_FOOTER} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenCmdK={() => setCmdOpen(true)}
          notificationsUnreadCount={notificationsUnreadCount}
          recentNotifications={recentNotifications}
          mentionUnreadCount={mentionUnreadCount}
        />
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <CmdKPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <MobileBottomNav />
    </div>
  )
}

export default DashboardLayout
