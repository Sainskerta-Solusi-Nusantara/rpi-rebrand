import { requireAuth } from '@/lib/auth/session'
import { ChangePasswordForm } from '@/components/organisms/change-password-form'

export const metadata = { title: 'Ganti Password — Dasbor' }

export default async function ChangePasswordPage() {
  await requireAuth('/dashboard/keamanan/password')

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Ganti Password</h1>
        <p className="text-muted-foreground mt-1">
          Atur password baru untuk akun Anda. Anda akan diminta untuk masuk kembali setelah ini di perangkat lain.
        </p>
      </header>
      <ChangePasswordForm />
    </div>
  )
}
