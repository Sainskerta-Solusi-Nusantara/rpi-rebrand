import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Flag } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { FeatureFlagForm } from '@/components/organisms/feature-flag-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Buat Feature Flag — Dasbor' }

export default async function NewFeatureFlagPage() {
  const session = await requireAuth('/dashboard/feature-flags/new')
  if (session.user.globalRole !== 'SUPERADMIN') {
    notFound()
  }
  const t = await getServerT()

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/feature-flags' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.featureFlags.backToList}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Flag className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.featureFlags.newTitle}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.featureFlags.newSubtitle}
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <FeatureFlagForm mode="create" />
      </section>
    </div>
  )
}
