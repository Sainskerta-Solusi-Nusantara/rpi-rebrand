'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, LucideIcon, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Logo } from '@/components/atoms/logo'
import { Avatar } from '@/components/atoms/avatar'
import { cn, getInitials } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface MiniSidebarItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
  matchPrefix?: boolean
}

export interface MiniSidebarProps {
  items: MiniSidebarItem[]
  footerItems?: MiniSidebarItem[]
  defaultCollapsed?: boolean
  className?: string
}

export function MiniSidebar({
  items,
  footerItems = [],
  defaultCollapsed = true,
  className,
}: MiniSidebarProps) {
  const pathname = usePathname() ?? '/'
  const { data: session } = useSession()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const [hover, setHover] = React.useState(false)
  const expanded = !collapsed || hover

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        'group/sidebar sticky top-0 z-30 hidden md:flex h-screen flex-col border-r border-border bg-card text-card-foreground transition-[width] duration-300 ease-out',
        expanded ? 'w-64' : 'w-16',
        className,
      )}
      aria-label={t.dashboard.nav.mainNavigation}
    >
      <div className={cn('flex h-16 items-center border-b border-border', expanded ? 'px-4 justify-between' : 'px-2 justify-center')}>
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden" aria-label={t.dashboard.sidebar.dashboardLabel}>
          <Logo iconOnly={!expanded} />
        </Link>
        {expanded ? (
          <button
            type="button"
            onClick={() => setCollapsed((s) => !s)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? t.dashboard.sidebar.lockOpen : t.dashboard.sidebar.collapse}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col gap-1 px-2">
          {items.map((item) => (
            <SidebarItem key={item.href} item={item} pathname={pathname} expanded={expanded} />
          ))}
        </ul>
      </nav>

      {footerItems.length > 0 ? (
        <div className="border-t border-border py-3">
          <ul className="flex flex-col gap-1 px-2">
            {footerItems.map((item) => (
              <SidebarItem key={item.href} item={item} pathname={pathname} expanded={expanded} />
            ))}
          </ul>
        </div>
      ) : null}

      <div className={cn('border-t border-border p-3', expanded ? '' : 'flex justify-center')}>
        <div className={cn('flex items-center gap-3', expanded ? '' : 'flex-col')}>
          <Avatar
            src={session?.user?.image ?? undefined}
            alt={session?.user?.name ?? t.dashboard.topBar.userFallback}
            fallback={getInitials(session?.user?.name)}
            size="sm"
          />
          {expanded ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session?.user?.name ?? t.dashboard.topBar.guestFallback}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email ?? ''}</p>
            </div>
          ) : null}
          {expanded ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t.dashboard.sidebar.signOut}
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({
  item,
  pathname,
  expanded,
}: {
  item: MiniSidebarItem
  pathname: string
  expanded: boolean
}) {
  const isActive = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href
  const Icon = item.icon
  return (
    <li className="relative">
      {isActive ? (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-secondary"
        />
      ) : null}
      <Link
        href={item.href}
        className={cn(
          'group/link flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/80 hover:bg-muted hover:text-foreground',
          !expanded && 'justify-center px-2',
        )}
        aria-current={isActive ? 'page' : undefined}
        title={!expanded ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {expanded ? <span className="truncate flex-1">{item.label}</span> : null}
        {expanded && item.badge !== undefined ? (
          <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary/20 px-1.5 text-xs font-medium text-secondary">
            {item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  )
}

export default MiniSidebar
