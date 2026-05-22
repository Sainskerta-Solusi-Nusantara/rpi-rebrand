'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Award, Building2, Handshake, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WhyChooseUsProps {
  className?: string
}

interface ValueProp {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: ShieldCheck,
    title: 'Lowongan Terverifikasi',
    description:
      'Setiap mitra divalidasi legal & terdaftar resmi sebelum dapat memposting lowongan.',
  },
  {
    icon: Award,
    title: 'Pelatihan Bersertifikat',
    description:
      'Kursus tervalidasi industri dan lembaga pemerintahan yang diakui secara nasional.',
  },
  {
    icon: Handshake,
    title: 'Dual Marketplace',
    description:
      'Pekerja dan perusahaan bertemu di satu platform — tanpa perantara, tanpa biaya tersembunyi.',
  },
  {
    icon: Building2,
    title: 'Multi-Tenant Aktif',
    description:
      'Dipakai enterprise, BUMN, dan instansi nasional dengan brand & policy mereka sendiri.',
  },
]

export function WhyChooseUs({ className }: WhyChooseUsProps): JSX.Element {
  return (
    <section
      className={cn('bg-background py-16 md:py-20', className)}
      aria-labelledby="why-rpi-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        {/* Eyebrow + heading */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Mengapa RPI
          </span>
        </div>

        <motion.h2
          id="why-rpi-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Bukan sekadar papan lowongan.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          Infrastruktur karier yang dirancang untuk skala — dari pekerja
          individu sampai instansi nasional.
        </motion.p>

        {/* 2x2 value-prop grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:mt-14 md:grid-cols-2 md:gap-6">
          {VALUE_PROPS.map((prop, i) => {
            const Icon = prop.icon
            return (
              <motion.article
                key={prop.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[color:var(--ring)] md:p-8"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[color:color-mix(in_oklab,var(--ring)_12%,transparent)] text-[color:var(--ring)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-heading mt-5 text-lg font-semibold text-foreground md:text-xl">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  {prop.description}
                </p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
