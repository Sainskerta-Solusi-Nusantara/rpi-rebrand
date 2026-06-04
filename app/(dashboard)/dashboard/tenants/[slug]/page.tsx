import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Building2, UserPlus, Mail, Crown, LogOut, Palette, Webhook, Key, Activity, Globe, CreditCard, Briefcase, FileText, BarChart3, GraduationCap, MailQuestion, Users, Code, HelpCircle, TrendingUp, Archive, FileSpreadsheet, History, ShieldCheck, Rss } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission, canAccessTenant } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantInviteForm, RevokeInviteButton } from '@/components/organisms/tenant-invite-form'
import {
  LeaveTenantButton,
  MemberRowActions,
  TransferOwnershipForm,
} from '@/components/organisms/tenant-member-actions'
import { FeedUrlBlock } from '@/components/organisms/feed-url-block'
import { getServerT } from '@/lib/i18n/server-dictionary'

const PUBLIC_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://rumahpekerja.id').replace(
  /\/+$/,
  '',
)

export const metadata = { title: 'Kelola Tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateShort = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

export default async function ManageTenantPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}`)
  const t = await getServerT()

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        planTier: true,
        createdAt: true,
        ownerUserId: true,
      },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!canAccessTenant(globalRole, tenants, tenant.id)) {
    notFound()
  }

  const canInvite = hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')
  const canUpdateMember = hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')
  const canRemoveMember = hasTenantPermission(globalRole, tenants, tenant.id, 'team.remove')
  const canEditBranding = hasTenantPermission(globalRole, tenants, tenant.id, 'branding.update')
  const canManageIntegrations = hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')
  const canViewAudit = hasTenantPermission(globalRole, tenants, tenant.id, 'audit.view')
  const canEditDomain = hasTenantPermission(globalRole, tenants, tenant.id, 'tenant.update')
  const canViewBilling = hasTenantPermission(globalRole, tenants, tenant.id, 'billing.view')
  const canManageJobs = hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')
  const canManageCourses = hasTenantPermission(globalRole, tenants, tenant.id, 'course.view')
  const isOwner = tenant.ownerUserId === session.user.id

  const statusLabels: Record<string, { label: string; tone: string }> = {
    ACTIVE: { label: t.pagesTenant1.tenantsList.statusActive, tone: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' },
    SUSPENDED: { label: t.pagesTenant1.tenantsList.statusSuspended, tone: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' },
    PROVISIONING: { label: t.pagesTenant1.tenantsList.statusProvisioning, tone: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200' },
  }

  const [members, invitations] = await Promise.all([
    prisma.userTenant.findMany({
      where: { tenantId: tenant.id },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        role: true,
        status: true,
        joinedAt: true,
        user: { select: { id: true, email: true, name: true, image: true } },
      },
    }),
    canInvite
      ? prisma.invitation.findMany({
          where: { tenantId: tenant.id, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
        })
      : Promise.resolve([]),
  ])

  const statusInfo =
    statusLabels[tenant.status] ?? {
      label: tenant.status,
      tone: 'bg-muted text-muted-foreground',
    }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <Link
          href="/dashboard/tenants"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant1.tenantHome.backLink}
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl">{tenant.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.tone}`}
          >
            {statusInfo.label}
          </span>
          <span className="border-border inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
            {tenant.planTier}
          </span>
        </div>
      </header>

      {(canEditBranding || canManageIntegrations || canViewAudit || canEditDomain || canViewBilling || canManageJobs || canManageCourses || isOwner) && (
        <nav className="flex flex-wrap gap-2">
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/jobs` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navJobs}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/lamaran` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navApplications}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/analytics` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navAnalytics}
            </Link>
          )}
          {canManageCourses && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/kursus` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navCourses}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'#job-feed' as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Rss className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navFeedXml}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/email-templates` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <MailQuestion className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navEmailTemplates}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/talent-pool` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navTalentPool}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/embed` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Code className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navEmbedWidget}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/interview-questions` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navInterviewQuestions}
            </Link>
          )}
          {canManageJobs && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/benchmarks` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navBenchmarks}
            </Link>
          )}
          {isOwner && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/data-export` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Archive className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navDataExport}
            </Link>
          )}
          {canEditBranding && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/branding` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Palette className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navBranding}
            </Link>
          )}
          {isOwner && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/keamanan` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navSecurity}
            </Link>
          )}
          {canManageIntegrations && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/webhooks` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Webhook className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navWebhooks}
            </Link>
          )}
          {canManageIntegrations && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/api-keys` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Key className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navApiKeys}
            </Link>
          )}
          {canViewAudit && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/audit` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navAuditLog}
            </Link>
          )}
          {isOwner && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/audit-retention` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navAuditRetention}
            </Link>
          )}
          {canEditDomain && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/domain` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navDomain}
            </Link>
          )}
          {canViewBilling && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/billing` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.navBilling}
            </Link>
          )}
        </nav>
      )}

      {canManageJobs && (
        <section
          id="job-feed"
          aria-label="Feed XML lowongan"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">{t.pagesTenant1.tenantHome.feedXmlHeading}</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {t.pagesTenant1.tenantHome.feedXmlDesc.replace('{name}', tenant.name)}
          </p>
          <div className="space-y-3">
            <FeedUrlBlock
              label="Generic Atom 1.0"
              description="Format RSS / Atom standar untuk feed reader umum."
              url={`${PUBLIC_BASE_URL}/jobs/feed.xml?format=atom&tenant=${tenant.slug}`}
            />
            <FeedUrlBlock
              label="LinkedIn Jobs XML"
              description="Format khusus LinkedIn Talent Hub Limited Listings."
              url={`${PUBLIC_BASE_URL}/jobs/feed.xml?format=linkedin&tenant=${tenant.slug}`}
            />
            <FeedUrlBlock
              label="Indeed XML"
              description="Format XML standar Indeed (jobtype, salary, referencenumber)."
              url={`${PUBLIC_BASE_URL}/jobs/feed.xml?format=indeed&tenant=${tenant.slug}`}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {t.pagesTenant1.tenantHome.feedXmlDocsPre}{' '}
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/jobs/feed-info' as any}
              className="underline"
            >
              {t.pagesTenant1.tenantHome.feedXmlDocsLink}
            </Link>{' '}
            {t.pagesTenant1.tenantHome.feedXmlDocsPost}
          </p>
        </section>
      )}

      <section
        aria-label="Anggota"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg">
            {t.pagesTenant1.tenantHome.membersHeading.replace('{n}', String(members.length))}
          </h2>
        </div>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.pagesTenant1.tenantHome.membersEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableUser}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableStatus}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableJoined}</th>
                  <th className="py-2 font-medium text-right">{t.pagesTenant1.tenantHome.tableRoleAction}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const memberIsOwner = m.role === 'OWNER'
                  const memberIsSelf = m.user.id === session.user.id
                  return (
                    <tr key={m.id} className="border-border/60 border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          {m.user.image ? (
                            <Image
                              src={m.user.image}
                              alt=""
                              className="size-8 rounded-full object-cover"
                              width={32}
                              height={32}
                              unoptimized
                            />
                          ) : (
                            <div className="bg-muted size-8 rounded-full" />
                          )}
                          <div>
                            <div className="font-medium">
                              {m.user.name ?? m.user.email}
                              {memberIsSelf && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                  {t.pagesTenant1.tenantHome.selfLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {m.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-xs">{m.status}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">
                        {dateShort.format(m.joinedAt)}
                      </td>
                      <td className="py-2 text-right">
                        {canUpdateMember || canRemoveMember ? (
                          <MemberRowActions
                            tenantSlug={tenant.slug}
                            userId={m.user.id}
                            currentRole={m.role}
                            isOwner={memberIsOwner}
                            isSelf={memberIsSelf}
                            canUpdate={canUpdateMember}
                            canRemove={canRemoveMember}
                          />
                        ) : (
                          <span className="text-sm">
                            {m.role}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canInvite && (
        <section
          aria-label="Undang anggota"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-heading text-lg">{t.pagesTenant1.tenantHome.inviteHeading}</h2>
            </div>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/dashboard/tenants/${tenant.slug}/anggota/import` as any}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              {t.pagesTenant1.tenantHome.importCsv}
            </Link>
          </div>
          <TenantInviteForm tenantSlug={tenant.slug} />
        </section>
      )}

      {canInvite && invitations.length > 0 && (
        <section
          aria-label="Undangan tertunda"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">
              {t.pagesTenant1.tenantHome.pendingInvitesHeading.replace('{n}', String(invitations.length))}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableEmail}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableRole}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableSent}</th>
                  <th className="py-2 pr-3 font-medium">{t.pagesTenant1.tenantHome.tableValidUntil}</th>
                  <th className="py-2 font-medium text-right">{t.pagesTenant1.tenantHome.tableAction}</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 font-medium">{inv.email}</td>
                    <td className="py-2 pr-3">{inv.role}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(inv.createdAt)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(inv.expiresAt)}
                    </td>
                    <td className="py-2 text-right">
                      <RevokeInviteButton invitationId={inv.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isOwner && (
        <section
          aria-label="Transfer kepemilikan"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">{t.pagesTenant1.tenantHome.transferHeading}</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            {t.pagesTenant1.tenantHome.transferDesc}
          </p>
          <TransferOwnershipForm
            tenantSlug={tenant.slug}
            candidates={members
              .filter((m) => m.user.id !== session.user.id && m.role !== 'OWNER' && m.status === 'active')
              .map((m) => ({
                userId: m.user.id,
                label: `${m.user.name ?? m.user.email} · ${m.user.email}`,
              }))}
          />
        </section>
      )}

      <section
        aria-label="Keluar dari tenant"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.pagesTenant1.tenantHome.leaveHeading}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.pagesTenant1.tenantHome.leaveDesc}
        </p>
        <LeaveTenantButton
          tenantSlug={tenant.slug}
          disabled={isOwner}
          disabledReason={
            isOwner
              ? t.pagesTenant1.tenantHome.leaveOwnerReason
              : undefined
          }
        />
      </section>
    </div>
  )
}
