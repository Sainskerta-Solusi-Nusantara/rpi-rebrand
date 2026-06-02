'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notifications/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  isRead: boolean
  createdAt: Date | string
}

export interface NotificationsBellProps {
  initialCount: number
  recentItems: NotificationItem[]
  className?: string
}

type BellStrings = {
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
}

/**
 * Relative-time formatter.
 *   < 1 min  -> justNow
 *   < 60 min -> minutesAgo (replace {x})
 *   < 24 hr  -> hoursAgo (replace {x})
 *   < 7 days -> daysAgo (replace {x})
 *   else     -> "DD/MM" (or DD/MM/YYYY if different year)
 */
function formatRelative(d: Date | string, s: BellStrings): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return s.justNow
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return s.minutesAgo.replace('{x}', String(diffMin))
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return s.hoursAgo.replace('{x}', String(diffHr))
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return s.daysAgo.replace('{x}', String(diffDay))
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const nowYear = new Date(now).getFullYear()
  return yyyy === nowYear ? `${dd}/${mm}` : `${dd}/${mm}/${yyyy}`
}

export function NotificationsBell({
  initialCount,
  recentItems,
  className,
}: NotificationsBellProps) {
  const { t } = useI18n()
  const tn = t.formsNotif.notificationsBell
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<NotificationItem[]>(recentItems)
  const [unreadCount, setUnreadCount] = React.useState<number>(initialCount)
  const [isPending, startTransition] = React.useTransition()
  const wrapRef = React.useRef<HTMLDivElement | null>(null)

  // Re-sync when server-provided props change (after revalidatePath).
  React.useEffect(() => {
    setItems(recentItems)
  }, [recentItems])
  React.useEffect(() => {
    setUnreadCount(initialCount)
  }, [initialCount])

  // Click-outside + Escape to close.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const displayCount =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : ''

  function optimisticMarkOne(id: string) {
    setItems((prev) => {
      let wasUnread = false
      const next = prev.map((it) => {
        if (it.id === id) {
          if (!it.isRead) wasUnread = true
          return { ...it, isRead: true }
        }
        return it
      })
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
      return next
    })
  }

  function handleItemClick(item: NotificationItem) {
    if (item.isRead) return
    optimisticMarkOne(item.id)
    startTransition(async () => {
      const res = await markNotificationRead(item.id)
      if (!res.ok) {
        // Revert on failure.
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isRead: false } : it)),
        )
        setUnreadCount((c) => c + 1)
      }
    })
  }

  function handleMarkAll() {
    if (unreadCount === 0) return
    const prevItems = items
    const prevCount = unreadCount
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true })))
    setUnreadCount(0)
    startTransition(async () => {
      const res = await markAllNotificationsRead()
      if (!res.ok) {
        setItems(prevItems)
        setUnreadCount(prevCount)
      }
    })
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Notifikasi"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {displayCount ? (
          <span
            aria-label={`${unreadCount} notifikasi belum dibaca`}
            className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-medium text-secondary-foreground ring-2 ring-background"
          >
            {displayCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Panel notifikasi"
          className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-medium">{tn.heading}</p>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || isPending}
              className="inline-flex items-center gap-1 text-xs text-secondary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {tn.markAllRead}
            </button>
          </div>

          <ul className="max-h-[400px] divide-y divide-border overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                {tn.empty}
              </li>
            ) : (
              items.map((n) => {
                const body = (
                  <div className="flex gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm',
                          !n.isRead ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatRelative(n.createdAt, tn)}
                      </p>
                    </div>
                    {!n.isRead ? (
                      <span
                        aria-label="Belum dibaca"
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary"
                      />
                    ) : null}
                  </div>
                )
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={n.link as any}
                        onClick={() => {
                          handleItemClick(n)
                          setOpen(false)
                        }}
                        className="block"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className="block w-full text-left"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                )
              })
            )}
          </ul>

          <div className="border-t border-border px-4 py-2 text-center">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/notifikasi/feed' as any}
              onClick={() => setOpen(false)}
              className="text-sm text-secondary hover:underline"
            >
              {tn.viewAll}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationsBell
