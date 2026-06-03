import Link from 'next/link'
import { verifyEmail } from '@/lib/auth/actions'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = {
  title: 'Verifikasi Email · Rumah Pekerja Indonesia',
  description: 'Konfirmasi alamat email akun RPI Anda.',
}

export default async function VerifyTokenPage({
  params,
}: {
  params: { token: string }
}) {
  const result = await verifyEmail(params.token)
  const session = await auth()
  const signedIn = Boolean(session?.user?.id)
  const t = await getServerT()
  const tv = t.auth.verify.token

  if (!result.ok) {
    const message =
      result.reason === 'expired'
        ? tv.reasonExpired
        : result.reason === 'used'
          ? tv.reasonUsed
          : tv.reasonInvalid

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {tv.failTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </header>

        <div className="flex flex-col gap-2 text-sm">
          {signedIn ? (
            <Link
              href="/dashboard/keamanan"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {tv.ctaSecurity}
              <span aria-hidden className="text-[hsl(43,74%,55%)]">
                →
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {tv.ctaLogin}
              <span aria-hidden className="text-[hsl(43,74%,55%)]">
                →
              </span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[hsl(43,74%,55%)]/15 text-3xl"
      >
        <span className="text-primary">✓</span>
      </div>

      <header className="space-y-2 text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {result.alreadyVerified ? tv.alreadyTitle : tv.successTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.alreadyVerified ? tv.alreadyBody : tv.successBody}
        </p>
      </header>

      <div className="flex flex-col gap-2 text-sm">
        <Link
          href={signedIn ? '/dashboard' : '/login'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          {signedIn ? tv.ctaDashboard : tv.ctaToLogin}
          <span aria-hidden className="text-[hsl(43,74%,55%)]">
            →
          </span>
        </Link>
      </div>
    </div>
  )
}
