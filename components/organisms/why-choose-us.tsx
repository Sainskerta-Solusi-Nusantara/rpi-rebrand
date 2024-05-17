'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Zap,
  Award,
  Users,
  Heart,
  TrendingUp,
  Globe,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WhyChooseUsProps {
  className?: string
}

interface Benefit {
  icon: typeof ShieldCheck
  title: string
  description: string
  iconBg: string
  iconColor: string
}

const benefits: Benefit[] = [
  {
    icon: ShieldCheck,
    title: 'Lowongan Terverifikasi',
    description:
      'Semua perusahaan mitra melalui verifikasi ketat. Bye-bye lowongan palsu.',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Zap,
    title: 'Lamar Cepat 1-Klik',
    description:
      'Profil + CV terhubung otomatis. Lamar tanpa upload ulang.',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
  },
  {
    icon: Award,
    title: 'Sertifikat Diakui Industri',
    description:
      'Kursus RPI Academy diakui 850+ perusahaan mitra.',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  {
    icon: Users,
    title: 'Komunitas Mendukung',
    description:
      'Bergabung dengan 240K+ profesional Indonesia yang saling support.',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
  },
  {
    icon: TrendingUp,
    title: 'Naik Gaji 87% Rata-Rata',
    description:
      'Alumni kami berhasil naik gaji setelah upskilling dengan RPI.',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
  },
  {
    icon: Heart,
    title: 'Selalu Gratis untuk Pekerja',
    description:
      'Tidak ada biaya tersembunyi. Selamanya gratis untuk pencari kerja.',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
  },
]

export function WhyChooseUs(props: WhyChooseUsProps): JSX.Element {
  const { className } = props

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-muted/30 py-20 md:py-28',
        className,
      )}
    >
      {/* Subtle radial gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, hsl(var(--secondary) / 0.08), transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.06), transparent 55%)',
        }}
      />

      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* LEFT — Visual collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative"
          >
            {/* Decorative gold border ring */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 -z-10 rounded-[2rem] border-2 border-secondary/30"
            />

            {/* Main image card */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-secondary/30 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80"
                alt="Tim profesional Indonesia berjabat tangan setelah kesepakatan kerja"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
                priority={false}
              />
              {/* Subtle overlay for depth */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent"
              />
            </div>

            {/* Top-right floating stat card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              className="absolute -right-4 top-8 rounded-2xl border border-border bg-card p-4 shadow-xl md:-right-6"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary/10">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="font-heading text-3xl text-secondary">
                    +87%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    kenaikan gaji rata-rata
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom-left floating verified badge */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 5,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: 0.5,
              }}
              className="absolute -left-4 bottom-10 rounded-2xl border border-border bg-card p-4 shadow-xl md:-left-6"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary/15">
                  <Award className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold">
                    100% Mitra Terverifikasi
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aman & terpercaya
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tiny accent sparkle */}
            <motion.div
              animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
              transition={{
                duration: 3,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              className="absolute -top-3 left-10 hidden md:block"
              aria-hidden="true"
            >
              <Sparkles className="h-6 w-6 text-secondary" />
            </motion.div>
          </motion.div>

          {/* RIGHT — Content */}
          <div>
            {/* Eyebrow chip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary"
            >
              <Globe className="h-3.5 w-3.5" />
              Mengapa RPI
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl"
            >
              Platform Karier yang Memikirkanmu
            </motion.h2>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg"
            >
              Kami bukan sekadar papan lowongan. Kami membangun ekosistem yang
              membantu kamu tumbuh dari awal karier hingga sukses.
            </motion.p>

            {/* Benefit cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.08,
                      ease: 'easeOut',
                    }}
                    className="group rounded-xl border border-border bg-card p-5 transition hover:border-secondary/40 hover:shadow-lg"
                  >
                    <div
                      className={cn(
                        'grid h-10 w-10 place-items-center rounded-lg transition-transform group-hover:scale-110',
                        benefit.iconBg,
                      )}
                    >
                      <Icon className={cn('h-5 w-5', benefit.iconColor)} />
                    </div>
                    <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
