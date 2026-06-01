'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, GraduationCap, Home, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface MobileBottomNavItem {
  href: string
  label: string
  icon: LucideIcon
  matchPrefix?: boolean
}

export interface MobileBottomNavProps {
  items?: MobileBottomNavItem[]
  className?: string
}

export function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  const pathname = usePathname() ?? '/'
  const { t } = useI18n()
  const defaultItems: MobileBottomNavItem[] = React.useMemo(
    () => [
      { href: '/dashboard', label: t.dashboard.nav.dashboard, icon: Home },
      { href: '/dashboard/jobs', label: t.dashboard.nav.jobs, icon: Briefcase, matchPrefix: true },
      { href: '/dashboard/lms', label: t.dashboard.nav.lms, icon: GraduationCap, matchPrefix: true },
      { href: '/dashboard/profile', label: t.dashboard.nav.profile, icon: User, matchPrefix: true },
    ],
    [t],
  )
  const resolvedItems = items ?? defaultItems
  return (
    <nav
      aria-label={t.dashboard.nav.bottomNavigation}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden',
        'safe-area-inset-bottom',
        className,
      )}
    >
      <ul className="grid grid-cols-4">
        {resolvedItems.map((it) => {
          const active = it.matchPrefix ? pathname.startsWith(it.href) : pathname === it.href
          const Icon = it.icon
          return (
            <li key={it.href}>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={it.href as any}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px]',
                  active ? 'text-secondary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default MobileBottomNav
