'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SkillChipsProps {
  className?: string
}

interface Chip {
  label: string
  query: string
  featured?: boolean
  icon?: typeof Sparkles
}

const CHIPS: Chip[] = [
  { label: 'Remote', query: 'remote', featured: true, icon: Sparkles },
  { label: 'Fresh Graduate', query: 'fresh graduate' },
  { label: 'Magang/Internship', query: 'magang' },
  { label: 'Software Engineer', query: 'software engineer' },
  { label: 'UI/UX Designer', query: 'ui ux designer' },
  { label: 'Data Analyst', query: 'data analyst' },
  { label: 'Digital Marketing', query: 'digital marketing' },
  { label: 'Product Manager', query: 'product manager' },
  { label: 'Customer Service', query: 'customer service' },
  { label: 'Akuntan', query: 'akuntan' },
  { label: 'Sales', query: 'sales' },
  { label: 'Administrasi', query: 'administrasi' },
  { label: 'Content Creator', query: 'content creator' },
  { label: 'Mobile Developer', query: 'mobile developer' },
  { label: 'DevOps', query: 'devops' },
  { label: 'Project Manager', query: 'project manager' },
  { label: 'Graphic Designer', query: 'graphic designer' },
  { label: 'HR', query: 'hr' },
  { label: 'Operasional', query: 'operasional' },
  { label: 'Quality Assurance', query: 'quality assurance' },
]

export function SkillChips(props: SkillChipsProps): JSX.Element {
  const { className } = props

  return (
    <section
      className={cn(
        'bg-background border-y border-border py-12 md:py-16',
        className,
      )}
      aria-labelledby="skill-chips-title"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <span
            id="skill-chips-title"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            Pencarian Populer
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4">
          {CHIPS.map((chip, i) => {
            const Icon = chip.icon
            return (
              <motion.div
                key={chip.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: 'easeOut' }}
              >
                <Link
                  href={`/jobs?q=${encodeURIComponent(chip.query)}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:scale-105',
                    chip.featured
                      ? 'border-secondary bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'
                      : 'border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary',
                  )}
                  aria-label={`Cari lowongan ${chip.label}`}
                >
                  {Icon ? (
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Search className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  )}
                  <span>{chip.label}</span>
                </Link>
              </motion.div>
            )
          })}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.3,
              delay: CHIPS.length * 0.03,
              ease: 'easeOut',
            }}
          >
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              aria-label="Lihat semua lowongan"
            >
              <span>Lihat semua</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default SkillChips
