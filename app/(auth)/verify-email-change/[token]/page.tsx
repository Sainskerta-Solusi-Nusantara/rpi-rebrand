import Link from 'next/link'
import { checkEmailChangeToken } from '@/lib/auth/email-change-actions'
import { ConfirmEmailChangeButton } from './confirm-button'

export const metadata = {
  title: 'Konfirmasi Email Baru · Rumah Pekerja Indonesia',
  description: 'Konfirmasi perubahan alamat email akun RPI Anda.',
}

export default async function VerifyEmailChangePage({
  params,
}: {
  params: { token: string }
}) {
  const status = await checkEmailChangeToken(params.token)

  if (!status.valid) {
    const message =
      status.reason === 'expired'
        ? 'Tautan konfirmasi sudah kedaluwarsa. Buka pengaturan keamanan untuk mulai permintaan baru.'
        : status.reason === 'used'
          ? 'Tautan konfirmasi ini sudah digunakan.'
          : status.reason === 'taken'
            ? 'Email tersebut sudah digunakan oleh akun lain.'
            : 'Tautan konfirmasi tidak valid. Pastikan Anda membuka tautan terbaru dari email.'

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Tidak dapat mengonfirmasi
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </header>

        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/dashboard/keamanan"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
          >
            Buka pengaturan keamanan
            <span aria-hidden className="text-[hsl(43,74%,55%)]">
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="text-center text-muted-foreground hover:text-foreground hover:underline"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Konfirmasi email baru
        </h2>
        <p className="text-sm text-muted-foreground">
          Anda akan mengganti email akun dari{' '}
          <span className="font-mono">{status.oldEmail}</span> ke{' '}
          <span className="font-mono">{status.newEmail}</span>. Setelah
          konfirmasi, Anda harus masuk lagi menggunakan email baru.
        </p>
      </header>

      <ConfirmEmailChangeButton token={params.token} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard/keamanan" className="font-medium text-primary hover:underline">
          Batal — kembali ke keamanan
        </Link>
      </p>
    </div>
  )
}
