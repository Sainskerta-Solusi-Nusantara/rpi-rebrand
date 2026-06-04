import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { TotpSetupWizard } from '@/components/organisms/totp-setup-wizard'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: '2FA — Setup' }

export default async function Setup2faPage() {
  const session = await requireAuth('/dashboard/keamanan/2fa')
  const t = await getServerT()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabledAt: true, passwordHash: true },
  })

  if (!user) redirect('/dashboard/keamanan')

  if (!user.passwordHash) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <Link
          href="/dashboard/keamanan"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.security.twoFactorPage.backLink}
        </Link>
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.security.twoFactorPage.title}</h1>
        <p className="rounded-md border border-amber-300 dark:border-amber-500/30/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {t.dashboard.security.twoFactorPage.needsPasswordNote}
        </p>
        <Link
          href="/dashboard/keamanan/password"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          {t.dashboard.security.twoFactorPage.setPasswordCta}
        </Link>
      </div>
    )
  }

  if (user.totpEnabledAt) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <Link
          href="/dashboard/keamanan"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.security.twoFactorPage.backLink}
        </Link>
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.security.twoFactorPage.title}</h1>
        <div className="border-border bg-card flex items-center gap-3 rounded-2xl border p-6">
          <ShieldCheck className="h-6 w-6 text-success" aria-hidden="true" />
          <div>
            <p className="font-medium">{t.dashboard.security.twoFactorPage.alreadyEnabledTitle}</p>
            <p className="text-muted-foreground text-sm">
              {t.dashboard.security.twoFactorPage.alreadyEnabledDesc}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Link
        href="/dashboard/keamanan"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t.dashboard.security.twoFactorPage.backLink}
      </Link>
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.security.twoFactorPage.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.security.twoFactorPage.subtitle}
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <TotpSetupWizard />
      </section>
    </div>
  )
}
