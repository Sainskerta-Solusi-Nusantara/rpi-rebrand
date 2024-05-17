'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  UserPlus,
  FileText,
  Search,
  Send,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

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
  bullets: [string, string]
  iconWrapperClass: string
  iconClass: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Daftar Gratis',
    description:
      'Buat akun dalam 30 detik. Lengkapi profil dengan keahlian dan pengalamanmu.',
    bullets: ['Tanpa kartu kredit', 'Profile builder cerdas'],
    iconWrapperClass: 'bg-accent/10',
    iconClass: 'text-accent',
  },
  {
    number: '02',
    icon: FileText,
    title: 'Bangun CV Profesional',
    description:
      'Gunakan CV builder kami yang sudah dipakai 240K+ pekerja. Template ATS-friendly.',
    bullets: ['Template gratis', 'Format ATS-friendly'],
    iconWrapperClass: 'bg-secondary/15',
    iconClass: 'text-secondary',
  },
  {
    number: '03',
    icon: Search,
    title: 'Cari & Lamar',
    description:
      'Telusuri 12.000+ lowongan terverifikasi. Filter berdasarkan gaji, lokasi, dan industri.',
    bullets: ['Lowongan terverifikasi', 'Filter pintar'],
    iconWrapperClass: 'bg-emerald-500/10',
    iconClass: 'text-emerald-500',
  },
  {
    number: '04',
    icon: Send,
    title: 'Dapatkan Kerja',
    description:
      'Lamar dengan 1 klik. Pantau status lamaran, dapatkan tawaran, mulai karier baru.',
    bullets: ['1-click apply', 'Notifikasi real-time'],
    iconWrapperClass: 'bg-rose-500/10',
    iconClass: 'text-rose-500',
  },
]

export function HowItWorks(props: HowItWorksProps): JSX.Element {
  const { className } = props

  return (
    <section
      className={cn('py-20 md:py-28 bg-background', className)}
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-medium text-secondary"
          >
            Cara Kerja
          </motion.span>

          <motion.h2
            id="how-it-works-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-foreground mt-4"
          >
            Dari Daftar Hingga Diterima Kerja, dalam 4 Langkah Mudah
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-base md:text-lg text-muted-foreground"
          >
            Platform kami dirancang untuk membantu kamu menemukan kerja impian
            dengan cara paling sederhana.
          </motion.p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative">
          {/* Dashed connector line (lg+) */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-1/3 left-0 right-0 h-0 border-t-2 border-dashed border-secondary/30 -z-10"
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative rounded-2xl bg-card border border-border p-6 hover:shadow-xl hover:-translate-y-1 transition group"
              >
                {/* Big step number */}
                <span
                  aria-hidden="true"
                  className="text-6xl font-heading font-bold text-secondary/20 absolute top-4 right-5 leading-none select-none"
                >
                  {step.number}
                </span>

                {/* Icon circle */}
                <div
                  className={cn(
                    'h-14 w-14 rounded-2xl grid place-items-center',
                    step.iconWrapperClass
                  )}
                >
                  <Icon className={cn('h-7 w-7', step.iconClass)} />
                </div>

                {/* Title */}
                <h3 className="font-heading text-lg font-semibold mt-4 text-foreground">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mt-2">
                  {step.description}
                </p>

                {/* Bullets */}
                <ul className="mt-4 space-y-2">
                  {step.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2
                        className={cn('h-4 w-4 shrink-0 mt-0.5', step.iconClass)}
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Sudah siap?
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/register">
              Mulai Sekarang Gratis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
