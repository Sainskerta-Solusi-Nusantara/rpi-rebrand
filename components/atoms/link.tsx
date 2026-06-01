import * as React from 'react'
import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const linkVariants = cva(
  'inline-flex items-center gap-1 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'text-primary underline-offset-4 hover:underline',
        muted: 'text-muted-foreground hover:text-foreground',
        subtle: 'text-foreground hover:text-primary',
        secondary: 'text-secondary-foreground hover:text-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    Omit<NextLinkProps<string>, 'href'>,
    VariantProps<typeof linkVariants> {
  href: NextLinkProps<string>['href']
  external?: boolean
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, variant, size, external, children, ...props }, ref) => {
    if (external) {
      const url = typeof href === 'string' ? href : ''
      return (
        <a
          ref={ref}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(linkVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </a>
      )
    }
    return (
      <NextLink ref={ref} href={href} className={cn(linkVariants({ variant, size }), className)} {...props}>
        {children}
      </NextLink>
    )
  },
)
Link.displayName = 'Link'

export { linkVariants }
