'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  error?: boolean
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', prefix, suffix, error, containerClassName, disabled, ...props }, ref) => {
    if (prefix || suffix) {
      return (
        <div
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg border bg-background px-3 ring-offset-background transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            error ? 'border-destructive' : 'border-input',
            disabled && 'cursor-not-allowed opacity-50',
            containerClassName,
          )}
        >
          {prefix && <span className="flex shrink-0 items-center text-muted-foreground">{prefix}</span>}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            aria-invalid={error || undefined}
            className={cn(
              'flex h-full w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          />
          {suffix && <span className="flex shrink-0 items-center text-muted-foreground">{suffix}</span>}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          error ? 'border-destructive' : 'border-input',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
