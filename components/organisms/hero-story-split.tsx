'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/atoms/button'
import { LiveJobTicker, type LiveJobTickerEntry } from './live-job-ticker'
import { cn } from '@/lib/utils'

export interface HeroStorySplitProps {
  eyebrow?: string
  headline?: string
  body?: string
  jobs: LiveJobTickerEntry[]
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  className?: string
}

export function HeroStorySplit({
  eyebrow = 'Rumah Pekerja Indonesia',
  headline = 'Karier impian dimulai dari Rumah Pekerja Indonesia',
  body = 'Temukan ribuan lowongan terverifikasi, pelatihan bersertifikat, dan komunitas yang mendukung perjalanan profesionalmu — semua di satu rumah.',
  jobs,
  primaryHref = '/jobs',
  primaryLabel = 'Cari Kerja',
  secondaryHref = '/lms',
  secondaryLabel = 'Pelatihan',
  className,
}: HeroStorySplitProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, var(--secondary) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--accent) 0, transparent 45%)',
        }}
      />

      <div className="container relative grid gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col justify-center"
        >
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
            {eyebrow}
          </span>

          <h1 className="font-heading text-4xl leading-tight md:text-5xl lg:text-6xl">
            {headline.split('Rumah Pekerja Indonesia').map((seg, i, arr) => (
              <React.Fragment key={i}>
                {seg}
                {i < arr.length - 1 ? (
                  <span className="text-secondary italic"> Rumah Pekerja Indonesia</span>
                ) : null}
              </React.Fragment>
            ))}
          </h1>

          <p className="mt-5 max-w-xl text-base text-primary-foreground/80 md:text-lg">{body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link href={primaryHref as any}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link href={secondaryHref as any}>
                <GraduationCap className="h-4 w-4" />
                {secondaryLabel}
              </Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-primary-foreground/10 pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">Lowongan</dt>
              <dd className="font-heading text-2xl text-secondary">12K+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">Mitra</dt>
              <dd className="font-heading text-2xl text-secondary">850+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">Talenta</dt>
              <dd className="font-heading text-2xl text-secondary">240K</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <div className="w-full max-w-md text-foreground">
            <LiveJobTicker jobs={jobs} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HeroStorySplit
