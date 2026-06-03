import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { auth } from '@/lib/auth/session'
import { checkTenantInvite } from '@/lib/tenants/actions'
import { AcceptInviteButton } from './accept-actions'

export const metadata = {
  title: 'Terima Undangan · Rumah Pekerja Indonesia',
  description: 'Terima undangan bergabung ke tenant RPI.',
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  MEMBER: 'Member',
}

export default async function AcceptInvitePage({
  params,
}: {
  params: { token: string }
}) {
  const [status, session] = await Promise.all([
    checkTenantInvite(params.token),
    auth(),
  ])

  if (!status.valid) {
    const message =
      status.reason === 'expired'
        ? 'Undangan sudah kedaluwarsa. Minta undangan baru dari admin tenant.'
        : status.reason === 'used'
          ? 'Undangan ini sudah digunakan.'
          : 'Undangan tidak valid. Pastikan Anda membuka tautan terbaru dari email.'

    return (
      <main className="min-h-screen w-full bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Undangan tidak berlaku
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{message}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </main>
    )
  }

  const signedIn = Boolean(session?.user?.id)
  const emailMatches =
    signedIn &&
    session?.user.email?.toLowerCase() === status.email.toLowerCase()

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="h-7 w-7" aria-hidden="true" />
        </div>

        <h1 className="font-heading mt-6 text-center text-2xl font-semibold tracking-tight">
          Undangan dari {status.tenantName}
        </h1>

        <p className="text-muted-foreground mt-3 text-center text-sm">
          Anda diundang sebagai{' '}
          <span className="text-foreground font-medium">
            {roleLabels[status.role] ?? status.role}
          </span>{' '}
          ke tenant{' '}
          <span className="text-foreground font-medium">{status.tenantName}</span>.
        </p>

        <p className="text-muted-foreground mt-2 text-center text-xs">
          Untuk email: <span className="font-mono">{status.email}</span>
        </p>

        <div className="bg-card border-border mt-8 w-full rounded-2xl border p-6">
          {!signedIn ? (
            <div className="space-y-4">
              <p className="text-sm">
                Masuk atau daftar dengan email{' '}
                <span className="font-mono">{status.email}</span> untuk menerima
                undangan ini.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/accept/${params.token}`)}` as never}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Masuk untuk menerima
                  <span aria-hidden className="text-[hsl(43,74%,55%)]">
                    →
                  </span>
                </Link>
                <Link
                  href={`/register?callbackUrl=${encodeURIComponent(`/accept/${params.token}`)}` as never}
                  className="border-border inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Daftar akun baru
                </Link>
              </div>
            </div>
          ) : emailMatches ? (
            <AcceptInviteButton token={params.token} />
          ) : (
            <div className="space-y-4">
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                Anda masuk sebagai{' '}
                <span className="font-mono">{session?.user.email}</span>, tetapi
                undangan ini untuk{' '}
                <span className="font-mono">{status.email}</span>.
              </p>
              <Link
                href={`/logout` as never}
                className="border-border inline-flex w-full items-center justify-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Keluar dan masuk dengan akun lain
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
