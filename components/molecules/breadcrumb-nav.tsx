import * as React from 'react'
import NextLink from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: React.ReactNode
  href?: string
}

export interface BreadcrumbNavProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
}

export const BreadcrumbNav = React.forwardRef<HTMLElement, BreadcrumbNavProps>(
  ({ className, items, separator, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {it.href && !isLast ? (
                <NextLink
                  href={it.href}
                  className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {it.label}
                </NextLink>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={cn(isLast && 'font-medium text-foreground')}>
                  {it.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-muted-foreground/60">
                  {separator ?? <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  ),
)
BreadcrumbNav.displayName = 'BreadcrumbNav'
