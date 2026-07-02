'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, Sparkles } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface CTABannerProps {
  className?: string
}

export function CTABanner({ className }: CTABannerProps) {
  return (
    <section
      className={cn(
        'bg-primary text-primary-foreground relative isolate overflow-hidden py-20 md:py-28',
        className,
      )}
      aria-labelledby="cta-banner-heading"
    >
      {/* Drifting aurora + floating orb for depth */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 55% 60% at 20% 20%, color-mix(in oklab, var(--accent) 32%, transparent), transparent 60%)',
            'radial-gradient(ellipse 60% 60% at 82% 90%, color-mix(in oklab, var(--secondary) 30%, transparent), transparent 60%)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden
        className="animate-float bg-secondary pointer-events-none absolute -right-20 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
      />

      <div className="container mx-auto w-full max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-5 flex justify-center"
        >
          <span className="border-secondary/30 bg-secondary/10 text-secondary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Dipercaya 850+ mitra di Indonesia
          </span>
        </motion.div>

        <motion.h2
          id="cta-banner-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-heading text-3xl font-semibold tracking-tight md:text-5xl"
        >
          Siap memulai <span className="text-gradient-gold">karier baru?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-primary-foreground/75 mt-4 text-base md:text-lg"
        >
          Bergabunglah dengan 240.000+ pekerja dan 850+ mitra Indonesia yang
          sudah bertumbuh di SSN Pekerja.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">
              Daftar Gratis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent"
          >
            <Link href="/mitra">
              <Building2 className="h-4 w-4" aria-hidden />
              Untuk Perusahaan
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default CTABanner
