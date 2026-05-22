'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
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
      'Ya, 100% gratis dan akan selalu gratis. Tidak ada biaya tersembunyi, tidak perlu kartu kredit, dan semua fitur tersedia tanpa batas untuk pencari kerja.',
  },
  {
    question: 'Bagaimana saya tahu lowongan ini asli?',
    answer:
      'Setiap mitra divalidasi legalitas usaha, kontak resmi, dan riwayat perekrutan sebelum dapat memposting. Tim kami juga me-review setiap lowongan sebelum tayang.',
  },
  {
    question: 'Apakah sertifikat kursus diakui industri?',
    answer:
      'Ya. Kursus RPI Academy tervalidasi mitra industri dan beberapa diakui oleh lembaga sertifikasi pemerintah. Banyak alumni menggunakannya sebagai nilai tambah saat melamar.',
  },
  {
    question: 'Bagaimana cara mitra mendaftarkan perusahaan?',
    answer:
      'Klik tombol "Untuk Perusahaan" di header atau halaman /mitra. Proses onboarding mencakup verifikasi legalitas, konfigurasi tenant, dan branding. Bisa selesai dalam 1-3 hari kerja.',
  },
  {
    question: 'Apakah data saya aman?',
    answer:
      'Sangat aman. Kami menggunakan enkripsi end-to-end dan kontrol akses ketat. Hanya perusahaan yang Anda izinkan yang dapat melihat profil Anda. Kami tidak menjual data ke pihak ketiga.',
  },
]

export function FAQAccordion({ className }: FAQAccordionProps): JSX.Element {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <section
      className={cn('bg-background py-16 md:py-20', className)}
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto w-full max-w-3xl px-6">
        {/* Eyebrow + heading */}
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Bantuan
          </span>
        </div>

        <motion.h2
          id="faq-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Pertanyaan yang sering diajukan.
        </motion.h2>

        {/* Accordion */}
        <ul className="mt-10 divide-y divide-border" role="list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-trigger-${index}`

            return (
              <li key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => handleToggle(index)}
                    className={cn(
                      'group flex w-full items-center justify-between gap-6 py-5 text-left font-medium transition-colors',
                      'hover:text-[color:var(--ring)] focus-visible:outline-none',
                      isOpen ? 'text-[color:var(--ring)]' : 'text-foreground',
                    )}
                  >
                    <span className="font-heading text-base md:text-lg">
                      {item.question}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        'h-5 w-5 shrink-0 transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
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
                      <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground md:text-base">
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
    </section>
  )
}

export default FAQAccordion
