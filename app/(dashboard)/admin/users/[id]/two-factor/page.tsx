import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ShieldCheck, ShieldX, KeyRound } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getUserTwoFactorAdminSnapshot } from '@/lib/tenants/tenant-2fa-queries'
import { AdminReset2faForm } from '@/components/organisms/admin-reset-2fa-form'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatDate } from '@/lib/i18n/format'

export const metadata = { title: 'Reset 2FA Pengguna — Admin' }

export default async function AdminResetTwoFactorPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(`/admin/users/${params.id}/two-factor`)
  if (session.user.globalRole !== 'SUPERADMIN') {
    // Hide existence from non-SUPERADMIN; layout already gates to ADMIN+.
    notFound()
  }

  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const tf = t.admin.userTwoFactor
  const dateFmt = {
    format: (d: Date) =>
      formatDate(d, locale, { dateStyle: 'medium', timeStyle: 'short' }),
  }

  const snapshot = await getUserTwoFactorAdminSnapshot(params.id)
  if (!snapshot) notFound()

  const enabled = Boolean(snapshot.totpEnabledAt)

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          href={`/admin/users/${snapshot.id}` as never}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {tf.back}
        </Link>
      </div>

      <header className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{tf.title}</h1>
          <p className="text-muted-foreground text-sm">
            {snapshot.name ?? snapshot.email} · {snapshot.email}
          </p>
        </div>
      </header>

      <section
        aria-label="Status 2FA saat ini"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{tf.statusHeading}</h2>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs uppercase">{tf.twoFactor}</dt>
            <dd className="mt-1 text-sm font-medium">
              {enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  {tf.active}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                  <ShieldX className="h-3 w-3" aria-hidden="true" />
                  {tf.inactive}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase">{tf.activeSince}</dt>
            <dd className="mt-1 text-sm font-medium">
              {snapshot.totpEnabledAt ? dateFmt.format(snapshot.totpEnabledAt) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase">
              {tf.recoveryRemaining}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {snapshot.recoveryCodeCount}
              {snapshot.recoveryCodeUsed > 0 && (
                <span className="text-muted-foreground ml-1 text-xs">
                  {tf.recoveryUsed.replace('{n}', String(snapshot.recoveryCodeUsed))}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Reset 2FA darurat"
        className="border-destructive/30 bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldX className="text-destructive h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-destructive text-lg">
            {tf.emergencyHeading}
          </h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {tf.emergencyDescBefore}
          <code>user.totp.admin_reset</code>
          {tf.emergencyDescAfter}
        </p>

        <AdminReset2faForm
          userId={snapshot.id}
          userEmail={snapshot.email}
          totpEnabled={enabled}
        />
      </section>
    </div>
  )
}
