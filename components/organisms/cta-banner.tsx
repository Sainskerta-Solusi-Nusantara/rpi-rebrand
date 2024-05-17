'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Building2,
  MapPin,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface CTABannerProps {
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const trustBadges = [
  '100% Gratis',
  'Tanpa Kartu Kredit',
  'Akses Selamanya',
]

const dashboardStats = [
  { label: 'Lamaran', value: '8', icon: Briefcase },
  { label: 'Wawancara', value: '3', icon: Calendar },
  { label: 'Tawaran', value: '1', icon: TrendingUp },
]

const miniJobs = [
  {
    title: 'UI/UX Designer',
    company: 'Tokopedia',
    location: 'Jakarta',
    badge: 'Baru',
  },
  {
    title: 'Frontend Developer',
    company: 'Gojek',
    location: 'Remote',
    badge: 'Hot',
  },
]

export function CTABanner({ className }: CTABannerProps) {
  return (
    <section
      className={cn(
        'relative w-full py-20 md:py-28',
        className,
      )}
      aria-labelledby="cta-banner-heading"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="relative overflow-hidden rounded-3xl mx-auto max-w-7xl border border-secondary/30 shadow-2xl bg-primary"
        >
          {/* Layered background image */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80"
              alt=""
              fill
              priority={false}
              sizes="100vw"
              className="object-cover opacity-20 mix-blend-overlay"
            />
          </div>

          {/* Radial gradient accent top-right */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 opacity-30"
            style={{
              background:
                'radial-gradient(circle at 80% 20%, var(--secondary) 0, transparent 50%)',
            }}
          />

          {/* Animated floating decorative shapes */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-20 -left-20 z-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1/3 -right-24 z-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl"
            animate={{
              y: [0, -40, 0],
              x: [0, -20, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/3 z-0 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl"
            animate={{
              y: [0, -25, 0],
              rotate: [0, 45, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Content grid */}
          <div className="relative z-10 grid gap-12 px-8 py-16 md:grid-cols-2 md:gap-10 md:px-16 md:py-20 lg:gap-16">
            {/* LEFT — Copy + CTAs */}
            <div className="flex flex-col justify-center">
              <motion.div
                variants={itemVariants}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                <span>Mulai Hari Ini</span>
              </motion.div>

              <motion.h2
                id="cta-banner-heading"
                variants={itemVariants}
                className="font-heading mt-6 text-4xl font-bold leading-tight text-primary-foreground md:text-5xl"
              >
                Karier Impian Hanya Sejauh Klik
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg"
              >
                Bergabunglah dengan 240K+ pekerja Indonesia yang telah menemukan
                kerja impian melalui Rumah Pekerja Indonesia.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              >
                <Button asChild size="lg" variant="secondary" className="gap-2">
                  <Link href="/register">
                    <Briefcase className="h-5 w-5" />
                    Daftar Gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link href="/courses">
                    <GraduationCap className="h-5 w-5" />
                    Mulai Kursus
                  </Link>
                </Button>
              </motion.div>

              <motion.ul
                variants={itemVariants}
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                {trustBadges.map((badge) => (
                  <li
                    key={badge}
                    className="flex items-center gap-1.5 text-xs text-primary-foreground/70"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                    <span>{badge}</span>
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* RIGHT — Floating dashboard mockup */}
            <motion.div
              variants={itemVariants}
              className="relative hidden min-h-[420px] md:block"
            >
              {/* Main dashboard card */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative z-10 rounded-2xl bg-card p-5 text-card-foreground shadow-2xl ring-1 ring-border/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        Karir Sinta
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dashboard Pelamar
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                    Aktif
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {dashboardStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div
                        key={stat.label}
                        className="rounded-xl bg-muted/60 p-3"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-xl font-bold leading-none">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Mini job cards */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Rekomendasi Untukmu
                  </p>
                  {miniJobs.map((job) => (
                    <div
                      key={job.title}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">
                            {job.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{job.company}</span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {job.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {job.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Floating chip — top-right (offer) */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -right-2 -top-4 z-20 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-secondary-foreground shadow-xl"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold">
                  Anda mendapat tawaran 🎉
                </span>
              </motion.div>

              {/* Floating chip — bottom-left (interview) */}
              <motion.div
                animate={{ y: [0, 12, 0], rotate: [2, -2, 2] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                className="absolute -bottom-4 -left-4 z-20 flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-accent-foreground shadow-xl"
              >
                <Calendar className="h-4 w-4" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wide opacity-80">
                    Hari Ini
                  </p>
                  <p className="text-xs font-semibold">Wawancara 14:00</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTABanner
