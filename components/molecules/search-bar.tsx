'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface SearchBarProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  variant?: 'hero' | 'inline'
  placeholder?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  onSearch?: (value: string) => void
  ctaLabel?: string
  showButton?: boolean
}

export const SearchBar = React.forwardRef<HTMLFormElement, SearchBarProps>(
  (
    {
      className,
      variant = 'inline',
      placeholder = 'Cari lowongan, perusahaan, atau kursus...',
      defaultValue,
      value: controlledValue,
      onValueChange,
      onSearch,
      ctaLabel = 'Cari',
      showButton = true,
      ...props
    },
    ref,
  ) => {
    const [internal, setInternal] = React.useState(defaultValue ?? '')
    const value = controlledValue ?? internal

    const handleChange = (v: string) => {
      if (controlledValue === undefined) setInternal(v)
      onValueChange?.(v)
    }

    return (
      <form
        ref={ref}
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          onSearch?.(value)
        }}
        className={cn(
          'flex w-full items-center gap-2',
          variant === 'hero' &&
            'rounded-2xl border border-border bg-background p-2 shadow-lg',
          className,
        )}
        {...props}
      >
        <Input
          type="search"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          prefix={<Search className="h-4 w-4" aria-hidden="true" />}
          aria-label={placeholder}
          containerClassName={cn(
            variant === 'hero' && 'h-12 border-transparent shadow-none focus-within:ring-0',
          )}
          className={cn(variant === 'hero' && 'text-base')}
        />
        {showButton && (
          <Button type="submit" size={variant === 'hero' ? 'lg' : 'md'} variant="default">
            {ctaLabel}
          </Button>
        )}
      </form>
    )
  },
)
SearchBar.displayName = 'SearchBar'
