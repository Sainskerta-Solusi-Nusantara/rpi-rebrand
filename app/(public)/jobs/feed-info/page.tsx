import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Rss, FileCode, Linkedin, Globe } from 'lucide-react'
import { FeedUrlBlock } from '@/components/organisms/feed-url-block'

export const metadata: Metadata = {
  title: 'Feed XML lowongan — Sindikasi',
  description:
    'Feed XML publik RPI untuk LinkedIn Jobs, Indeed, dan generic Atom — siap dikonsumsi mitra ATS dan agregator lowongan.',
  alternates: { canonical: '/jobs/feed-info' },
}

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://rumahpekerja.id').replace(
  /\/+$/,
  '',
)

const formats = [
  {
    key: 'atom',
    label: 'Generic Atom 1.0',
    icon: Rss,
    description:
      'Format RSS / Atom standar (RFC 4287). Bisa dibaca aplikasi feed reader, agregator umum, atau pipeline scraping ringan.',
    url: `${BASE_URL}/jobs/feed.xml?format=atom`,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn Jobs XML',
    icon: Linkedin,
    description:
      'Format khusus LinkedIn Talent Hub (XML feed). Cocok untuk integrasi Limited Listings / mitra LinkedIn yang menarik lowongan secara terjadwal.',
    url: `${BASE_URL}/jobs/feed.xml?format=linkedin`,
  },
  {
    key: 'indeed',
    label: 'Indeed XML',
    icon: FileCode,
    description:
      'Format XML standar Indeed (lihat docs.indeed.com). Mendukung field salary, jobtype, dan referencenumber per lowongan.',
    url: `${BASE_URL}/jobs/feed.xml?format=indeed`,
  },
] as const

export default function FeedInfoPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/jobs' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar lowongan
        </Link>
      </div>

      <header className="space-y-3">
        <div className="bg-muted inline-flex size-12 items-center justify-center rounded-xl">
          <Rss className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl">Feed XML lowongan</h1>
        <p className="text-muted-foreground text-base">
          RPI menyediakan feed XML publik berisi lowongan terbaru sehingga
          aplikasi ATS, agregator, dan mitra distribusi seperti LinkedIn dan
          Indeed dapat menarik data tanpa scraping. Feed di-cache 10 menit di
          edge — cocok untuk dipoll setiap 15–30 menit.
        </p>
      </header>

      <section className="space-y-5" aria-labelledby="feeds-publik">
        <h2 id="feeds-publik" className="font-heading text-2xl">
          Feed publik
        </h2>
        <p className="text-muted-foreground text-sm">
          Setiap URL di bawah ini mengembalikan paling banyak 500 lowongan
          terbaru berstatus PUBLISHED, diurutkan menurun berdasarkan tanggal
          publikasi.
        </p>

        <div className="space-y-5">
          {formats.map((f) => {
            const Icon = f.icon
            return (
              <article
                key={f.key}
                className="border-border bg-card space-y-3 rounded-2xl border p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted grid size-9 place-items-center rounded-md">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg">{f.label}</h3>
                    <p className="text-muted-foreground text-xs">
                      {f.description}
                    </p>
                  </div>
                </div>
                <FeedUrlBlock url={f.url} />
              </article>
            )
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="feed-tenant">
        <h2 id="feed-tenant" className="font-heading text-2xl">
          Feed per tenant
        </h2>
        <p className="text-muted-foreground text-sm">
          Mitra ATS yang hanya menarik lowongan dari satu tenant tertentu dapat
          menambahkan parameter <code className="font-mono">?tenant={'{slug}'}</code>{' '}
          ke URL feed. Contoh:
        </p>
        <FeedUrlBlock
          url={`${BASE_URL}/jobs/feed.xml?format=atom&tenant=tenant-anda`}
          description="Ganti tenant-anda dengan slug tenant Anda."
        />
        <p className="text-muted-foreground text-xs">
          Bila tenant tidak ditemukan atau belum memiliki lowongan PUBLISHED,
          server akan merespons 404 dengan body XML yang menjelaskan alasannya.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="untuk-ats">
        <h2 id="untuk-ats" className="font-heading text-2xl">
          Untuk mitra ATS
        </h2>
        <p className="text-muted-foreground text-sm">
          Berikut contoh perintah curl untuk masing-masing format. Semua
          response menggunakan <code className="font-mono">Content-Type: application/xml; charset=utf-8</code>{' '}
          dan header <code className="font-mono">Cache-Control: public, s-maxage=600, stale-while-revalidate=1800</code>.
        </p>
        <pre className="border-border bg-muted/40 overflow-x-auto rounded-md border p-3 text-xs">
{`# Generic Atom (default)
curl -sSL "${BASE_URL}/jobs/feed.xml" -o jobs.atom.xml

# LinkedIn Jobs XML
curl -sSL "${BASE_URL}/jobs/feed.xml?format=linkedin" -o jobs.linkedin.xml

# Indeed XML
curl -sSL "${BASE_URL}/jobs/feed.xml?format=indeed" -o jobs.indeed.xml

# Tenant-specific (contoh slug "acme")
curl -sSL "${BASE_URL}/jobs/feed.xml?format=atom&tenant=acme" -o jobs.acme.atom.xml`}
        </pre>
      </section>

      <section className="space-y-3" aria-labelledby="jadwal-refresh">
        <h2 id="jadwal-refresh" className="font-heading text-2xl">
          Jadwal refresh
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            Feed dibangun ulang on-demand dan di-cache <strong>10 menit</strong> di edge.
          </li>
          <li>
            Selama jendela <strong>30 menit stale-while-revalidate</strong>, CDN
            menyajikan versi cache lama sementara me-refresh di latar belakang.
          </li>
          <li>
            Rekomendasi polling untuk mitra ATS: setiap <strong>15–30 menit</strong>.
            Polling lebih sering tidak menghasilkan data lebih baru dan hanya
            menambah biaya bandwidth.
          </li>
          <li>
            Maksimum <strong>500 lowongan</strong> per feed, diurutkan menurun
            menurut <code className="font-mono">publishedAt</code>.
          </li>
        </ul>
      </section>

      <section
        className="border-border bg-muted/30 space-y-2 rounded-2xl border p-5"
        aria-labelledby="bantuan"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" aria-hidden="true" />
          <h2 id="bantuan" className="font-heading text-lg">
            Butuh bantuan integrasi?
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Hubungi tim partnership kami untuk diskusi format khusus, frekuensi
          push, atau perjanjian distribusi formal.
        </p>
      </section>
    </main>
  )
}
