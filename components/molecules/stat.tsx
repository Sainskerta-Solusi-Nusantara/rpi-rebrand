'use client'

import * as React from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface StatProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number
  label: React.ReactNode
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  duration?: number
  decimals?: number
  description?: React.ReactNode
  align?: 'left' | 'center' | 'right'
}

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  (
    { className, value, label, prefix, suffix, duration = 1.4, decimals = 0, description, align = 'left', ...props },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)
    const inView = useInView(innerRef, { once: true, amount: 0.5 })
    const count = useMotionValue(0)
    const rounded = useTransform(count, (v) => formatNumber(v, decimals))

    React.useEffect(() => {
      if (inView) {
        const controls = animate(count, value, { duration, ease: 'easeOut' })
        return controls.stop
      }
      return undefined
    }, [inView, value, duration, count])

    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'

    return (
      <div ref={innerRef} className={cn('flex flex-col gap-1', alignClass, className)} {...props}>
        <div className="inline-flex items-baseline gap-1 font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {prefix && <span className="text-2xl text-muted-foreground">{prefix}</span>}
          <motion.span aria-live="polite">{rounded}</motion.span>
          {suffix && <span className="text-2xl text-secondary">{suffix}</span>}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
      </div>
    )
  },
)
Stat.displayName = 'Stat'
