'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Quote, Star, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TestimonialVideoProps {
  testimonial?: {
    user?: { name?: string | null; image?: string | null; headline?: string | null } | null
    course?: { title?: string | null; slug?: string | null } | null
  } | null
  className?: string
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80'

const STATS = [
  {
    value: '+87%',
    label: 'kenaikan gaji rata-rata alumni',
  },
  {
    value: '92%',
    label: 'alumni langsung dapat kerja dalam 3 bulan',
  },
  {
    value: '4.9/5',
    label: 'rating dari 12K+ alumni',
  },
] as const

export function TestimonialVideo({ testimonial, className }: TestimonialVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const userName = testimonial?.user?.name || 'Sinta Maharani'
  const userHeadline =
    testimonial?.user?.headline || 'Senior Frontend Engineer at Tokopedia'
  const userImage = testimonial?.user?.image || FALLBACK_IMAGE
  const courseTitle =
    testimonial?.course?.title || 'Fundamentals of Software Engineering'

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-secondary/10 via-background to-accent/5 py-16 md:py-24',
        className,
      )}
    >
      {/* decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="container relative mx-auto grid grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 md:gap-16 lg:gap-20">
        {/* LEFT: Video card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border/40">
            <Image
              src={userImage}
              alt={userName}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={false}
            />

            {/* Dark overlay */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
            />

            {/* Top-right badge */}
            <div className="absolute right-4 top-4 z-10">
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground shadow-lg">
                Lulusan RPI Academy
              </span>
            </div>

            {/* Center Play button with pulse rings */}
            <div className="absolute inset-0 z-10 grid place-items-center">
              <div className="relative h-20 w-20">
                {/* Pulse rings */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-secondary"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-secondary"
                  animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 1,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  aria-label={`Putar video kisah sukses ${userName}`}
                  className="relative grid h-20 w-20 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-2xl transition hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40"
                >
                  <Play className="h-8 w-8 translate-x-0.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Bottom-left text overlay */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white">
              <h3 className="font-heading text-xl leading-tight">{userName}</h3>
              <p className="mt-1 text-sm opacity-90">{userHeadline}</p>
              <div
                className="mt-2 flex items-center gap-0.5"
                aria-label="Rating 5 dari 5"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-secondary text-secondary"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Content */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative"
        >
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Kisah Sukses
          </span>

          <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
            Dari Pencari Kerja Jadi Profesional
          </h2>

          {/* Quote */}
          <div className="relative mt-6">
            <Quote
              aria-hidden
              className="absolute -left-1 -top-2 h-8 w-8 text-secondary/30"
            />
            <blockquote className="relative pl-8 text-base leading-relaxed text-muted-foreground md:text-lg">
              &ldquo;RPI memberi saya keterampilan dan koneksi yang saya
              butuhkan. Dalam 3 bulan setelah lulus kursus, saya mendapat
              tawaran kerja dengan gaji 2x lipat dari sebelumnya.&rdquo;
            </blockquote>
          </div>

          {/* Source */}
          <div className="mt-5 flex flex-col gap-1 border-l-2 border-secondary pl-4">
            <span className="font-heading text-base font-semibold text-foreground">
              {userName}
            </span>
            <span className="text-sm text-muted-foreground">{userHeadline}</span>
          </div>

          {/* Course completed badge */}
          <div className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Lulus dari kursus: {courseTitle}
            </span>
          </div>

          {/* Mini stat cards */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {STATS.map((s, i) => (
              <motion.div
                key={s.value}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                className="rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm md:p-4"
              >
                <div className="font-heading text-xl font-bold text-secondary md:text-2xl">
                  {s.value}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground md:text-xs">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link
              href="/stories"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-secondary/80"
            >
              Lihat Lebih Banyak Cerita
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Video player"
            onClick={() => setIsPlaying(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                aria-label="Tutup video"
                className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground shadow transition hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative aspect-video w-full bg-gradient-to-br from-primary/90 via-primary to-accent/80">
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div className="px-6 text-primary-foreground">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-xl">
                      <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                    </div>
                    <p className="font-heading text-lg font-semibold">
                      Video Player Placeholder
                    </p>
                    <p className="mt-1 text-sm opacity-80">
                      Kisah sukses {userName}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default TestimonialVideo
