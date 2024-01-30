'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '@/lib/utils'

export interface SwitchTabOption {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SwitchTabProps {
  options: SwitchTabOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  size?: 'sm' | 'md'
  'aria-label'?: string
}

const sizeMap = {
  sm: 'h-8 text-xs',
  md: 'h-9 text-sm',
} as const

export const SwitchTab = React.forwardRef<HTMLDivElement, SwitchTabProps>(
  ({ options, value, defaultValue, onValueChange, className, size = 'md', ...props }, ref) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      type="single"
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => v && onValueChange?.(v)}
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted p-0.5',
        className,
      )}
      aria-label={props['aria-label']}
    >
      {options.map((opt) => (
        <ToggleGroupPrimitive.Item
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-md px-3 font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            sizeMap[size],
          )}
        >
          {opt.icon}
          {opt.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  ),
)
SwitchTab.displayName = 'SwitchTab'
