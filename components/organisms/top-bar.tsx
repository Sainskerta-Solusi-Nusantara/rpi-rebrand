'use client'

import * as React from 'react'
import { MessageSquare, Search } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/atoms/avatar'
import { cn, getInitials } from '@/lib/utils'
import { NotificationsBell, type NotificationItem } from './notifications-bell'
import { TenantSwitcher } from './tenant-switcher'

export interface TopBarProps {
  onOpenCmdK?: () => void
  onOpenChat?: () => void
  className?: string
  /** Initial unread count from the server (capped at 99 for display). */
  notificationsUnreadCount?: number
  /** Recent notifications for the dropdown panel, fetched on the server. */
  recentNotifications?: NotificationItem[]
}

export function TopBar({
  onOpenCmdK,
  onOpenChat,
  className,
  notificationsUnreadCount = 0,
  recentNotifications = [],
}: TopBarProps) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 w-full items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md',
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenCmdK}
        className="group inline-flex h-10 flex-1 max-w-xl items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Buka command palette"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left truncate">Cari atau lompat ke...</span>
        <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <TenantSwitcher />

        <button
          type="button"
          onClick={onOpenChat}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Pesan"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        <NotificationsBell
          initialCount={notificationsUnreadCount}
          recentItems={recentNotifications}
        />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            className="inline-flex items-center gap-2 rounded-full p-1 hover:bg-muted"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar
              src={session?.user?.image ?? undefined}
              alt={session?.user?.name ?? 'Pengguna'}
              fallback={getInitials(session?.user?.name)}
              size="sm"
            />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="truncate text-sm font-medium">{session?.user?.name ?? 'Tamu'}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <a
                role="menuitem"
                href="/dashboard/profile"
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                Profil saya
              </a>
              <a
                role="menuitem"
                href="/dashboard/settings"
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                Pengaturan
              </a>
              <a
                role="menuitem"
                href="/api/auth/signout"
                className="block rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted"
              >
                Keluar
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default TopBar
