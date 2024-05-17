'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  MessageCircle,
  HelpCircle,
  Mail,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export interface FAQAccordionProps {
  className?: string
}

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Apakah RPI gratis untuk pencari kerja?',
    answer:
      'Ya, 100% gratis dan akan selalu gratis. Kami percaya akses ke peluang kerja adalah hak semua orang. Tidak ada biaya tersembunyi, tidak perlu kartu kredit, dan kamu bisa menggunakan semua fitur tanpa batas.',
  },
  {
    question: 'Bagaimana cara memastikan lowongan di RPI terverifikasi?',
    answer:
      'Setiap perusahaan mitra melalui proses verifikasi ketat yang meliputi pengecekan legalitas badan usaha, kontak resmi, dan riwayat perekrutan. Lowongan yang dipublikasikan juga di-review oleh tim kami sebelum tayang.',
  },
  {
    question: 'Apakah CV saya aman di RPI?',
    answer:
      'Sangat aman. Kami menggunakan enkripsi end-to-end dan kontrol akses ketat. Hanya perusahaan yang kamu izinkan yang bisa melihat CV-mu. Kami tidak pernah menjual data ke pihak ketiga.',
  },
  {
    question: 'Berapa lama proses dari daftar sampai dapat kerja?',
    answer:
      'Bervariasi, tapi rata-rata alumni RPI mendapat tawaran dalam 3-8 minggu. Yang aktif menggunakan kursus dan apply secara konsisten biasanya lebih cepat.',
  },
  {
    question: 'Apa bedanya kursus RPI Academy dengan platform lain?',
    answer:
      'RPI Academy fokus pada keterampilan yang dibutuhkan industri Indonesia, dengan instruktur dari perusahaan top, dan sertifikat yang diakui 850+ mitra. Lulusan kami punya jalur langsung ke peluang kerja.',
  },
  {
    question: 'Apakah ada aplikasi mobile?',
    answer:
      'Ya. Aplikasi kami tersedia di Android dan iOS dengan rating 4.9/5. Bisa apply, ikuti kursus offline, dan dapat notifikasi real-time.',
  },
  {
    question: 'Bagaimana jika saya tidak punya pengalaman kerja sama sekali?',
    answer:
      'Tidak masalah! Banyak lowongan fresh graduate dan magang. Kursus RPI Academy juga didesain untuk pemula. Banyak alumni kami yang mulai dari nol dan sekarang bekerja di perusahaan top.',
  },
  {
    question: 'Apakah RPI hanya untuk profesional kantoran?',
    answer:
      'Tidak. Kami menyediakan lowongan dari berbagai industri: tech, manufaktur, kesehatan, hospitality, pendidikan, konstruksi, dan banyak lagi. Untuk berbagai level dari entry hingga eksekutif.',
  },
]

export function FAQAccordion({ className }: FAQAccordionProps): JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <section
      className={cn('bg-background py-20 md:py-28', className)}
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          {/* LEFT: Title + contact card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
              <span>Bantuan &amp; FAQ</span>
            </div>

            <h2
              id="faq-heading"
              className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Punya Pertanyaan? Kami Punya Jawabannya.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Jawaban untuk pertanyaan yang paling sering ditanyakan pencari
              kerja.
            </p>

            <div className="mt-8 rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
                <MessageCircle
                  className="h-5 w-5 text-secondary"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-4 font-heading text-lg font-semibold">
                Masih belum menemukan jawaban?
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
                Tim support kami siap membantu 7 hari seminggu.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  asChild
                  variant="secondary"
                  className="w-full justify-center sm:w-auto"
                >
                  <Link href="/kontak" className="inline-flex items-center gap-2">
                    Hubungi Kami
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>

                <Link
                  href="mailto:support@rpi.co.id"
                  className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  support@rpi.co.id
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Accordion */}
          <div className="rounded-2xl border border-border bg-card/40 px-2 sm:px-4">
            <ul className="divide-y divide-border" role="list">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openIndex === index
                const panelId = `faq-panel-${index}`
                const buttonId = `faq-trigger-${index}`

                return (
                  <li key={item.question} className="py-1">
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => handleToggle(index)}
                        className={cn(
                          'flex w-full items-center justify-between gap-6 py-5 text-left font-medium transition-colors',
                          'hover:text-secondary focus-visible:text-secondary focus-visible:outline-none',
                          isOpen ? 'text-secondary' : 'text-foreground',
                        )}
                      >
                        <span className="font-heading text-base md:text-lg">
                          {item.question}
                        </span>
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-transform duration-300',
                            isOpen && 'rotate-180 border-secondary/40 text-secondary',
                          )}
                          aria-hidden="true"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.2, ease: 'easeOut' },
                          }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 pr-12 text-sm leading-relaxed text-muted-foreground">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQAccordion
