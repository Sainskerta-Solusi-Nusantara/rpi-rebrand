'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO: wire to telemetry (Sentry/PostHog) when configured.
    // eslint-disable-next-line no-console
    console.error('App error boundary:', error)
  }, [error])

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-destructive font-mono text-sm font-semibold tracking-widest uppercase">
        Terjadi kesalahan
      </p>
      <h1 className="font-heading text-foreground mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Maaf, terjadi gangguan
      </h1>
      <p className="text-muted-foreground mt-4 max-w-md text-base">
        Sistem mengalami kendala saat memproses permintaan Anda. Silakan coba lagi atau hubungi
        dukungan jika masalah berlanjut.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground/70 mt-3 font-mono text-xs">
          Ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Coba lagi
        </button>
        <a
          href="/"
          className="text-foreground hover:text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Kembali ke beranda
        </a>
      </div>
    </main>
  )
}
