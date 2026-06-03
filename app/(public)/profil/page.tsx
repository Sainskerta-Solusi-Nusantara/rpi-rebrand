import type { Metadata } from 'next'
import Link from 'next/link'
import { UserRound } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata: Metadata = {
  title: 'Profil RPI',
  description: 'Profil RPI tidak ditemukan. Masukkan username atau ID profil di URL.',
  robots: { index: false, follow: false },
}

export default async function PublicProfileIndexPage() {
  const t = await getServerT()
  const p = t.pagesPublicMisc.profil
  return (
    <div className="bg-background">
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-16">
        <div className="border-border bg-card w-full rounded-2xl border p-10 text-center shadow-sm">
          <span
            className="mx-auto grid size-12 place-items-center rounded-full text-white"
            style={{ background: 'hsl(220, 50%, 14%)' }}
            aria-hidden
          >
            <UserRound className="h-6 w-6" />
          </span>
          <h1 className="font-heading mt-5 text-2xl font-bold text-foreground md:text-3xl">
            {p.heading}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {p.body
              .replace('{usernameCode}', '\x00USERNAME\x00')
              .replace('{exampleCode}', '\x00EXAMPLE\x00')
              .split('\x00')
              .map((part, i) => {
                if (part === 'USERNAME') return <code key={i} className="bg-muted rounded px-1 py-0.5">username</code>
                if (part === 'EXAMPLE') return <code key={i} className="bg-muted rounded px-1 py-0.5">/profil/nama-anda</code>
                return part || null
              })}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/mitra"
              className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
            >
              {p.ctaBrowse}
            </Link>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center text-sm font-medium underline-offset-4 hover:underline"
            >
              {p.ctaHome}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
