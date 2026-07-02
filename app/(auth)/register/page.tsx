import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { RegisterForm } from './register-form'

export const metadata = {
  title: 'Daftar · SSN Pekerja',
  description: 'Buat akun SSN gratis untuk mulai mencari pekerjaan.',
}

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  const t = await getServerT()

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t.auth.register.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.auth.register.subtitle}
        </p>
      </header>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.register.haveAccount}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.auth.register.signInLink}
        </Link>
      </p>
    </div>
  )
}
