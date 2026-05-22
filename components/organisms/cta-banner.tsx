'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2 } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface CTABannerProps {
  className?: string
}

export function CTABanner({ className }: CTABannerProps) {
  return (
    <section
      className={cn('bg-muted/30 py-16 md:py-24', className)}
      aria-labelledby="cta-banner-heading"
    >
      <div className="container mx-auto w-full max-w-3xl px-6 text-center">
        <motion.h2
          id="cta-banner-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Siap memulai karier baru?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base text-muted-foreground md:text-lg"
        >
          Bergabunglah dengan 240.000+ pekerja dan 850+ mitra Indonesia yang
          sudah bertumbuh di Rumah Pekerja Indonesia.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="/register">
              Daftar Gratis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
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
