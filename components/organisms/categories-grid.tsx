'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Code,
  TrendingUp,
  Palette,
  Megaphone,
  HeartPulse,
  GraduationCap,
  HardHat,
  UtensilsCrossed,
  Sparkles,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  _count?: { jobs?: number }
}

export interface CategoriesGridProps {
  categories?: Category[]
  className?: string
}

interface FallbackCategory {
  id: string
  name: string
  slug: string
  image: string
  icon: LucideIcon
  tint: string
  jobCount: number
}

const FALLBACK_CATEGORIES: FallbackCategory[] = [
  {
    id: 'fc-1',
    name: 'Teknologi & IT',
    slug: 'teknologi-it',
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=70',
    icon: Code,
    tint: 'from-indigo-500/40 via-indigo-900/20',
    jobCount: 1240,
  },
  {
    id: 'fc-2',
    name: 'Keuangan & Bank',
    slug: 'keuangan-bank',
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=70',
    icon: TrendingUp,
    tint: 'from-emerald-500/40 via-emerald-900/20',
    jobCount: 864,
  },
  {
    id: 'fc-3',
    name: 'Desain & Kreatif',
    slug: 'desain-kreatif',
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b8?auto=format&fit=crop&w=600&q=70',
    icon: Palette,
    tint: 'from-pink-500/40 via-pink-900/20',
    jobCount: 612,
  },
  {
    id: 'fc-4',
    name: 'Marketing & Sales',
    slug: 'marketing-sales',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=70',
    icon: Megaphone,
    tint: 'from-orange-500/40 via-orange-900/20',
    jobCount: 978,
  },
  {
    id: 'fc-5',
    name: 'Kesehatan',
    slug: 'kesehatan',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=70',
    icon: HeartPulse,
    tint: 'from-red-500/40 via-red-900/20',
    jobCount: 532,
  },
  {
    id: 'fc-6',
    name: 'Pendidikan',
    slug: 'pendidikan',
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=70',
    icon: GraduationCap,
    tint: 'from-blue-500/40 via-blue-900/20',
    jobCount: 421,
  },
  {
    id: 'fc-7',
    name: 'Konstruksi & Teknik',
    slug: 'konstruksi-teknik',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=70',
    icon: HardHat,
    tint: 'from-yellow-500/40 via-yellow-900/20',
    jobCount: 389,
  },
  {
    id: 'fc-8',
    name: 'Hospitality & F&B',
    slug: 'hospitality-fnb',
    image:
      'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=600&q=70',
    icon: UtensilsCrossed,
    tint: 'from-purple-500/40 via-purple-900/20',
    jobCount: 287,
  },
]

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  TrendingUp,
  Palette,
  Megaphone,
  HeartPulse,
  GraduationCap,
  HardHat,
  UtensilsCrossed,
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

function formatJobCount(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

function mergeCategories(
  input: Category[] | undefined,
): Array<FallbackCategory & { _isFallback: boolean }> {
  if (!input || input.length === 0) {
    return FALLBACK_CATEGORIES.map((c) => ({ ...c, _isFallback: true }))
  }
  return input.slice(0, 8).map((c, i) => {
    const fb = FALLBACK_CATEGORIES[i % FALLBACK_CATEGORIES.length]!
    const Icon = (c.icon && ICON_MAP[c.icon]) || fb.icon
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: fb.image,
      icon: Icon,
      tint: fb.tint,
      jobCount: c._count?.jobs ?? fb.jobCount,
      _isFallback: false,
    }
  })
}

export function CategoriesGrid({ categories, className }: CategoriesGridProps) {
  const items = React.useMemo(() => mergeCategories(categories), [categories])

  return (
    <section
      className={cn(
        'relative w-full bg-gradient-to-b from-background to-muted/30 py-16 md:py-24',
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={headerVariants}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            Kategori Populer
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Temukan Karier di Bidang{' '}
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Favoritmu
            </span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Jelajahi ribuan lowongan kerja terkurasi dari perusahaan terkemuka di Indonesia. Pilih
            bidang yang paling sesuai dengan minat dan keahlianmu.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4"
        >
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                variants={cardVariants}
                custom={i}
                className="group"
              >
                <Link
                  href={`/jobs?category=${item.slug}`}
                  aria-label={`Lihat lowongan kategori ${item.name}`}
                  className={cn(
                    'relative block aspect-[4/5] overflow-hidden rounded-2xl',
                    'ring-1 ring-border/60 transition-all duration-500',
                    'hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/20 hover:ring-2 hover:ring-secondary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  )}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-t to-transparent transition-opacity duration-500',
                      item.tint,
                      'from-black/70 via-black/40',
                    )}
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden
                  />

                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-xl bg-secondary/90 p-2.5 text-secondary-foreground shadow-lg backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-secondary">
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </span>
                  </div>

                  <div className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 translate-x-2">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <h3 className="font-heading text-base font-semibold leading-tight text-white drop-shadow-md md:text-lg">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/85 md:text-sm">
                      {formatJobCount(item.jobCount)} lowongan
                    </p>

                    <div className="mt-3 h-0.5 w-0 bg-secondary transition-all duration-500 group-hover:w-12" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex justify-center md:mt-14"
        >
          <Link
            href="/jobs"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-secondary hover:bg-secondary/5 hover:shadow-lg"
          >
            Lihat semua kategori
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default CategoriesGrid
