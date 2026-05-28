import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Masuk · Rumah Pekerja Indonesia',
  description: 'Masuk ke akun RPI Anda.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; registered?: string; error?: string; signedOut?: string }
}) {
  const session = await auth()
  if (session?.user) {
    redirect(searchParams?.callbackUrl ?? '/dashboard')
  }

  const showRegistered = searchParams?.registered === '1'
  const showSignedOut = searchParams?.signedOut === '1'

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Selamat datang kembali
        </h2>
        <p className="text-sm text-muted-foreground">
          Masuk untuk melanjutkan ke RPI.
        </p>
      </header>

      {showRegistered && (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          Akun berhasil dibuat. Silakan masuk.
        </div>
      )}

      {showSignedOut && (
        <div
          role="status"
          className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Anda telah keluar.
        </div>
      )}

      <LoginForm callbackUrl={searchParams?.callbackUrl} initialError={searchParams?.error} />

      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Daftar sekarang
          </Link>
        </p>
        <p>
          <Link
            href="/forgot"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Lupa password?
          </Link>
        </p>
      </div>
    </div>
  )
}
