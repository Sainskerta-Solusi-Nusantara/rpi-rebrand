import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textVariants = cva('font-sans', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive',
      success: 'text-success',
      warning: 'text-warning',
      inverse: 'text-background',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    leading: {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    },
  },
  defaultVariants: { size: 'base', tone: 'default', weight: 'normal', align: 'left', leading: 'normal' },
})

type TextTag = 'p' | 'span' | 'div' | 'small' | 'strong' | 'em'

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: TextTag
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as = 'p', size, tone, weight, align, leading, children, ...props }, ref) => {
    return React.createElement(
      as,
      {
        ref,
        className: cn(textVariants({ size, tone, weight, align, leading }), className),
        ...props,
      },
      children,
    )
  },
)
Text.displayName = 'Text'

export { textVariants }
