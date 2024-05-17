'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, Users, BadgeCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FeaturedPartnersProps {
  className?: string
}

interface CompanyLogo {
  name: string
  icon: string
}

interface SpotlightPartner {
  name: string
  industry: string
  size: string
  openPositions: number
}

const ROW_1_COMPANIES: CompanyLogo[] = [
  { name: 'Telkom', icon: 'TLK' },
  { name: 'Pertamina', icon: 'PTM' },
  { name: 'BCA', icon: 'BCA' },
  { name: 'Mandiri', icon: 'MDR' },
  { name: 'Astra International', icon: 'AST' },
  { name: 'Unilever', icon: 'UNL' },
  { name: 'Indofood', icon: 'IDF' },
  { name: 'GoTo', icon: 'GTO' },
  { name: 'Tokopedia', icon: 'TKP' },
  { name: 'Shopee', icon: 'SHP' },
  { name: 'BRI', icon: 'BRI' },
  { name: 'BNI', icon: 'BNI' },
  { name: 'Pegadaian', icon: 'PGD' },
  { name: 'Garuda Indonesia', icon: 'GIA' },
  { name: 'Pertamina Hulu Energi', icon: 'PHE' },
]

const ROW_2_COMPANIES: CompanyLogo[] = [
  { name: 'Bank Mega', icon: 'MGA' },
  { name: 'Maybank', icon: 'MYB' },
  { name: 'CIMB Niaga', icon: 'CMB' },
  { name: 'OVO', icon: 'OVO' },
  { name: 'DANA', icon: 'DNA' },
  { name: 'BukaLapak', icon: 'BKL' },
  { name: 'Blibli', icon: 'BLB' },
  { name: 'Traveloka', icon: 'TVL' },
  { name: 'Tiket.com', icon: 'TKT' },
  { name: 'Adira Finance', icon: 'ADR' },
  { name: 'Jasa Marga', icon: 'JSM' },
  { name: 'PLN', icon: 'PLN' },
  { name: 'Pos Indonesia', icon: 'POS' },
  { name: 'Indomaret', icon: 'IDM' },
  { name: 'Alfamart', icon: 'ALF' },
]

const SPOTLIGHT_PARTNERS: SpotlightPartner[] = [
  {
    name: 'Telkom',
    industry: 'Telekomunikasi',
    size: '1,200 karyawan',
    openPositions: 24,
  },
  {
    name: 'Tokopedia',
    industry: 'E-Commerce',
    size: '5,500 karyawan',
    openPositions: 18,
  },
  {
    name: 'BCA',
    industry: 'Perbankan',
    size: '28K karyawan',
    openPositions: 35,
  },
  {
    name: 'Pertamina',
    industry: 'Energi & BUMN',
    size: '12K karyawan',
    openPositions: 16,
  },
]

function LogoChip({ company }: { company: CompanyLogo }): JSX.Element {
  return (
    <div className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-card border border-border whitespace-nowrap text-foreground font-heading text-lg md:text-xl tracking-wide opacity-70 hover:opacity-100 transition shrink-0">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-secondary/15 text-secondary text-[10px] font-bold">
        {company.icon}
      </span>
      <span>{company.name}</span>
    </div>
  )
}

export function FeaturedPartners(props: FeaturedPartnersProps): JSX.Element {
  const { className } = props

  // Duplicate the arrays so the marquee can loop seamlessly.
  const row1 = React.useMemo(
    () => [...ROW_1_COMPANIES, ...ROW_1_COMPANIES],
    [],
  )
  const row2 = React.useMemo(
    () => [...ROW_2_COMPANIES, ...ROW_2_COMPANIES],
    [],
  )

  return (
    <section
      className={cn(
        'py-20 md:py-28 bg-background relative overflow-hidden',
        className,
      )}
      aria-labelledby="featured-partners-heading"
    >
      {/* Soft decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
      >
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-[60rem] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium mb-4">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            <span>Mitra Resmi</span>
          </div>

          <h2
            id="featured-partners-heading"
            className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-tight"
          >
            Dipercaya 850+ Perusahaan Top Indonesia
          </h2>

          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            Dari startup unicorn hingga BUMN, perusahaan terkemuka memilih RPI
            untuk merekrut talenta terbaik.
          </p>
        </div>

        {/* Marquees */}
        <div className="relative">
          {/* Edge fade masks */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-32 bg-gradient-to-r from-background to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-32 bg-gradient-to-l from-background to-transparent"
          />

          {/* Row 1 — scroll LEFT */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {row1.map((company, idx) => (
                <LogoChip
                  key={`row1-${company.name}-${idx}`}
                  company={company}
                />
              ))}
            </motion.div>
          </div>

          {/* Row 2 — scroll RIGHT */}
          <div className="overflow-hidden mt-4">
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ['-50%', '0%'] }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {row2.map((company, idx) => (
                <LogoChip
                  key={`row2-${company.name}-${idx}`}
                  company={company}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Spotlight cards */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {SPOTLIGHT_PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="rounded-2xl bg-card border border-border p-5 text-center hover:shadow-lg hover:border-secondary/40 transition"
            >
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" aria-hidden />
              </div>

              <div className="font-heading text-2xl font-bold text-foreground">
                {partner.name}
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                {partner.industry}
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" aria-hidden />
                <span>{partner.size}</span>
              </div>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 text-secondary px-2.5 py-1 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                <span>{partner.openPositions} posisi terbuka</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Link
            href="/mitra"
            className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-primary hover:text-secondary transition group"
          >
            <span>Lihat 850+ Mitra Lainnya</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeaturedPartners
