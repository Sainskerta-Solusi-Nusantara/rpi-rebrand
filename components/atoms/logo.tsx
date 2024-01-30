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
}

export function Logo({ src, mark = false, href, className, alt = 'Rumah Pekerja Indonesia' }: LogoProps) {
  const content = src ? (
    <Image
      src={src}
      alt={alt}
      width={mark ? 32 : 140}
      height={mark ? 32 : 36}
      priority
      className={cn('h-9 w-auto object-contain', mark && 'h-8 w-8')}
    />
  ) : (
    <span
      aria-label={alt}
      className={cn(
        'inline-flex items-baseline gap-1 font-heading text-xl font-bold tracking-tight text-primary',
        mark && 'text-2xl',
      )}
    >
      <span>RPI</span>
      <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true" />
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label={alt}
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
