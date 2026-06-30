'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clock, FileText, Search, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface CmdKItem {
  id: string
  label: string
  hint?: string
  group: 'Halaman' | 'Aksi' | 'Terakhir'
  href?: string
  onSelect?: () => void
  icon?: React.ReactNode
}

export interface CmdKPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items?: CmdKItem[]
}

export function CmdKPalette({ open, onOpenChange, items }: CmdKPaletteProps) {
  const router = useRouter()
  const { t } = useI18n()
  const tc = t.formsMisc2.cmdK

  const DEFAULT_ITEMS: CmdKItem[] = [
    { id: 'page-dashboard', group: 'Halaman', label: tc.itemDashboard, href: '/dashboard', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'page-jobs', group: 'Halaman', label: tc.itemJobs, href: '/jobs', icon: <FileText className="h-4 w-4" /> },
    { id: 'page-settings', group: 'Halaman', label: tc.itemSettings, href: '/dashboard/settings', icon: <Settings className="h-4 w-4" /> },
    { id: 'action-new-job', group: 'Aksi', label: tc.itemNewJob, href: '/partner/lowongan/baru', hint: tc.itemNewJobHint },
    { id: 'action-invite', group: 'Aksi', label: tc.itemInvite, href: '/partner/tim' },
  ]

  const resolvedItems = items ?? DEFAULT_ITEMS

  const groupLabel: Record<CmdKItem['group'], string> = {
    Halaman: tc.groupPage,
    Aksi: tc.groupAction,
    Terakhir: tc.groupRecent,
  }

  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resolvedItems
    return resolvedItems.filter((i) => {
      const hay = `${i.label} ${i.hint ?? ''} ${i.group}`.toLowerCase()
      // Cheap fuzzy: every char in q appears in order in hay
      let idx = 0
      for (const c of q) {
        idx = hay.indexOf(c, idx)
        if (idx === -1) return false
        idx += 1
      }
      return true
    })
  }, [query, resolvedItems])

  const grouped = React.useMemo(() => {
    const map = new Map<CmdKItem['group'], CmdKItem[]>()
    for (const item of filtered) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  const select = React.useCallback(
    (item: CmdKItem) => {
      onOpenChange(false)
      if (item.onSelect) item.onSelect()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (item.href) router.push(item.href as any)
    },
    [onOpenChange, router],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[activeIndex]
      if (item) select(item)
    }
  }

  // Global Cmd+K shortcut wiring is the layout's responsibility; we still close on Esc via Radix.

  let runningIndex = -1

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] z-50 w-[92vw] max-w-xl -translate-x-1/2 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-slide-up"
          aria-label="Command palette"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={tc.searchPlaceholder}
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2" role="listbox">
            {grouped.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{tc.noResults}</p>
            ) : (
              grouped.map(([group, list]) => (
                <div key={group} className="mb-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group === 'Terakhir' ? <Clock className="h-3 w-3" /> : null}
                    {groupLabel[group]}
                  </div>
                  {list.map((item) => {
                    runningIndex += 1
                    const active = runningIndex === activeIndex
                    return (
                      <button
                        type="button"
                        key={item.id}
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setActiveIndex(runningIndex)}
                        onClick={() => select(item)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                          active ? 'bg-muted text-foreground' : 'hover:bg-muted/60',
                        )}
                      >
                        <span className="text-muted-foreground">{item.icon ?? <ArrowRight className="h-4 w-4" />}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="text-xs text-muted-foreground">{item.hint}</span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default CmdKPalette
