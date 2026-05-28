import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
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

  return (
    <div className="space-y-6 text-center">
      <div
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[hsl(43,74%,55%)]/15 text-3xl"
      >
        <span className="text-[hsl(220,50%,14%)]">↩</span>
      </div>

      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Keluar dari RPI?
        </h2>
        <p className="text-sm text-muted-foreground">
          Anda akan keluar sebagai{' '}
          <strong className="text-foreground">{session.user.email}</strong>.
          Anda dapat masuk kembali kapan saja.
        </p>
      </header>

      <LogoutActions />

      <p className="text-center text-sm text-muted-foreground">
        Ingin tetap masuk?{' '}
        <Link href="/dashboard" className="font-medium text-primary hover:underline">
          Kembali ke dasbor
        </Link>
      </p>
    </div>
  )
}
