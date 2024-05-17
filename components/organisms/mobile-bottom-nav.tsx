'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, GraduationCap, Home, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const DEFAULT_ITEMS: MobileBottomNavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/dashboard/jobs', label: 'Lowongan', icon: Briefcase, matchPrefix: true },
  { href: '/dashboard/lms', label: 'Pelatihan', icon: GraduationCap, matchPrefix: true },
  { href: '/dashboard/profile', label: 'Profil', icon: User, matchPrefix: true },
]

export function MobileBottomNav({ items = DEFAULT_ITEMS, className }: MobileBottomNavProps) {
  const pathname = usePathname() ?? '/'
  return (
    <nav
      aria-label="Navigasi bawah"
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden',
        'safe-area-inset-bottom',
        className,
      )}
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const active = it.matchPrefix ? pathname.startsWith(it.href) : pathname === it.href
          const Icon = it.icon
          return (
            <li key={it.href}>
              <Link
                href={it.href}
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
