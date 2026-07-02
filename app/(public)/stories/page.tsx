import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Quote } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { CTABanner } from '@/components/organisms/cta-banner'

export const metadata: Metadata = {
  title: 'Cerita Sukses',
  description:
    'Kisah nyata pekerja Indonesia yang menemukan karier impian, meningkatkan keterampilan, dan bertumbuh bersama SSN Pekerja.',
}

const stories = [
  {
    quote:
      'Tiga minggu setelah memperbarui CV lewat platform, saya diterima sebagai admin di perusahaan logistik dekat rumah.',
    name: 'Siti Rahmawati',
    role: 'Staf Administrasi · Bekasi',
  },
  {
    quote:
      'Kursus barista gratis di sini mengubah hidup saya. Sekarang saya kepala barista di kedai kopi sendiri.',
    name: 'Andi Pratama',
    role: 'Kepala Barista · Bandung',
  },
  {
    quote:
      'Sebagai fresh graduate saya sempat bingung. Rekomendasi lowongan yang relevan membuat saya cepat dapat kerja.',
    name: 'Dewi Lestari',
    role: 'Junior Accountant · Jakarta',
  },
  {
    quote:
      'Fitur pencocokan keterampilan membantu saya pindah dari pabrik ke posisi teknisi dengan gaji dua kali lipat.',
    name: 'Budi Santoso',
    role: 'Teknisi Mesin · Surabaya',
  },
  {
    quote:
      'Komunitasnya sangat suportif. Saya belajar wawancara dari sesama anggota dan akhirnya lolos di startup teknologi.',
    name: 'Rina Marlina',
    role: 'Customer Success · Yogyakarta',
  },
  {
    quote:
      'Setelah PHK, saya menemukan pekerjaan baru hanya dalam sebulan berkat notifikasi lowongan yang tepat sasaran.',
    name: 'Joko Susilo',
    role: 'Supervisor Gudang · Semarang',
  },
]

export default function StoriesPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto w-full max-w-3xl px-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Cerita Sukses
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Karier yang bertumbuh, dimulai dari sini
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Ratusan ribu pekerja Indonesia telah menemukan peluang baru bersama
            kami. Inilah beberapa kisah mereka.
          </p>
        </div>
      </section>

      {/* Stories grid */}
      <section className="bg-background py-16 md:py-24" aria-label="Daftar cerita sukses">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <figure
                key={s.name}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6"
              >
                <Quote
                  className="h-7 w-7 shrink-0 text-[color:var(--ring)]/30"
                  aria-hidden
                />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90 md:text-base">
                  &ldquo;{s.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <span className="block text-sm font-medium text-foreground">
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {s.role}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                Mulai cerita Anda
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/jobs">
                Jelajahi lowongan
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
