'use client'

import * as React from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  Flag,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from './dashboard-layout'
import { RoleBadge } from '@/components/organisms/role-badge'
import type { MiniSidebarItem } from '@/components/organisms/mini-sidebar'

export interface AdminLayoutProps {
  children: React.ReactNode
}

const ADMIN_ITEMS: MiniSidebarItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenant', icon: Building2, matchPrefix: true },
  { href: '/admin/users', label: 'Pengguna', icon: Users, matchPrefix: true },
  { href: '/admin/billing', label: 'Penagihan', icon: CreditCard, matchPrefix: true },
  { href: '/admin/audit', label: 'Audit Log', icon: Activity, matchPrefix: true },
  { href: '/admin/moderation', label: 'Moderasi', icon: Flag, matchPrefix: true },
  { href: '/admin/analytics', label: 'Analitik', icon: BarChart3, matchPrefix: true },
  { href: '/admin/system', label: 'Sistem', icon: ShieldCheck, matchPrefix: true },
]

const ADMIN_FOOTER: MiniSidebarItem[] = [
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings, matchPrefix: true },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession()
  const role = session?.user?.globalRole === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN'

  return (
    <DashboardLayout sidebarItems={ADMIN_ITEMS} sidebarFooterItems={ADMIN_FOOTER}>
      <div className="mb-4 flex items-center gap-2">
        <RoleBadge role={role} />
        <p className="text-sm text-muted-foreground">
          Mode {role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'} — aksi sensitif tercatat di audit log.
        </p>
      </div>
      {children}
    </DashboardLayout>
  )
}

export default AdminLayout
