import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Masuk · Rumah Pekerja Indonesia',
  description: 'Masuk ke akun RPI Anda.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: {
    callbackUrl?: string
    registered?: string
    error?: string
    signedOut?: string
    reset?: string
    emailChanged?: string
  }
}) {
  const session = await auth()
  if (session?.user) {
    redirect(searchParams?.callbackUrl ?? '/dashboard')
  }

  const t = await getServerT()

  const showRegistered = searchParams?.registered === '1'
  const showSignedOut = searchParams?.signedOut === '1'
  const showReset = searchParams?.reset === '1'
  const showEmailChanged = searchParams?.emailChanged === '1'

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t.auth.login.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.auth.login.subtitle}
        </p>
      </header>

      {showRegistered && (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {t.auth.login.notices.registered}
        </div>
      )}

      {showSignedOut && (
        <div
          role="status"
          className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          {t.auth.login.notices.signedOut}
        </div>
      )}

      {showReset && (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {t.auth.login.notices.reset}
        </div>
      )}

      {showEmailChanged && (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {t.auth.login.notices.emailChanged}
        </div>
      )}

      <LoginForm callbackUrl={searchParams?.callbackUrl} initialError={searchParams?.error} />

      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          {t.auth.login.noAccount}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t.auth.login.signUpLink}
          </Link>
        </p>
        <p>
          <Link
            href="/forgot"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t.auth.login.forgotPassword}
          </Link>
        </p>
      </div>
    </div>
  )
}
