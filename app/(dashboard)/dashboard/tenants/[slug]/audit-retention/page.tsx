import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, History, ExternalLink } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  AuditRetentionForm,
  DeleteRetentionPolicyButton,
  PreviewImpactButton,
} from '@/components/organisms/audit-retention-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Retensi Audit Tenant — Dasbor' }

export default async function TenantAuditRetentionPage({
  params,
}: {
  params: { slug: string }
}) {
  const t = await getServerT()
  const ar = t.pagesTenant4.auditRetention

  function retentionLabel(days: number): string {
    return days === 0
      ? ar.retentionForever
      : ar.retentionDays.replace('{n}', String(days))
  }

  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/audit-retention`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true, ownerUserId: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  // OWNER-only (owner of this tenant) — plus global override (SUPERADMIN).
  const { globalRole, id: userId } = session.user
  const isOwner = tenant.ownerUserId === userId
  const isSuperAdmin = globalRole === 'SUPERADMIN'
  if (!isOwner && !isSuperAdmin) notFound()

  const [tenantPolicies, globalPolicies] = await Promise.all([
    prisma.auditRetentionPolicy.findMany({
      where: { scope: 'tenant', tenantId: tenant.id },
      orderBy: [{ resourceType: 'asc' }],
    }),
    prisma.auditRetentionPolicy.findMany({
      where: { scope: 'global' },
      orderBy: [{ resourceType: 'asc' }],
    }),
  ])

  const tenantResources = new Set(tenantPolicies.map((p) => p.resourceType))
  const overridingGlobals = globalPolicies.filter((g) =>
    tenantResources.has(g.resourceType) || g.resourceType === '*',
  )

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {ar.backTo.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">{ar.heading}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {ar.description}
        </p>
      </header>

      <div
        role="note"
        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
      >
        {ar.autoCleanNote}
      </div>

      {overridingGlobals.length > 0 && (
        <div
          role="note"
          className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-900 dark:text-blue-200"
        >
          <p className="font-medium">{ar.globalPolicyHeading}</p>
          <p className="mt-1">
            {ar.globalPolicyBody}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {overridingGlobals.map((g) => (
              <li key={g.id} className="font-mono text-xs">
                {g.resourceType} — {retentionLabel(g.retentionDays)}
                {g.archiveEnabled ? ' ' + ar.archiveActive : ''}
              </li>
            ))}
          </ul>
          {isSuperAdmin && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={'/dashboard/audit-retention' as any}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline"
            >
              {ar.globalPolicyLink}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      <section
        aria-label={ar.sectionTenantPolicies}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">
          {ar.tenantPoliciesHeading.replace('{count}', String(tenantPolicies.length))}
        </h2>
        {tenantPolicies.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {ar.emptyTenantPolicies}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{ar.thResourceType}</th>
                  <th className="py-2 pr-3 font-medium">{ar.thRetention}</th>
                  <th className="py-2 pr-3 font-medium">{ar.thArchive}</th>
                  <th className="py-2 font-medium text-right">{ar.thActions}</th>
                </tr>
              </thead>
              <tbody>
                {tenantPolicies.map((p) => (
                  <tr key={p.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs">{p.resourceType}</td>
                    <td className="py-2 pr-3 text-xs">{retentionLabel(p.retentionDays)}</td>
                    <td className="py-2 pr-3 text-xs">
                      {p.archiveEnabled ? ar.archiveYes : ar.archiveNo}
                    </td>
                    <td className="py-2 text-right">
                      <DeleteRetentionPolicyButton id={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-label={ar.sectionAddPolicy}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">{ar.addPolicyHeading}</h2>
        <AuditRetentionForm scope="tenant" tenantId={tenant.id} />
      </section>

      <section
        aria-label={ar.sectionPreview}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-2 text-lg">{ar.previewHeading}</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          {ar.previewDescription}
        </p>
        <PreviewImpactButton tenantId={tenant.id} />
      </section>
    </div>
  )
}
