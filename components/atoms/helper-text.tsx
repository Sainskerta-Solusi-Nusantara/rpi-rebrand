import * as React from 'react'
import { cn } from '@/lib/utils'

export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <p ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props}>
        {children}
      </p>
    )
  },
)
HelperText.displayName = 'HelperText'
