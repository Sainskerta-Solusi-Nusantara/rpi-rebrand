import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const ErrorText = React.forwardRef<HTMLParagraphElement, ErrorTextProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <p
        ref={ref}
        role="alert"
        className={cn('text-xs font-medium text-destructive', className)}
        {...props}
      >
        {children}
      </p>
    )
  },
)
ErrorText.displayName = 'ErrorText'
