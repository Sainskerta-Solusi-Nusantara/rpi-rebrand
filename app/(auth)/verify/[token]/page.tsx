import Link from 'next/link'
import { verifyEmail } from '@/lib/auth/actions'
import { auth } from '@/lib/auth/session'

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

  if (!result.ok) {
    const message =
      result.reason === 'expired'
        ? 'Tautan verifikasi sudah kedaluwarsa. Minta tautan baru dari halaman keamanan.'
        : result.reason === 'used'
          ? 'Tautan verifikasi ini sudah digunakan. Jika email Anda belum terverifikasi, minta tautan baru.'
          : 'Tautan verifikasi tidak valid. Pastikan Anda membuka tautan terbaru dari email.'

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Verifikasi gagal
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </header>

        <div className="flex flex-col gap-2 text-sm">
          {signedIn ? (
            <Link
              href="/dashboard/keamanan"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
            >
              Buka pengaturan keamanan
              <span aria-hidden className="text-[hsl(43,74%,55%)]">
                →
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
            >
              Masuk untuk minta tautan baru
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
        <span className="text-[hsl(220,50%,14%)]">✓</span>
      </div>

      <header className="space-y-2 text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {result.alreadyVerified ? 'Email sudah terverifikasi' : 'Email berhasil diverifikasi'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.alreadyVerified
            ? 'Tidak ada yang perlu dilakukan — akun Anda sudah aktif.'
            : 'Terima kasih. Akun Anda sekarang aktif sepenuhnya.'}
        </p>
      </header>

      <div className="flex flex-col gap-2 text-sm">
        <Link
          href={signedIn ? '/dashboard' : '/login'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
        >
          {signedIn ? 'Lanjut ke dashboard' : 'Masuk ke akun Anda'}
          <span aria-hidden className="text-[hsl(43,74%,55%)]">
            →
          </span>
        </Link>
      </div>
    </div>
  )
}
