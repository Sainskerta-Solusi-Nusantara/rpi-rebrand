'use client'

import * as React from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion'
import {
  Briefcase,
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Stat {
  label: string
  value: number | string
  icon?: 'jobs' | 'talents' | 'partners' | 'courses' | 'growth'
  suffix?: string
}

export interface StatsStripProps {
  stats?: Stat[]
  className?: string
}

type IconKey = NonNullable<Stat['icon']>

const ICON_MAP: Record<IconKey, LucideIcon> = {
  jobs: Briefcase,
  talents: Users,
  partners: Building2,
  courses: GraduationCap,
  growth: TrendingUp,
}

// Tailwind needs full class names to be statically present so JIT can pick them up.
const ICON_COLORS: Record<IconKey, string> = {
  jobs: 'bg-secondary/15 text-secondary',
  talents: 'bg-accent/15 text-accent',
  partners: 'bg-emerald-500/15 text-emerald-500',
  courses: 'bg-orange-500/15 text-orange-500',
  growth: 'bg-rose-500/15 text-rose-500',
}

const DEFAULT_STATS: Stat[] = [
  { label: 'Lowongan Aktif', value: 12000, icon: 'jobs', suffix: '+' },
  { label: 'Pekerja Terdaftar', value: 240000, icon: 'talents', suffix: '+' },
  { label: 'Mitra Terverifikasi', value: 850, icon: 'partners', suffix: '+' },
  { label: 'Kursus Tersedia', value: 500, icon: 'courses', suffix: '+' },
]

const numberFormatter = new Intl.NumberFormat('id-ID')

interface AnimatedCounterProps {
  value: number
  suffix?: string
  className?: string
}

function AnimatedCounter({ value, suffix, className }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) =>
    numberFormatter.format(Math.round(latest)),
  )
  const [display, setDisplay] = React.useState('0')

  React.useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => setDisplay(latest))
    return () => unsubscribe()
  }, [rounded])

  React.useEffect(() => {
    if (!inView) return
    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [inView, value, count])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix ? <span className="text-secondary">{suffix}</span> : null}
    </span>
  )
}

interface StaticValueProps {
  value: string
  suffix?: string
  className?: string
}

function StaticValue({ value, suffix, className }: StaticValueProps) {
  return (
    <span className={className}>
      {value}
      {suffix ? <span className="text-secondary">{suffix}</span> : null}
    </span>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      delay: i * 0.1,
    },
  }),
}

export function StatsStrip({ stats, className }: StatsStripProps) {
  const data = stats && stats.length > 0 ? stats : DEFAULT_STATS

  return (
    <section
      className={cn('-mt-12 md:-mt-16 relative z-10', className)}
      aria-label="Statistik platform"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {data.map((stat, index) => {
            const iconKey: IconKey = stat.icon ?? 'jobs'
            const Icon = ICON_MAP[iconKey]
            const iconColor = ICON_COLORS[iconKey]
            const isNumeric = typeof stat.value === 'number'

            return (
              <motion.div
                key={`${stat.label}-${index}`}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-10% 0px' }}
                whileHover={{ y: -4 }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-border',
                  'bg-gradient-to-br from-card to-muted/30',
                  'p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl',
                )}
              >
                {/* Decorative icon top-right */}
                <div
                  className={cn(
                    'absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl',
                    iconColor,
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Bottom-left: number + label */}
                <div className="mt-12 flex flex-col gap-1">
                  <div className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                    {isNumeric ? (
                      <AnimatedCounter
                        value={stat.value as number}
                        suffix={stat.suffix}
                      />
                    ) : (
                      <StaticValue
                        value={String(stat.value)}
                        suffix={stat.suffix}
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default StatsStrip
