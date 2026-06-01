import { requireAuth } from '@/lib/auth/session'
import { ChangePasswordForm } from '@/components/organisms/change-password-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Ganti Password — Dasbor' }

export default async function ChangePasswordPage() {
  await requireAuth('/dashboard/keamanan/password')
  const t = await getServerT()

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.security.changePasswordPage.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.security.changePasswordPage.subtitle}
        </p>
      </header>
      <ChangePasswordForm />
    </div>
  )
}
