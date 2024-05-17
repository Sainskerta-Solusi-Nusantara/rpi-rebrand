'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/atoms/avatar'
import { cn, getInitials } from '@/lib/utils'

export interface TenantSwitcherProps {
  activeTenantSlug?: string
  onSelect?: (slug: string) => void
  className?: string
}

export function TenantSwitcher({ activeTenantSlug, onSelect, className }: TenantSwitcherProps) {
  const { data: session } = useSession()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)
  const tenants = session?.user?.tenants ?? []

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = tenants.find((t) => t.slug === activeTenantSlug) ?? tenants[0]

  if (tenants.length === 0) {
    return (
      <Link
        href="/onboarding"
        className={cn(
          'hidden md:inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-input px-3 text-xs text-muted-foreground hover:text-foreground',
          className,
        )}
      >
        <Plus className="h-4 w-4" /> Buat tenant
      </Link>
    )
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm hover:bg-muted"
      >
        <Avatar size="xs" alt={active?.slug ?? ''} fallback={getInitials(active?.slug)} />
        <span className="hidden md:inline max-w-[120px] truncate font-medium">{active?.slug}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tenant
          </div>
          {tenants.map((t) => {
            const isActive = t.slug === active?.slug
            return (
              <button
                type="button"
                key={t.tenantId}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onSelect?.(t.slug)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
                  isActive && 'bg-muted',
                )}
              >
                <Avatar size="xs" alt={t.slug} fallback={getInitials(t.slug)} />
                <span className="flex-1 truncate">{t.slug}</span>
                <span className="text-xs text-muted-foreground">{t.role}</span>
                {isActive ? <Check className="h-4 w-4 text-secondary" /> : null}
              </button>
            )
          })}
          <div className="my-1 border-t border-border" />
          <Link
            href="/onboarding"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Plus className="h-4 w-4 text-secondary" />
            <span>Buat tenant baru</span>
          </Link>
          <Link
            href="/dashboard/tenants"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>Kelola tenant</span>
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default TenantSwitcher
