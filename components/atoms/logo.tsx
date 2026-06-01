import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface LogoProps {
  src?: string | null
  mark?: boolean
  href?: string
  className?: string
  alt?: string
  /** Compact icon-only render. Alias for `mark`. */
  iconOnly?: boolean
  /** Tenant name override (replaces default 'RPI' wordmark when no src). */
  tenantName?: string | null
  /** Tenant-supplied logo URL (alias for `src`). */
  tenantLogoUrl?: string | null
}

export function Logo({
  src,
  mark = false,
  iconOnly,
  href,
  className,
  alt = 'Rumah Pekerja Indonesia',
  tenantName,
  tenantLogoUrl,
}: LogoProps) {
  const effectiveSrc = src ?? tenantLogoUrl ?? null
  const effectiveMark = mark || iconOnly === true
  const effectiveAlt = tenantName ?? alt
  const content = effectiveSrc ? (
    <Image
      src={effectiveSrc}
      alt={effectiveAlt}
      width={effectiveMark ? 32 : 140}
      height={effectiveMark ? 32 : 36}
      priority
      className={cn('h-9 w-auto object-contain', effectiveMark && 'h-8 w-8')}
    />
  ) : (
    <span
      aria-label={effectiveAlt}
      className={cn(
        'inline-flex items-baseline gap-1 font-heading text-xl font-bold tracking-tight text-primary',
        effectiveMark && 'text-2xl',
      )}
    >
      <span>{tenantName ?? 'RPI'}</span>
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ring)]" aria-hidden="true" />
    </span>
  )

  if (href) {
    return (
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={href as any}
        aria-label={effectiveAlt}
        className={cn(
          'inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        {content}
      </Link>
    )
  }

  return <span className={cn('inline-flex items-center', className)}>{content}</span>
}

Logo.displayName = 'Logo'
