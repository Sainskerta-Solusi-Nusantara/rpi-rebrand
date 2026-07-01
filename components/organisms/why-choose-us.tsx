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
      className={cn(
        'bg-primary text-primary-foreground relative isolate overflow-hidden py-20 md:py-28',
        className,
      )}
      aria-labelledby="why-rpi-heading"
    >
      {/* Aurora wash on the dark band — gold + constant purple accent */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 60% 50% at 85% 15%, color-mix(in oklab, var(--secondary) 30%, transparent), transparent 60%)',
            'radial-gradient(ellipse 55% 50% at 10% 90%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 60%)',
          ].join(', '),
        }}
      />

      <div className="container mx-auto w-full max-w-6xl px-6">
        {/* Eyebrow + heading */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="bg-secondary h-px w-8" />
          <span className="text-primary-foreground/70 text-xs font-medium uppercase tracking-[0.2em]">
            Mengapa RPI
          </span>
        </div>

        <motion.h2
          id="why-rpi-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="font-heading max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl"
        >
          Bukan sekadar <span className="text-gradient-gold">papan lowongan.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-primary-foreground/70 mt-4 max-w-2xl text-base md:text-lg"
        >
          Infrastruktur karier yang dirancang untuk skala — dari pekerja
          individu sampai instansi nasional.
        </motion.p>

        {/* 2x2 value-prop grid — cards enter alternately from left/right */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:mt-14 md:grid-cols-2 md:gap-6">
          {VALUE_PROPS.map((prop, i) => {
            const Icon = prop.icon
            return (
              <motion.article
                key={prop.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="border-primary-foreground/10 bg-primary-foreground/[0.04] hover:border-secondary/60 card-lift group rounded-2xl border p-6 backdrop-blur-sm md:p-8"
              >
                <div className="bg-secondary/15 text-secondary grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-heading mt-5 text-lg font-semibold md:text-xl">
                  {prop.title}
                </h3>
                <p className="text-primary-foreground/70 mt-2 text-sm md:text-base">
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
