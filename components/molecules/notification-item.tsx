import * as React from 'react'
import { Icon, type IconProps } from '@/components/atoms/icon'
import { cn } from '@/lib/utils'

export interface NotificationItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode
  body?: React.ReactNode
  time?: React.ReactNode
  unread?: boolean
  icon?: IconProps['icon']
  iconName?: IconProps['name']
  iconTone?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted'
}

const toneClass: Record<NonNullable<NotificationItemProps['iconTone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

export const NotificationItem = React.forwardRef<HTMLDivElement, NotificationItemProps>(
  ({ className, title, body, time, unread, icon, iconName, iconTone = 'primary', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50',
        unread && 'bg-primary/5',
        className,
      )}
      {...props}
    >
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClass[iconTone])}>
        <Icon icon={icon} name={iconName} size="sm" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('truncate text-sm', unread ? 'font-semibold text-foreground' : 'text-foreground')}>
            {title}
          </p>
          {time && <span className="shrink-0 text-xs text-muted-foreground">{time}</span>}
        </div>
        {body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{body}</p>}
      </div>
      {unread && (
        <span aria-label="Belum dibaca" className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-secondary" />
      )}
    </div>
  ),
)
NotificationItem.displayName = 'NotificationItem'
