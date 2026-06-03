import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FileSpreadsheet, Download } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantMembersImportForm } from '@/components/organisms/tenant-members-import-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Impor Anggota CSV — Dasbor' }

export default async function TenantMembersImportPage({
  params,
}: {
  params: { slug: string }
}) {
  const t = await getServerT()
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/anggota/import`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')) {
    notFound()
  }

  const templateHref = `/api/tenants/${tenant.slug}/members/template`

  const REQUIRED_COLUMNS: { name: string; desc: string }[] = [
    { name: 'email', desc: t.pagesTenant2.membersImport.colEmailDesc },
    { name: 'role', desc: t.pagesTenant2.membersImport.colRoleDesc },
  ]

  const OPTIONAL_COLUMNS: { name: string; desc: string }[] = [
    { name: 'name', desc: t.pagesTenant2.membersImport.colNameDesc },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant2.membersImport.backToTenant}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            {t.pagesTenant2.membersImport.heading}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.pagesTenant2.membersImport.subheading}{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card space-y-4 rounded-2xl border p-6">
        <div>
          <h2 className="font-heading text-lg">{t.pagesTenant2.membersImport.sectionFormatHeading}</h2>
          <p className="text-muted-foreground text-sm">
            {t.pagesTenant2.membersImport.sectionFormatDesc}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">{t.pagesTenant2.membersImport.requiredCols}</p>
          <ul className="space-y-1 text-sm">
            {REQUIRED_COLUMNS.map((c) => (
              <li key={c.name} className="flex gap-2">
                <code className="bg-muted h-fit rounded px-2 py-0.5 text-xs">
                  {c.name}
                </code>
                <span className="text-muted-foreground">{c.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">{t.pagesTenant2.membersImport.optionalCols}</p>
          <ul className="space-y-1 text-sm">
            {OPTIONAL_COLUMNS.map((c) => (
              <li key={c.name} className="flex gap-2">
                <code className="bg-muted h-fit rounded px-2 py-0.5 text-xs">
                  {c.name}
                </code>
                <span className="text-muted-foreground">{c.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">{t.pagesTenant2.membersImport.exampleRow}</p>
          <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs leading-relaxed">
{`email,role,name
budi@example.com,ADMIN,Budi
sari@example.com,RECRUITER,Sari Wahyuni
agus@example.com,MEMBER,`}
          </pre>
        </div>

        <div>
          <a
            href={templateHref}
            download
            className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.pagesTenant2.membersImport.downloadTemplate}
          </a>
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">{t.pagesTenant2.membersImport.uploadHeading}</h2>
        <TenantMembersImportForm tenantSlug={tenant.slug} />
      </section>
    </div>
  )
}
