'use client'

import * as React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export interface TabbedWorkspaceTab {
  value: string
  label: string
  content: React.ReactNode
  badge?: string | number
}

export interface TabbedWorkspaceProps {
  tabs: TabbedWorkspaceTab[]
  defaultValue?: string
  className?: string
  listClassName?: string
}

export function TabbedWorkspace({
  tabs,
  defaultValue,
  className,
  listClassName,
}: TabbedWorkspaceProps) {
  const initial = defaultValue ?? tabs[0]?.value
  return (
    <Tabs.Root defaultValue={initial} className={cn('flex flex-col gap-4', className)}>
      <Tabs.List
        className={cn(
          'relative flex items-center gap-1 border-b border-border',
          listClassName,
        )}
      >
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              'group relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
              'data-[state=active]:text-foreground',
            )}
          >
            <span>{t.label}</span>
            {t.badge !== undefined ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground group-data-[state=active]:bg-secondary/15 group-data-[state=active]:text-secondary">
                {t.badge}
              </span>
            ) : null}
            <span
              aria-hidden
              className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-secondary opacity-0 transition-opacity group-data-[state=active]:opacity-100"
            />
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((t) => (
        <Tabs.Content
          key={t.value}
          value={t.value}
          className="focus-visible:outline-none animate-fade-in"
        >
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}

export default TabbedWorkspace
