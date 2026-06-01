import * as React from 'react'
import { Inbox } from 'lucide-react'
import { Icon, type IconProps } from '@/components/atoms/icon'
import { cn } from '@/lib/utils'

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: IconProps['icon']
  iconName?: IconProps['name']
  cta?: React.ReactNode
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon, iconName, cta, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center',
        className,
      )}
      {...props}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon icon={icon ?? (iconName ? undefined : Inbox)} name={iconName} size="lg" />
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-prose text-sm text-muted-foreground">{description}</p>}
      {cta && <div className="pt-1">{cta}</div>}
    </div>
  ),
)
EmptyState.displayName = 'EmptyState'
