'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, FileSignature, Send, UserPlus } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface HowItWorksProps {
  className?: string
}

interface Step {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  note: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Buat profil',
    description: 'Daftar gratis dan lengkapi data dasar — pendidikan, pengalaman, keahlian.',
    note: '2 menit',
  },
  {
    number: '02',
    icon: Briefcase,
    title: 'Cari lowongan relevan',
    description: 'Filter berdasarkan industri, lokasi, gaji, atau biarkan rekomendasi membantu.',
    note: 'Auto match',
  },
  {
    number: '03',
    icon: Send,
    title: 'Lamar dengan satu klik',
    description: 'CV profil otomatis terkirim. Lacak status lamaran secara real-time.',
    note: 'Tracking live',
  },
  {
    number: '04',
    icon: FileSignature,
    title: 'Terima tawaran kerja',
    description: 'Negosiasi dan finalisasi kontrak melalui platform. Mulai hari pertamamu.',
    note: 'Notifikasi instan',
  },
]

export function HowItWorks({ className }: HowItWorksProps): JSX.Element {
  return (
    <section
      className={cn('bg-muted/30 py-16 md:py-20', className)}
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        {/* Eyebrow + heading */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Cara kerja
          </span>
        </div>

        <motion.h2
          id="how-it-works-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Dari daftar sampai diterima,
          <br />
          <span className="text-foreground/85">dalam 4 langkah.</span>
        </motion.h2>

        {/* Steps */}
        <div className="relative mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {/* Connecting line — desktop only, behind cards */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-12 hidden border-t border-dashed border-border lg:block"
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[color:var(--ring)]"
              >
                {/* Number badge — sits on the connecting line */}
                <div className="relative mb-5 flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-background text-xs font-semibold text-[color:var(--ring)] ring-1 ring-border">
                    {step.number}
                  </span>
                  <Icon
                    aria-hidden
                    className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-[color:var(--ring)]"
                  />
                </div>

                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>

                <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-[color:var(--ring)]">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-[color:var(--ring)]" />
                  {step.note}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <Button asChild size="lg">
            <Link href="/register">
              Mulai sekarang
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
