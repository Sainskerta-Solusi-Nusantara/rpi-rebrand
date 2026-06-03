import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { LogoutActions } from './logout-actions'

export const metadata = {
  title: 'Keluar · Rumah Pekerja Indonesia',
  description: 'Konfirmasi keluar dari akun.',
}

export default async function LogoutPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  const t = await getServerT()
  const tl = t.auth.logout

  return (
    <div className="space-y-6 text-center">
      <div
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[hsl(43,74%,55%)]/15 text-3xl"
      >
        <span className="text-primary">↩</span>
      </div>

      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {tl.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tl.bodyPrefix}{' '}
          <strong className="text-foreground">{session.user.email}</strong>
          {tl.bodySuffix}
        </p>
      </header>

      <LogoutActions />

      <p className="text-center text-sm text-muted-foreground">
        {tl.stayPrompt}{' '}
        <Link href="/dashboard" className="font-medium text-primary hover:underline">
          {tl.backToDashboard}
        </Link>
      </p>
    </div>
  )
}
