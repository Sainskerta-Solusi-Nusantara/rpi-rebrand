'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Quote, ArrowRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SuccessStoriesProps {
  className?: string
}

type CardType = 'A' | 'B' | 'C'

interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  location: string
  quote: string
  avatar: string
  type: CardType
  featured?: boolean
}

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
]

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Sinta Maharani',
    role: 'Senior Frontend Engineer',
    company: 'Tokopedia',
    location: 'Jakarta',
    quote:
      'RPI Academy mengubah karier saya. Dari fresh graduate ke senior engineer dalam 2 tahun.',
    avatar: AVATARS[0],
    type: 'A',
  },
  {
    id: 2,
    name: 'Bayu Pratama',
    role: 'Product Designer',
    company: 'GoTo',
    location: 'Bandung',
    quote:
      'Templat CV-nya luar biasa. Saya dapat 5 interview dalam minggu pertama.',
    avatar: AVATARS[1],
    type: 'B',
  },
  {
    id: 3,
    name: 'Linda Wijaya',
    role: 'Data Analyst',
    company: 'BCA',
    location: 'Jakarta',
    quote:
      'Saya tidak punya background tech, tapi kursus data analysis-nya benar-benar ramah pemula. Sekarang saya bekerja di bank besar dengan gaji 3x lipat.',
    avatar: AVATARS[2],
    type: 'A',
  },
  {
    id: 4,
    name: 'Ahmad Fauzi',
    role: 'DevOps Engineer',
    company: 'Telkom',
    location: 'Bekasi',
    quote:
      'Lowongan di RPI semua terverifikasi. Tidak ada yang scam atau palsu seperti di platform lain. Saya percaya 100%.',
    avatar: AVATARS[3],
    type: 'C',
    featured: true,
  },
  {
    id: 5,
    name: 'Rina Sari',
    role: 'Marketing Specialist',
    company: 'Unilever',
    location: 'Surabaya',
    quote:
      'Komunitasnya luar biasa! Saya dapat mentor dari senior di industri yang sama.',
    avatar: AVATARS[4],
    type: 'A',
  },
  {
    id: 6,
    name: 'Doni Hartanto',
    role: 'Backend Developer',
    company: 'BukaLapak',
    location: 'Yogyakarta',
    quote:
      'Dari penjaga toko di kampung halaman ke developer di Jakarta. RPI membuktikan keahlian mengalahkan ijazah.',
    avatar: AVATARS[5],
    type: 'B',
  },
  {
    id: 7,
    name: 'Maya Lestari',
    role: 'Customer Success',
    company: 'Shopee',
    location: 'Tangerang',
    quote:
      'Aplikasi mobilenya bikin saya bisa apply lowongan di sela-sela jam istirahat kerja lama saya. Game changer.',
    avatar: AVATARS[6],
    type: 'A',
  },
  {
    id: 8,
    name: 'Reza Aulia',
    role: 'Cloud Engineer',
    company: 'Pertamina',
    location: 'Balikpapan',
    quote:
      'Sertifikat RPI dihargai industri. Recruiter saya bilang itu salah satu alasan saya direkrut.',
    avatar: AVATARS[7],
    type: 'C',
    featured: true,
  },
  {
    id: 9,
    name: 'Putri Wulandari',
    role: 'UX Researcher',
    company: 'Mandiri',
    location: 'Jakarta',
    quote:
      'Mentor 1-on-1 dari RPI memberi saya kepercayaan diri untuk apply di posisi yang awalnya saya pikir di luar jangkauan.',
    avatar: AVATARS[8],
    type: 'B',
  },
]

function StarRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-secondary text-secondary"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function AuthorBlock({
  t,
  variant = 'default',
}: {
  t: Testimonial
  variant?: 'default' | 'featured'
}) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-secondary/30">
        <Image
          src={t.avatar}
          alt={t.name}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'truncate text-sm font-semibold',
              variant === 'featured' ? 'text-primary-foreground' : 'text-foreground',
            )}
          >
            {t.name}
          </p>
        </div>
        <p
          className={cn(
            'truncate text-xs',
            variant === 'featured'
              ? 'text-primary-foreground/80'
              : 'text-muted-foreground',
          )}
        >
          {t.role} - {t.company}
        </p>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-[11px]',
            variant === 'featured'
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground',
          )}
        >
          <MapPin className="h-3 w-3" aria-hidden="true" />
          <span>{t.location}</span>
        </div>
      </div>
      <StarRow />
    </div>
  )
}

function TypeACard({ t }: { t: Testimonial }) {
  return (
    <div className="relative break-inside-avoid rounded-2xl border border-border bg-card p-6 transition hover:border-secondary/40 hover:shadow-xl">
      <Quote
        className="h-7 w-7 text-secondary"
        aria-hidden="true"
      />
      <p className="mt-3 italic leading-relaxed text-foreground/90">
        &ldquo;{t.quote}&rdquo;
      </p>
      <AuthorBlock t={t} />
    </div>
  )
}

function TypeBCard({ t }: { t: Testimonial }) {
  return (
    <div className="relative break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card transition hover:border-secondary/40 hover:shadow-xl">
      <div className="relative h-32 bg-gradient-to-br from-primary/80 via-indigo-600 to-secondary/70">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-background">
            <Image
              src={t.avatar}
              alt={t.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <div className="p-6">
        <Quote className="h-6 w-6 text-secondary" aria-hidden="true" />
        <p className="mt-3 italic leading-relaxed text-foreground/90">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">
            {t.role} - {t.company}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span>{t.location}</span>
            </div>
            <StarRow />
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeCCard({ t }: { t: Testimonial }) {
  return (
    <div className="relative break-inside-avoid rounded-2xl border border-secondary/40 bg-primary p-6 text-primary-foreground transition hover:shadow-2xl">
      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
        <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
        Featured
      </span>
      <Quote
        className="h-9 w-9 text-secondary"
        aria-hidden="true"
      />
      <p className="mt-4 text-lg font-medium italic leading-relaxed text-primary-foreground">
        &ldquo;{t.quote}&rdquo;
      </p>
      <AuthorBlock t={t} variant="featured" />
    </div>
  )
}

function renderCard(t: Testimonial) {
  if (t.type === 'B') return <TypeBCard t={t} />
  if (t.type === 'C') return <TypeCCard t={t} />
  return <TypeACard t={t} />
}

export function SuccessStories(props: SuccessStoriesProps): JSX.Element {
  const { className } = props

  return (
    <section
      className={cn('bg-background py-20 md:py-28', className)}
      aria-labelledby="success-stories-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary"
          >
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" aria-hidden="true" />
            Kisah Sukses Alumni
          </motion.span>

          <motion.h2
            id="success-stories-heading"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 font-heading text-3xl text-foreground md:text-5xl"
          >
            Ribuan Hidup Berubah Berkat RPI
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base text-muted-foreground md:text-lg"
          >
            Cerita nyata dari pencari kerja yang berhasil menemukan karier impian
            melalui platform kami.
          </motion.p>
        </div>

        <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="break-inside-avoid"
            >
              {renderCard(t)}
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-secondary/80"
          >
            Lihat 12.000+ Cerita Sukses Lainnya
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default SuccessStories
