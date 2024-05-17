'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight, Bookmark, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CareerInsightsProps {
  className?: string
}

interface Article {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  image: string
}

const FEATURED: Article = {
  slug: 'skill-2025',
  title: '10 Skill Paling Dicari Recruiter di 2025',
  category: 'Tren Karier',
  date: '15 Mei 2025',
  readTime: '8 menit baca',
  image:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
}

const ARTICLES: Article[] = [
  {
    slug: 'cv-ats-friendly',
    title: 'Cara Menulis CV ATS-Friendly yang Diterima 90% Perusahaan',
    category: 'Tips CV',
    date: '12 Mei',
    readTime: '6 menit',
    image:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=70',
  },
  {
    slug: 'pertanyaan-interview-tersulit',
    title: '5 Pertanyaan Interview Tersulit dan Cara Menjawabnya',
    category: 'Interview',
    date: '10 Mei',
    readTime: '7 menit',
    image:
      'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=70',
  },
  {
    slug: 'negosiasi-gaji-pemula',
    title: 'Negosiasi Gaji: Panduan Lengkap untuk Pemula',
    category: 'Gaji & Karier',
    date: '8 Mei',
    readTime: '9 menit',
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=70',
  },
  {
    slug: 'transisi-karier-tech',
    title: 'Transisi Karier ke Tech Tanpa Background IT',
    category: 'Tren Karier',
    date: '5 Mei',
    readTime: '10 menit',
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=70',
  },
  {
    slug: 'mengatasi-burnout',
    title: 'Mengatasi Burnout di Tempat Kerja',
    category: 'Wellness',
    date: '2 Mei',
    readTime: '5 menit',
    image:
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=70',
  },
]

export function CareerInsights({ className }: CareerInsightsProps): JSX.Element {
  return (
    <section className={cn('py-20 md:py-28 bg-muted/30', className)}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Insight Karier
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-4">
              Tips & Strategi untuk Karier yang Lebih Cerah
            </h2>
            <p className="text-muted-foreground mt-3 text-base md:text-lg">
              Artikel pilihan dari para ahli karier, recruiter, dan profesional sukses.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-secondary font-semibold hover:gap-3 transition-all"
            >
              Lihat Semua Artikel
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured article */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 lg:col-span-2 lg:row-span-2"
          >
            <Link
              href={`/blog/${FEATURED.slug}`}
              className="group relative block rounded-xl overflow-hidden border border-border h-full min-h-[400px] hover:shadow-xl transition-shadow"
            >
              <div className="relative w-full h-full aspect-[16/9] lg:aspect-auto lg:min-h-[480px] overflow-hidden">
                <Image
                  src={FEATURED.image}
                  alt={FEATURED.title}
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  <span className="inline-flex items-center w-fit px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider mb-4">
                    {FEATURED.category}
                  </span>
                  <h3 className="font-heading text-2xl md:text-3xl font-bold text-white line-clamp-2 mb-3">
                    {FEATURED.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-4 text-white/80 text-sm mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {FEATURED.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {FEATURED.readTime}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
                    Baca
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Other articles */}
          {ARTICLES.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i + 1) * 0.08 }}
            >
              <Link
                href={`/blog/${article.slug}`}
                className="group block rounded-xl bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow h-full"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    {article.category}
                  </span>
                  <h3 className="font-heading text-base font-semibold text-foreground line-clamp-2 mt-2 group-hover:text-secondary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    Pelajari strategi praktis dan tips actionable dari para ahli untuk
                    mengembangkan karier Anda ke level berikutnya.
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Simpan artikel"
                      onClick={(e) => {
                        e.preventDefault()
                      }}
                      className="text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CareerInsights
