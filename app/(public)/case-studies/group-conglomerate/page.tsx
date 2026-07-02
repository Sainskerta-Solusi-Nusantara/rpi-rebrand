import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Quote } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { CTABanner } from '@/components/organisms/cta-banner'

export const metadata: Metadata = {
  title: 'Studi Kasus: Grup Konglomerasi',
  description:
    'Bagaimana sebuah grup konglomerasi dengan 12 anak usaha menyatukan 6 sistem ATS dan mempercepat perekrutan bersama SSN Pekerja.',
}

const metrics = [
  { value: '12', label: 'Anak usaha terintegrasi' },
  { value: '6', label: 'Sistem ATS disatukan' },
  { value: '-43%', label: 'Waktu rekrut rata-rata' },
  { value: '2.8x', label: 'Kualitas kandidat masuk' },
]

const sections = [
  {
    heading: 'Tantangan',
    body: 'Grup ini mengelola perekrutan untuk 12 anak usaha dengan enam sistem ATS berbeda yang tidak saling terhubung. Data kandidat terfragmentasi, pelaporan manual, dan tim HR kesulitan melihat gambaran utuh lintas unit bisnis.',
  },
  {
    heading: 'Solusi',
    body: 'SSN Pekerja menyatukan seluruh alur rekrutmen ke dalam satu platform dengan SSO, integrasi ATS dua arah, dan papan pipeline terpusat. Penyaringan berbasis AI membantu memprioritaskan kandidat paling relevan di setiap unit.',
  },
  {
    heading: 'Hasil',
    body: 'Dalam enam bulan, waktu rekrut rata-rata turun 43% dan kualitas kandidat yang masuk ke tahap wawancara meningkat hampir tiga kali lipat. Tim HR kini memiliki visibilitas penuh lintas 12 anak usaha dari satu dasbor.',
  },
]

export default function GroupConglomerateCaseStudyPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto w-full max-w-4xl px-6">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Studi Kasus · Enterprise
            </span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Menyatukan rekrutmen 12 anak usaha dalam satu platform
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Bagaimana sebuah grup konglomerasi nasional mengonsolidasikan enam
            sistem ATS, mempercepat perekrutan, dan meningkatkan kualitas
            kandidat bersama SSN Pekerja.
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-background py-12 md:py-16" aria-label="Hasil utama">
        <div className="container mx-auto w-full max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6"
              >
                <span className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {m.value}
                </span>
                <span className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative */}
      <section className="bg-background pb-16 md:pb-24">
        <div className="container mx-auto w-full max-w-3xl px-6">
          <div className="space-y-10">
            {sections.map((s) => (
              <article key={s.heading}>
                <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  {s.heading}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {s.body}
                </p>
              </article>
            ))}

            <blockquote className="border-l-2 border-l-[color:var(--ring)] pl-5">
              <Quote className="-ml-1 h-7 w-7 text-[color:var(--ring)]/30" aria-hidden />
              <p className="mt-2 font-heading text-base italic text-foreground/90 md:text-lg">
                &ldquo;Untuk pertama kalinya kami bisa melihat seluruh pipeline
                rekrutmen grup dari satu layar. Keputusan jadi lebih cepat dan
                berbasis data.&rdquo;
              </p>
              <footer className="mt-4 text-xs text-muted-foreground">
                <strong className="font-medium text-foreground">
                  Direktur SDM Grup
                </strong>{' '}
                &mdash; Konglomerasi Nasional
              </footer>
            </blockquote>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/enterprise">
                  Pelajari solusi enterprise
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">
                  Hubungi tim kami
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
