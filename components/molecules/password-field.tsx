'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from '@/components/atoms/input'
import { cn } from '@/lib/utils'

export interface PasswordFieldProps extends Omit<InputProps, 'type' | 'suffix'> {
  toggleLabel?: { show: string; hide: string }
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, toggleLabel = { show: 'Tampilkan kata sandi', hide: 'Sembunyikan kata sandi' }, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={className}
        suffix={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? toggleLabel.hide : toggleLabel.show}
            aria-pressed={visible}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            )}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    )
  },
)
PasswordField.displayName = 'PasswordField'
