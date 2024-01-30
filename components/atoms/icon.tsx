import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon, LucideProps } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const iconVariants = cva('inline-block shrink-0', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    },
  },
  defaultVariants: { size: 'md' },
})

export type IconName = keyof typeof LucideIcons

export interface IconProps
  extends Omit<LucideProps, 'size' | 'ref'>,
    VariantProps<typeof iconVariants> {
  name?: IconName
  icon?: LucideIcon
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, icon, size, className, ...props }, ref) => {
    const Component =
      icon ??
      (name && typeof LucideIcons[name] === 'function'
        ? (LucideIcons[name] as LucideIcon)
        : LucideIcons.HelpCircle)

    return (
      <Component
        ref={ref}
        aria-hidden={props['aria-label'] ? undefined : true}
        className={cn(iconVariants({ size }), className)}
        {...props}
      />
    )
  },
)
Icon.displayName = 'Icon'

export { iconVariants }
