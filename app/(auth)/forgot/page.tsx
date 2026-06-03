import Link from 'next/link'
import { requestPasswordReset } from '@/lib/auth/actions'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = {
  title: 'Lupa Password · Rumah Pekerja Indonesia',
  description: 'Atur ulang password akun RPI Anda.',
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { sent?: string }
}) {
  const sent = searchParams?.sent === '1'
  const t = await getServerT()
  const tr = t.auth.reset

  async function action(formData: FormData) {
    'use server'
    const result = await requestPasswordReset(formData)
    if (result.ok) {
      const { redirect } = await import('next/navigation')
      redirect('/forgot?sent=1')
    }
    // On validation failure we let the page re-render via search param.
    // Simple MVP: rely on the success flag; richer error UX is a TODO.
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {tr.forgotTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tr.forgotPrompt}
        </p>
      </header>

      {sent ? (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {tr.forgotSentNotice}
        </div>
      ) : (
        <form action={action} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              {tr.forgotEmailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={tr.forgotEmailPlaceholder}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2"
          >
            {tr.forgotSubmit}
            <span aria-hidden className="text-[hsl(43,74%,55%)]">
              →
            </span>
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {tr.forgotRemember}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {tr.forgotBackToLogin}
        </Link>
      </p>
    </div>
  )
}
