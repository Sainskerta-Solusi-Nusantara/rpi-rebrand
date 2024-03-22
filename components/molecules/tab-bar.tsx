'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-11 items-center justify-start gap-1 border-b border-border bg-transparent text-muted-foreground',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-4 py-2.5 text-sm font-medium transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground',
      'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:scale-x-0 after:bg-secondary after:transition-transform after:duration-200 data-[state=active]:after:scale-x-100',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export interface TabBarItem {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

export interface TabBarProps extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, 'children'> {
  items: TabBarItem[]
  ariaLabel?: string
  children?: React.ReactNode
}

export const TabBar = React.forwardRef<HTMLDivElement, TabBarProps>(
  ({ items, ariaLabel, children, className, ...props }, ref) => (
    <Tabs ref={ref} className={cn('w-full', className)} {...props}>
      <TabsList aria-label={ariaLabel}>
        {items.map((it) => (
          <TabsTrigger key={it.value} value={it.value} disabled={it.disabled}>
            {it.icon}
            {it.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  ),
)
TabBar.displayName = 'TabBar'
