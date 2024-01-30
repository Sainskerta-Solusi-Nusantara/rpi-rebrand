import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const headingVariants = cva('font-heading tracking-tight text-foreground', {
  variants: {
    level: {
      1: 'text-4xl font-bold md:text-5xl',
      2: 'text-3xl font-bold md:text-4xl',
      3: 'text-2xl font-semibold md:text-3xl',
      4: 'text-xl font-semibold md:text-2xl',
      5: 'text-lg font-semibold',
      6: 'text-base font-semibold',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      inverse: 'text-background',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: { level: 2, tone: 'default', align: 'left' },
})

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    Omit<VariantProps<typeof headingVariants>, 'level'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  as?: HeadingTag
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, as, tone, align, children, ...props }, ref) => {
    const Tag = (as ?? (`h${level}` as HeadingTag)) as HeadingTag
    return React.createElement(
      Tag,
      {
        ref,
        className: cn(headingVariants({ level, tone, align }), className),
        ...props,
      },
      children,
    )
  },
)
Heading.displayName = 'Heading'

export { headingVariants }
