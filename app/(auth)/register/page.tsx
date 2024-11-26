import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { RegisterForm } from './register-form'

export const metadata = {
  title: 'Daftar · Rumah Pekerja Indonesia',
  description: 'Buat akun RPI gratis untuk mulai mencari pekerjaan.',
}

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Buat akun baru
        </h2>
        <p className="text-sm text-muted-foreground">
          Bergabung dengan ribuan pencari kerja di seluruh Indonesia.
        </p>
      </header>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
