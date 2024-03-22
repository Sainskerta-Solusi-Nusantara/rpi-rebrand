'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative flex w-full gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      tone: {
        info: 'border-primary/30 bg-primary/5 text-foreground [&_[data-alert-icon]]:text-primary',
        success: 'border-success/30 bg-success/10 text-foreground [&_[data-alert-icon]]:text-success',
        warning: 'border-warning/30 bg-warning/10 text-foreground [&_[data-alert-icon]]:text-warning',
        error: 'border-destructive/30 bg-destructive/10 text-foreground [&_[data-alert-icon]]:text-destructive',
      },
    },
    defaultVariants: { tone: 'info' },
  },
)

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
} as const

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode
  description?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  dismissLabel?: string
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, tone = 'info', title, description, dismissible, onDismiss, dismissLabel = 'Tutup', children, ...props },
    ref,
  ) => {
    const Icon = iconMap[tone ?? 'info']
    return (
      <div
        ref={ref}
        role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
        className={cn(alertVariants({ tone }), className)}
        {...props}
      >
        <Icon data-alert-icon="" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold leading-tight">{title}</p>}
          {description && <div className={cn('text-sm text-muted-foreground', title && 'mt-1')}>{description}</div>}
          {children}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)
Alert.displayName = 'Alert'

export { alertVariants }
