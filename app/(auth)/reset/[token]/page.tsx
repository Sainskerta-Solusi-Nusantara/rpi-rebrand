import Link from 'next/link'
import { checkResetToken } from '@/lib/auth/actions'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { ResetForm } from './reset-form'

export const metadata = {
  title: 'Reset Password · SSN Pekerja',
  description: 'Atur password baru untuk akun SSN Anda.',
}

export default async function ResetTokenPage({
  params,
}: {
  params: { token: string }
}) {
  const status = await checkResetToken(params.token)
  const t = await getServerT()
  const tr = t.auth.reset

  if (!status.valid) {
    const message =
      status.reason === 'expired'
        ? tr.reasonExpired
        : status.reason === 'used'
          ? tr.reasonUsed
          : tr.reasonInvalid

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {tr.invalidTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </header>

        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/forgot"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {tr.requestNew}
            <span aria-hidden className="text-[hsl(43,74%,55%)]">
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="text-center text-muted-foreground hover:text-foreground hover:underline"
          >
            {tr.backToLogin}
          </Link>
        </div>
      </div>
    )
  }

  const greeting = status.userName
    ? tr.resetSubtitleGreeting.replace('{name}', status.userName)
    : ''

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {tr.resetTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {greeting}
          {tr.resetSubtitleBody}
        </p>
      </header>

      <ResetForm token={params.token} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {tr.cancel}
        </Link>
      </p>
    </div>
  )
}
