'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NotificationItemData {
  id: string
  title: string
  description?: string
  time: string
  href?: string
  unread?: boolean
  icon?: React.ReactNode
}

export interface NotificationsDropdownProps {
  trigger?: React.ReactNode
  items?: NotificationItemData[]
  onMarkAllRead?: () => void
  viewAllHref?: string
  className?: string
}

const DEFAULT_ITEMS: NotificationItemData[] = []

export function NotificationsDropdown({
  trigger,
  items = DEFAULT_ITEMS,
  onMarkAllRead,
  viewAllHref = '/dashboard/notifications',
  className,
}: NotificationsDropdownProps) {
  const unreadCount = items.filter((i) => i.unread).length

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-medium text-secondary-foreground">
                {unreadCount}
              </span>
            ) : null}
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-[360px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-slide-up',
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-medium">Notifikasi</p>
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-secondary hover:underline disabled:opacity-50"
              disabled={unreadCount === 0}
            >
              Tandai semua dibaca
            </button>
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi.
              </li>
            ) : (
              items.map((n) => {
                const Body = (
                  <div className="flex gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      {n.icon ?? <Bell className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm', n.unread ? 'font-medium' : 'text-muted-foreground')}>
                        {n.title}
                      </p>
                      {n.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{n.time}</p>
                    </div>
                    {n.unread ? (
                      <span aria-label="Belum dibaca" className="mt-2 h-2 w-2 rounded-full bg-secondary" />
                    ) : null}
                  </div>
                )
                return (
                  <li key={n.id}>{n.href ? <Link href={n.href}>{Body}</Link> : Body}</li>
                )
              })
            )}
          </ul>

          <div className="border-t border-border px-4 py-2 text-center">
            <Link href={viewAllHref} className="text-sm text-secondary hover:underline">
              Lihat semua
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default NotificationsDropdown
