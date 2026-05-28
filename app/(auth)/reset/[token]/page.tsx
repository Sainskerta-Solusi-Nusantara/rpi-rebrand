import Link from 'next/link'
import { checkResetToken } from '@/lib/auth/actions'
import { ResetForm } from './reset-form'

export const metadata = {
  title: 'Reset Password · Rumah Pekerja Indonesia',
  description: 'Atur password baru untuk akun RPI Anda.',
}

export default async function ResetTokenPage({
  params,
}: {
  params: { token: string }
}) {
  const status = await checkResetToken(params.token)

  if (!status.valid) {
    const message =
      status.reason === 'expired'
        ? 'Tautan reset sudah kedaluwarsa. Minta tautan baru.'
        : status.reason === 'used'
          ? 'Tautan reset ini sudah digunakan. Jika Anda masih perlu, minta tautan baru.'
          : 'Tautan reset tidak valid. Pastikan Anda membuka tautan terbaru dari email.'

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Tautan tidak berlaku
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </header>

        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/forgot"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
          >
            Minta tautan baru
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
          Atur password baru
        </h2>
        <p className="text-sm text-muted-foreground">
          {status.userName ? `Halo ${status.userName}, ` : ''}buat password baru
          yang kuat dan tidak Anda gunakan di layanan lain.
        </p>
      </header>

      <ResetForm token={params.token} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Batal — kembali ke masuk
        </Link>
      </p>
    </div>
  )
}
