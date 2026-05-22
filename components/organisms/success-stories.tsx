'use client'

import * as React from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Quote, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SuccessStoriesProps {
  testimonial?: {
    user?: { name?: string | null; image?: string | null; headline?: string | null } | null
    course?: { title?: string | null; slug?: string | null } | null
  } | null
  className?: string
}

const FEATURED_IMAGE =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80'

interface MiniQuote {
  quote: string
  name: string
  age: number
  location: string
}

const MINI_QUOTES: MiniQuote[] = [
  {
    quote: 'Dapat kerja pertama dua minggu setelah daftar. Profil saya langsung dilirik 3 perusahaan.',
    name: 'Sari',
    age: 24,
    location: 'Bandung',
  },
  {
    quote: 'Sertifikat kursus langsung jadi nilai lebih saat lamar. Recruiter langsung notice.',
    name: 'Budi',
    age: 31,
    location: 'Jakarta',
  },
]

export function SuccessStories({ testimonial, className }: SuccessStoriesProps): JSX.Element {
  const [isPlaying, setIsPlaying] = React.useState(false)

  const userName = testimonial?.user?.name || 'Andi Wijaya'
  const userHeadline = testimonial?.user?.headline || '27, Yogyakarta'
  const userImage = testimonial?.user?.image || FEATURED_IMAGE

  return (
    <section
      className={cn('bg-background py-16 md:py-20', className)}
      aria-labelledby="stories-heading"
    >
      <div className="container mx-auto w-full max-w-6xl px-6">
        {/* Eyebrow + heading */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Kisah Sukses
          </span>
        </div>

        <motion.h2
          id="stories-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Dari ribuan yang bertumbuh bersama RPI.
        </motion.h2>

        {/* Video card (left) + 2 quote cards (right) */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* LEFT — featured testimonial with video */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card md:col-span-3"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={userImage}
                alt={userName}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent"
              />

              {/* Play button */}
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label={`Putar video kisah sukses ${userName}`}
                className="group absolute inset-0 flex items-center justify-center"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-background/95 text-foreground shadow-lg transition-transform group-hover:scale-105">
                  <Play className="h-6 w-6 translate-x-0.5 fill-current" aria-hidden />
                </span>
              </button>

              {/* Caption */}
              <div className="absolute inset-x-0 bottom-0 p-6 text-background dark:text-foreground">
                <p className="font-heading text-lg font-semibold leading-tight md:text-xl">
                  &ldquo;Saya berubah karena RPI.&rdquo;
                </p>
                <p className="mt-2 text-sm opacity-90">
                  — {userName}, {userHeadline}
                </p>
              </div>
            </div>
          </motion.article>

          {/* RIGHT — 2 quote cards stacked */}
          <div className="space-y-6 md:col-span-2">
            {MINI_QUOTES.map((q, i) => (
              <motion.article
                key={q.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <Quote
                  aria-hidden
                  className="h-5 w-5 text-[color:var(--ring)]"
                />
                <blockquote className="mt-3 text-sm leading-relaxed text-foreground md:text-base">
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  — {q.name}, {q.age}, {q.location}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Video player"
            onClick={() => setIsPlaying(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                aria-label="Tutup video"
                className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative aspect-video w-full bg-muted">
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div className="px-6 text-foreground">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[color:var(--ring)] text-background">
                      <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                    </div>
                    <p className="font-heading text-lg font-semibold">
                      Video Player Placeholder
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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

export default SuccessStories
