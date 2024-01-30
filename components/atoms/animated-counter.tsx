'use client'

import * as React from 'react'
import { animate, useInView, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AnimatedCounterProps {
  value: number
  duration?: number
  format?: 'id-ID' | 'en-US'
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  format = 'id-ID',
  prefix,
  suffix,
  className,
}: AnimatedCounterProps): JSX.Element {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionVal = useMotionValue(0)
  const [display, setDisplay] = React.useState<number>(0)
  const [mounted, setMounted] = React.useState<boolean>(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const unsubscribe = motionVal.on('change', (latest: number) => {
      setDisplay(Math.round(latest))
    })
    return unsubscribe
  }, [motionVal])

  React.useEffect(() => {
    if (!mounted || !inView) return
    const controls = animate(motionVal, value, {
      duration,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [mounted, inView, value, duration, motionVal])

  const formatted = new Intl.NumberFormat(format).format(display)

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
