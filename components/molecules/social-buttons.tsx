'use client'

import * as React from 'react'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { cn } from '@/lib/utils'

export type SocialProvider = 'google' | 'linkedin'

export interface SocialButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  provider: SocialProvider
  loading?: boolean
  label?: React.ReactNode
}

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="18"
      height="18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3 0 5.7 1.1 7.8 2.9l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.4-4.6 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6.2 5.2C41.6 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  )
}

function LinkedInMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.78C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.78 24h20.44c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z"
      />
    </svg>
  )
}

const providerConfig: Record<SocialProvider, { label: string; mark: React.ReactNode }> = {
  google: { label: 'Lanjutkan dengan Google', mark: <GoogleMark /> },
  linkedin: { label: 'Lanjutkan dengan LinkedIn', mark: <LinkedInMark /> },
}

export const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(
  ({ className, provider, loading, label, disabled, ...props }, ref) => {
    const config = providerConfig[provider]
    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        className={cn('w-full justify-center gap-2 bg-background', className)}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : config.mark}
        <span>{label ?? config.label}</span>
      </Button>
    )
  },
)
SocialButton.displayName = 'SocialButton'

export interface SocialButtonsProps extends React.HTMLAttributes<HTMLDivElement> {
  providers?: SocialProvider[]
  onProviderClick?: (provider: SocialProvider) => void
  loadingProvider?: SocialProvider | null
  disabled?: boolean
}

export const SocialButtons = React.forwardRef<HTMLDivElement, SocialButtonsProps>(
  (
    { className, providers = ['google', 'linkedin'], onProviderClick, loadingProvider, disabled, ...props },
    ref,
  ) => (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      {providers.map((p) => (
        <SocialButton
          key={p}
          provider={p}
          loading={loadingProvider === p}
          disabled={disabled || (loadingProvider !== null && loadingProvider !== undefined && loadingProvider !== p)}
          onClick={() => onProviderClick?.(p)}
        />
      ))}
    </div>
  ),
)
SocialButtons.displayName = 'SocialButtons'
