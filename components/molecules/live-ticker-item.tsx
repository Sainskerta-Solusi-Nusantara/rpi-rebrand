'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { LiveDot } from '@/components/atoms/live-dot'
import { cn, formatRupiah } from '@/lib/utils'

export interface LiveTickerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  company: string
  companyLogo?: string | null
  position: string
  location?: string
  salary?: number | null
  live?: boolean
  href?: string
}

export const LiveTickerItem = React.forwardRef<HTMLDivElement, LiveTickerItemProps>(
  ({ className, company, companyLogo, position, location, salary, live = true, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 shadow-sm',
        className,
      )}
      {...props}
    >
      {live && <LiveDot size="sm" tone="success" label="Lowongan baru" />}
      <Avatar src={companyLogo ?? undefined} name={company} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{position}</p>
        <p className="truncate text-xs text-muted-foreground">
          {company}
          {location && (
            <span className="ml-2 inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {location}
            </span>
          )}
        </p>
      </div>
      {salary != null && (
        <span className="shrink-0 text-xs font-semibold text-primary">{formatRupiah(salary)}</span>
      )}
    </motion.div>
  ),
)
LiveTickerItem.displayName = 'LiveTickerItem'
