import { requireAuth } from '@/lib/auth/session'
import Link from 'next/link'
import { Shield, Clock, Globe, KeyRound, LogIn, LogOut, MailCheck, Download, Trash2, ShieldCheck, Key, Monitor, Bell, Activity } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getRecentAuthEvents, getUserDevices, getUserSecuritySnapshot } from '@/lib/auth/audit-queries'
import { ResendVerificationButton } from '@/components/organisms/resend-verification-button'
import { LinkGoogleButton, UnlinkGoogleForm } from '@/components/organisms/oauth-link-actions'
import { AccountDeleteForm } from '@/components/organisms/account-delete-form'
import { DisableTotpForm, RegenerateRecoveryCodesForm } from '@/components/organisms/totp-manage-forms'
import { EmailChangeForm } from '@/components/organisms/email-change-form'
import { RevokeDeviceButton, SignOutAllDevicesForm } from '@/components/organisms/device-revoke-controls'
import { CalendarConnectCard } from '@/components/organisms/calendar-connect-card'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Keamanan Akun — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function truncate(value: string | null, max = 60): string {
  if (!value) return '—'
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export default async function KeamananPage({
  searchParams,
}: {
  searchParams?: { linked?: string; calendar?: string; reason?: string }
}) {
  const session = await requireAuth('/dashboard/keamanan')
  const userId = session.user.id
  const t = await getServerT()
  const showLinkedBanner = searchParams?.linked === '1'
  const calendarStatus =
    searchParams?.calendar === 'connected'
      ? ({ kind: 'connected' } as const)
      : searchParams?.calendar === 'error'
        ? ({ kind: 'error', reason: searchParams?.reason } as const)
        : undefined

  const [events, snapshot, ownedTenantCount, devices] = await Promise.all([
    getRecentAuthEvents(userId, 10),
    getUserSecuritySnapshot(userId),
    prisma.tenant.count({ where: { ownerUserId: userId } }).catch(() => 0),
    getUserDevices(userId, 8),
  ])

  const lastLoginLabel = snapshot.lastLoginAt
    ? dateFmt.format(snapshot.lastLoginAt)
    : t.dashboard.security.lastLoginEmpty

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.security.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.security.subtitle}
        </p>
      </header>

      <section aria-label={t.dashboard.security.summaryLabel} className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.summaryTitle}</h2>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {t.dashboard.security.lastLogin}
            </dt>
            <dd className="mt-1 text-sm font-medium">{lastLoginLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {t.dashboard.security.password}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {snapshot.passwordSet ? t.dashboard.security.passwordSet : t.dashboard.security.passwordNotSet}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Globe className="h-4 w-4" aria-hidden="true" />
              {t.dashboard.security.google}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {snapshot.googleLinked ? t.dashboard.security.googleLinked : t.dashboard.security.googleNotLinked}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-label={t.dashboard.security.emailVerificationLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.emailVerificationTitle}</h2>
        </div>

        <p className="text-sm">
          <span className="text-muted-foreground">{t.dashboard.security.emailLabel} </span>
          <span className="font-medium">{snapshot.email ?? '—'}</span>
        </p>

        {snapshot.emailVerifiedAt ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
              {t.dashboard.security.verifiedBadge}
            </span>
            <span className="text-muted-foreground">
              {t.dashboard.security.verifiedOn.replace('{date}', dateFmt.format(snapshot.emailVerifiedAt))}
            </span>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.dashboard.security.emailNotVerifiedDesc}
            </p>
            <ResendVerificationButton />
          </div>
        )}

        <div className="border-border mt-6 border-t pt-6">
          <EmailChangeForm hasPassword={snapshot.passwordSet} />
        </div>
      </section>

      <section aria-label={t.dashboard.security.passwordLabel} className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.passwordTitle}</h2>
        </div>
        {!snapshot.passwordSet && (
          <p className="text-muted-foreground mb-4 text-sm">
            {t.dashboard.security.googleOnlyNote}
          </p>
        )}
        <Link
          href="/dashboard/keamanan/password"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          {t.dashboard.security.changePassword}
        </Link>
      </section>

      <section
        aria-label={t.dashboard.security.twoFactorLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.twoFactorTitle}</h2>
        </div>

        {snapshot.totpEnabledAt ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                {t.dashboard.security.twoFactorEnabled}
              </span>
              <span className="text-muted-foreground text-xs">
                {t.dashboard.security.twoFactorSince.replace('{date}', dateFmt.format(snapshot.totpEnabledAt))}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {t.dashboard.security.recoveryCodesRemaining} <span className="text-foreground font-medium">{snapshot.recoveryCodeCount}</span>
              {snapshot.recoveryCodeCount <= 2 && snapshot.recoveryCodeCount > 0 && (
                <span className="text-amber-700 dark:text-amber-200 ml-2">
                  {t.dashboard.security.recoveryCodesLow}
                </span>
              )}
              {snapshot.recoveryCodeCount === 0 && (
                <span className="text-destructive ml-2">
                  {t.dashboard.security.recoveryCodesEmpty}
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <DisableTotpForm />
              <RegenerateRecoveryCodesForm />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {snapshot.passwordSet
                ? t.dashboard.security.enable2faDesc
                : t.dashboard.security.enable2faNeedsPassword}
            </p>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/keamanan/2fa' as any}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
            >
              {t.dashboard.security.enable2faCta}
            </Link>
          </div>
        )}
      </section>

      <section
        aria-label={t.dashboard.security.oauthLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.oauthTitle}</h2>
        </div>

        {showLinkedBanner && (
          <p
            role="status"
            className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          >
            {t.dashboard.security.googleLinkedSuccess}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">{t.dashboard.security.google}</div>
            <div className="text-muted-foreground text-xs">
              {snapshot.googleLinked
                ? t.dashboard.security.googleCanLogin
                : t.dashboard.security.googleConnectPrompt}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={
                snapshot.googleLinked
                  ? 'inline-flex items-center rounded-full bg-green-100 dark:bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300'
                  : 'bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
              }
            >
              {snapshot.googleLinked ? t.dashboard.security.googleConnectedBadge : t.dashboard.security.googleNotConnectedBadge}
            </span>
            {snapshot.googleLinked ? (
              <UnlinkGoogleForm passwordSet={snapshot.passwordSet} />
            ) : (
              <LinkGoogleButton />
            )}
          </div>
        </div>
      </section>

      <section
        aria-label={t.dashboard.security.lastLoginLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.lastLoginSectionTitle}</h2>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">{t.dashboard.security.time} </span>
          <span className="font-medium">{lastLoginLabel}</span>
        </p>
      </section>

      <section
        aria-label={t.dashboard.security.devicesLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.devicesTitle}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.dashboard.security.devicesDesc}
        </p>
        {devices.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.dashboard.security.devicesEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.deviceHeaders.device}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.deviceHeaders.ip}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.deviceHeaders.first}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.deviceHeaders.last}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.deviceHeaders.loginCount}</th>
                  <th className="py-2 font-medium text-right">{t.dashboard.security.deviceHeaders.actions}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="border-border/60 border-b last:border-b-0">
                    <td className="text-muted-foreground max-w-[18rem] py-2 pr-3 text-xs">
                      <span title={d.userAgent}>{truncate(d.userAgent)}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{d.ipLastSeen ?? '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(d.firstSeenAt)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(d.lastSeenAt)}
                    </td>
                    <td className="py-2 pr-3 text-xs">{d.loginCount}</td>
                    <td className="py-2 text-right">
                      <RevokeDeviceButton
                        deviceId={d.id}
                        deviceLabel={truncate(d.userAgent, 40)}
                        alreadyRevoked={!!d.revokedAt}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-border mt-6 border-t pt-6">
          <SignOutAllDevicesForm hasPassword={snapshot.passwordSet} />
          <p className="text-muted-foreground mt-2 text-xs">
            {t.dashboard.security.signOutAllNote}
          </p>
        </div>
      </section>

      <section
        aria-label={t.dashboard.security.activityLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">{t.dashboard.security.activityTitle}</h2>
          </div>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/aktivitas' as any}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {t.dashboard.security.activityViewAll}
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.dashboard.security.activityEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.activityHeaders.action}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.activityHeaders.time}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.security.activityHeaders.ip}</th>
                  <th className="py-2 font-medium">{t.dashboard.security.activityHeaders.ua}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const isLogin = e.action === 'LOGIN'
                  const fullUa = e.userAgent ?? ''
                  return (
                    <tr key={e.id} className="border-border/60 border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        <span
                          className={
                            isLogin
                              ? 'inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300'
                              : 'bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
                          }
                        >
                          {isLogin ? (
                            <LogIn className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <LogOut className="h-3 w-3" aria-hidden="true" />
                          )}
                          {e.action}
                        </span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {dateFmt.format(e.createdAt)}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{e.ip ?? '—'}</td>
                      <td className="text-muted-foreground max-w-[18rem] py-2 text-xs">
                        <span title={fullUa || undefined}>{truncate(e.userAgent)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-label={t.dashboard.security.notifPrefsLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.notifPrefsTitle}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.dashboard.security.notifPrefsDesc}
        </p>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/notifikasi' as any}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          {t.dashboard.security.notifPrefsCta}
        </Link>
      </section>

      <section
        aria-label={t.dashboard.security.apiTokensLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.apiTokensTitle}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.dashboard.security.apiTokensDesc}
        </p>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/keamanan/api-tokens' as any}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
        >
          {t.dashboard.security.apiTokensCta}
        </Link>
      </section>

      <section
        aria-label={t.dashboard.security.dataLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.dashboard.security.dataTitle}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.dashboard.security.dataDesc}
        </p>
        <a
          href="/api/me/export"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.security.dataCta}
        </a>
      </section>

      <CalendarConnectCard status={calendarStatus} />

      <section
        aria-label={t.dashboard.security.deleteLabel}
        className="border-destructive/30 bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="text-destructive h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-destructive text-lg">{t.dashboard.security.deleteTitle}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.dashboard.security.deleteDesc}
        </p>
        <AccountDeleteForm
          hasPassword={snapshot.passwordSet}
          ownedTenantCount={ownedTenantCount}
        />
      </section>
    </div>
  )
}
