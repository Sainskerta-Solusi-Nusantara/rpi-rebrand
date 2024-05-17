'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Briefcase,
  Users,
  ArrowRight,
  Building2,
  Zap,
  Heart,
  Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IndustrySpotlightProps {
  className?: string
}

interface Industry {
  name: string
  slug: string
  Icon: typeof Zap
  image: string
  growth: string
  jobs: string
  candidates: string
  salary: string
}

const industries: Industry[] = [
  {
    name: 'Teknologi & Startup',
    slug: 'teknologi-startup',
    Icon: Zap,
    image:
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=70',
    growth: '+24%',
    jobs: '3.200 lowongan',
    candidates: '48K kandidat',
    salary: 'Rp 12-30 Jt',
  },
  {
    name: 'Perbankan & Fintech',
    slug: 'perbankan-fintech',
    Icon: Banknote,
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=70',
    growth: '+18%',
    jobs: '2.100 lowongan',
    candidates: '32K kandidat',
    salary: 'Rp 9-22 Jt',
  },
  {
    name: 'E-Commerce & Retail',
    slug: 'e-commerce-retail',
    Icon: Briefcase,
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=70',
    growth: '+32%',
    jobs: '2.800 lowongan',
    candidates: '41K kandidat',
    salary: 'Rp 8-18 Jt',
  },
  {
    name: 'Kesehatan & Farmasi',
    slug: 'kesehatan-farmasi',
    Icon: Heart,
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=70',
    growth: '+15%',
    jobs: '1.400 lowongan',
    candidates: '22K kandidat',
    salary: 'Rp 7-20 Jt',
  },
  {
    name: 'Manufaktur & Otomotif',
    slug: 'manufaktur-otomotif',
    Icon: Building2,
    image:
      'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&w=900&q=70',
    growth: '+12%',
    jobs: '1.800 lowongan',
    candidates: '28K kandidat',
    salary: 'Rp 6-15 Jt',
  },
  {
    name: 'Energi & Sumber Daya',
    slug: 'energi-sumber-daya',
    Icon: Zap,
    image:
      'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=900&q=70',
    growth: '+20%',
    jobs: '950 lowongan',
    candidates: '14K kandidat',
    salary: 'Rp 12-28 Jt',
  },
]

export function IndustrySpotlight(props: IndustrySpotlightProps): JSX.Element {
  const { className } = props

  return (
    <section
      className={cn('relative bg-background py-20 md:py-28', className)}
      aria-labelledby="industry-spotlight-heading"
    >
      <div className="container mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Industri Berkembang</span>
          </motion.div>

          <motion.h2
            id="industry-spotlight-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            Industri yang Paling Banyak Mencari Talenta
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-base text-muted-foreground md:text-lg"
          >
            Pilih industri yang cocok denganmu. Lihat tren gaji, posisi terbuka,
            dan keterampilan yang paling dicari.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry, i) => {
            const Icon = industry.Icon
            return (
              <motion.div
                key={industry.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  'group relative',
                  i === 0 && 'lg:col-span-2 lg:row-span-1',
                )}
              >
                <Link
                  href={`/jobs?industry=${industry.slug}`}
                  className="group relative block h-80 overflow-hidden rounded-3xl shadow-md transition-shadow duration-300 hover:shadow-2xl md:h-96"
                  aria-label={`Jelajahi lowongan di industri ${industry.name}`}
                >
                  {/* Image */}
                  <Image
                    src={industry.image}
                    alt={industry.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
                  />

                  {/* Top-left icon */}
                  <div className="absolute left-5 top-5 inline-flex items-center justify-center rounded-2xl bg-secondary/90 p-3 text-secondary-foreground shadow-lg backdrop-blur-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  {/* Top-right growth badge */}
                  <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{industry.growth}</span>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                    <h3 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl">
                      {industry.name}
                    </h3>

                    {/* Stats row */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase
                          className="h-4 w-4 text-secondary"
                          aria-hidden="true"
                        />
                        <span>{industry.jobs}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users
                          className="h-4 w-4 text-secondary"
                          aria-hidden="true"
                        />
                        <span>{industry.candidates}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Banknote
                          className="h-4 w-4 text-secondary"
                          aria-hidden="true"
                        />
                        <span>{industry.salary}</span>
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition-all duration-300 group-hover:gap-3">
                      <span>Jelajahi</span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default IndustrySpotlight
