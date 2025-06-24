import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-secondary font-mono text-sm font-semibold tracking-widest uppercase">
        404
      </p>
      <h1 className="font-heading text-foreground mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Halaman tidak ditemukan
      </h1>
      <p className="text-muted-foreground mt-4 max-w-md text-base">
        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Kembali ke beranda
        </Link>
        <Link
          href="/contact"
          className="text-foreground hover:text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Hubungi dukungan
        </Link>
      </div>
    </main>
  )
}
