'use client'

import * as React from 'react'
import { Label } from '@/components/atoms/label'
import { ErrorText } from '@/components/atoms/error-text'
import { HelperText } from '@/components/atoms/helper-text'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode
  htmlFor?: string
  required?: boolean
  error?: React.ReactNode
  helper?: React.ReactNode
  hideLabel?: boolean
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, required, error, helper, hideLabel, children, ...props }, ref) => {
    const fieldId = React.useId()
    const id = htmlFor ?? fieldId
    const descId = helper ? `${id}-helper` : undefined
    const errorId = error ? `${id}-error` : undefined

    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        {label && (
          <Label htmlFor={id} required={required} className={cn(hideLabel && 'sr-only')}>
            {label}
          </Label>
        )}
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': [descId, errorId].filter(Boolean).join(' ') || undefined,
            })
          : children}
        {helper && !error && (
          <HelperText id={descId}>{helper}</HelperText>
        )}
        {error && <ErrorText id={errorId}>{error}</ErrorText>}
      </div>
    )
  },
)
FormField.displayName = 'FormField'
