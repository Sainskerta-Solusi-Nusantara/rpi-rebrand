import Link from 'next/link'
import { checkEmailChangeToken } from '@/lib/auth/email-change-actions'
import { getServerT } from '@/lib/i18n/server-dictionary'
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
  const t = await getServerT()
  const tc = t.auth.verify.change

  if (!status.valid) {
    const message =
      status.reason === 'expired'
        ? tc.reasonExpired
        : status.reason === 'used'
          ? tc.reasonUsed
          : status.reason === 'taken'
            ? tc.reasonTaken
            : tc.reasonInvalid

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {tc.failTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </header>

        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/dashboard/keamanan"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {tc.ctaSecurity}
            <span aria-hidden className="text-[hsl(43,74%,55%)]">
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="text-center text-muted-foreground hover:text-foreground hover:underline"
          >
            {tc.ctaLogin}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {tc.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tc.bodyPrefix}{' '}
          <span className="font-mono">{status.oldEmail}</span> {tc.bodyTo}{' '}
          <span className="font-mono">{status.newEmail}</span>
          {tc.bodySuffix}
        </p>
      </header>

      <ConfirmEmailChangeButton token={params.token} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard/keamanan" className="font-medium text-primary hover:underline">
          {tc.cancel}
        </Link>
      </p>
    </div>
  )
}
