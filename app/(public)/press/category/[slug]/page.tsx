import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Newspaper } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import {
  findCategoryBySlug,
  getPressCategoryFacets,
  releasesByCategory,
} from '@/lib/press-facets'
import { PRESS_CATEGORY_COLOR, type PressCategory } from '@/lib/press-data'

type Params = { slug: string }

const CATEGORY_DESCRIPTION: Record<PressCategory, string> = {
  Pendanaan:
    'Pengumuman pendanaan, ekuitas, dan tonggak komersial yang membentuk pertumbuhan RPI dan ekosistem mitranya.',
  Produk:
    'Peluncuran produk, fitur baru, dan tonggak teknologi yang memperluas cakupan platform RPI.',
  Kemitraan:
    'Kolaborasi dengan perusahaan, pemerintah, dan lembaga pendidikan untuk memperluas dampak RPI.',
  Riset:
    'Laporan riset dan publikasi data berdasarkan platform RPI tentang tren tenaga kerja dan industri Indonesia.',
  Penghargaan:
    'Penghargaan industri dan pengakuan yang diterima RPI dan timnya.',
}

export function generateStaticParams(): Params[] {
  return getPressCategoryFacets().map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const category = findCategoryBySlug(params.slug)
  if (!category) return { title: 'Kategori Tidak Ditemukan' }
  return {
    title: `${category} — Press RPI`,
    description: `Semua siaran pers RPI dalam kategori ${category}.`,
  }
}

export default async function CategoryPage({
  params: { slug },
}: {
  params: Params
}) {
  const category = findCategoryBySlug(slug)
  if (!category) notFound()

  const releases = releasesByCategory(category)
  const allCategories = getPressCategoryFacets()
  const otherCategories = allCategories.filter((c) => c.slug !== slug)
  const description = CATEGORY_DESCRIPTION[category]
  const accent = PRESS_CATEGORY_COLOR[category]

  return (
    <>
      {/* Hero */}
      <section
        className="bg-background relative isolate overflow-hidden"
        aria-labelledby="category-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)',
            backgroundSize: '100% 96px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 16%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/press"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke press
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white"
              style={{ background: accent }}
            >
              {category}
            </span>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
              Kategori Siaran Pers
            </span>
          </div>
          <h1
            id="category-heading"
            className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
          >
            {category}
          </h1>
          <p className="text-muted-foreground mt-5 text-balance text-lg leading-relaxed md:text-xl">
            {description}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            <strong className="text-foreground font-medium">
              {releases.length}
            </strong>{' '}
            siaran pers dalam kategori ini.
          </p>
        </div>
      </section>

      {/* Releases list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-5xl px-6">
          {releases.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <Newspaper
                className="text-muted-foreground mx-auto h-8 w-8"
                aria-hidden
              />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                Belum ada siaran pers dalam kategori ini
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Jelajahi semua siaran pers RPI di halaman press.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/press">Lihat semua siaran pers</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {releases.map((r) => (
                <li key={r.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/press/${r.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] group block rounded-2xl border p-6 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white"
                            style={{
                              background: PRESS_CATEGORY_COLOR[r.category],
                            }}
                          >
                            {r.category}
                          </span>
                          <span>{r.date}</span>
                        </div>
                        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-lg font-semibold leading-snug transition">
                          {r.title}
                        </h3>
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-relaxed">
                          {r.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Footer rail: other categories */}
      {otherCategories.length > 0 && (
        <section
          className="bg-muted/30 py-16 md:py-20"
          aria-label="Kategori lainnya"
        >
          <div className="container mx-auto w-full max-w-5xl px-6">
            <div className="mb-8 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                Jelajahi kategori lain
              </span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {otherCategories.map((c) => (
                <li key={c.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/press/category/${c.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] text-foreground/80 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: PRESS_CATEGORY_COLOR[c.name] }}
                    />
                    {c.name}
                    <span className="text-muted-foreground text-xs">
                      {c.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
