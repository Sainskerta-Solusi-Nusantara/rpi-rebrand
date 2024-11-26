import type { ReactNode } from 'react'
import Link from 'next/link'

/**
 * Auth split-screen layout.
 * Left: navy panel with RPI brand wordmark + tagline.
 * Right: white card slot for the auth form (children).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between bg-[hsl(220,50%,14%)] p-12 text-white lg:flex">
          {/* TODO: replace inline navy with var(--brand-navy) once Agent 2 exposes tokens */}
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-md bg-[hsl(43,74%,55%)] font-heading text-lg font-bold text-[hsl(220,50%,14%)]"
            >
              R
            </div>
            <span className="text-sm uppercase tracking-[0.2em] text-white/70">
              RPI SaaS
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Rumah Pekerja
              <br />
              Indonesia
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Platform karier premium untuk pencari kerja dan mitra perusahaan
              di seluruh Indonesia. Temukan peluang, bangun tim, kembangkan
              karier.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="h-px w-12 bg-[hsl(43,74%,55%)]" />
              <span className="italic">Kerja bermakna. Karier bermartabat.</span>
            </div>
          </div>

          <footer className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Rumah Pekerja Indonesia. All rights reserved.
          </footer>
        </aside>

        {/* Form panel */}
        <main className="flex flex-col">
          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <Link href="/" className="font-heading text-xl font-semibold text-[hsl(220,50%,14%)]">
                  Rumah Pekerja Indonesia
                </Link>
              </div>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                {children}
              </div>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Dengan melanjutkan, Anda menyetujui{' '}
                <Link href="/terms" className="underline hover:text-foreground">
                  Syarat
                </Link>{' '}
                &amp;{' '}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Kebijakan Privasi
                </Link>
                .
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
