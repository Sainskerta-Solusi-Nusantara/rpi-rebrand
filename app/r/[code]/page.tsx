import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Undangan referral — RPI' }

const REF_COOKIE_NAME = 'rpi_ref'
const REF_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30 // 30 days

export default async function ReferralLandingPage({
  params,
}: {
  params: { code: string }
}) {
  const rawCode = (params?.code ?? '').trim()
  if (!rawCode || rawCode.length > 32) notFound()

  const referral = await prisma.referral.findFirst({
    where: { code: { equals: rawCode, mode: 'insensitive' } },
    select: {
      code: true,
      user: { select: { name: true } },
    },
  })

  if (!referral) notFound()

  const canonicalCode = referral.code
  const referrerName = referral.user?.name ?? 'seorang teman'

  // Set the rpi_ref cookie so the upcoming registration flow can apply it.
  try {
    cookies().set({
      name: REF_COOKIE_NAME,
      value: canonicalCode,
      maxAge: REF_COOKIE_MAX_AGE_SEC,
      sameSite: 'lax',
      path: '/',
      httpOnly: false,
    })
  } catch {
    // Setting cookies during a render in Next 14 server components is supported
    // when the page is dynamic. Swallow if the runtime disallows it.
  }

  const registerHref = `/register?ref=${encodeURIComponent(canonicalCode)}`
  const loginHref = `/login?ref=${encodeURIComponent(canonicalCode)}`

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Undangan referral
        </span>

        <h1 className="font-heading mt-6 text-3xl md:text-4xl">
          Selamat datang! Anda diundang ke RPI oleh{' '}
          <span className="text-primary">{referrerName}</span>.
        </h1>

        <p className="text-muted-foreground mt-4 max-w-xl text-base">
          Bergabunglah di Rumah Pekerja Indonesia — temukan lowongan, kursus
          gratis, dan jaringan profesional dengan kode referral{' '}
          <code className="bg-muted text-foreground rounded px-2 py-0.5 font-mono text-sm font-semibold">
            {canonicalCode}
          </code>
          .
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={registerHref as any}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold shadow-sm transition-colors"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            Daftar sekarang
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={loginHref as any}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex h-11 items-center justify-center gap-2 rounded-md border px-6 text-sm font-semibold shadow-sm transition-colors"
          >
            Sudah punya akun? Masuk
          </Link>
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Kode referral akan otomatis diterapkan saat Anda menyelesaikan
          pendaftaran.
        </p>
      </div>
    </main>
  )
}
