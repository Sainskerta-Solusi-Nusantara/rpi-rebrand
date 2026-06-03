import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FileSpreadsheet, Download } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantJobsImportForm } from '@/components/organisms/tenant-jobs-import-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Impor Lowongan CSV — Dasbor' }

export default async function TenantJobsImportPage({
  params,
}: {
  params: { slug: string }
}) {
  const t = await getServerT()
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/jobs/import`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.create')) {
    notFound()
  }

  const templateHref = `/api/tenants/${tenant.slug}/jobs/template`

  const REQUIRED_COLUMNS: { name: string; desc: string }[] = [
    { name: 'title', desc: t.pagesTenant2.jobsImport.colTitleDesc },
    { name: 'location', desc: t.pagesTenant2.jobsImport.colLocationDesc },
    { name: 'description', desc: t.pagesTenant2.jobsImport.colDescriptionDesc },
  ]

  const OPTIONAL_COLUMNS: { name: string; desc: string }[] = [
    { name: 'employmentType', desc: t.pagesTenant2.jobsImport.colEmploymentTypeDesc },
    { name: 'experienceLevel', desc: t.pagesTenant2.jobsImport.colExperienceLevelDesc },
    { name: 'locationType', desc: t.pagesTenant2.jobsImport.colLocationTypeDesc },
    { name: 'salaryMin', desc: t.pagesTenant2.jobsImport.colSalaryMinDesc },
    { name: 'salaryMax', desc: t.pagesTenant2.jobsImport.colSalaryMaxDesc },
    { name: 'status', desc: t.pagesTenant2.jobsImport.colStatusDesc },
    { name: 'tags', desc: t.pagesTenant2.jobsImport.colTagsDesc },
    { name: 'responsibilities', desc: t.pagesTenant2.jobsImport.colResponsibilitiesDesc },
    { name: 'requirements', desc: t.pagesTenant2.jobsImport.colRequirementsDesc },
    { name: 'benefits', desc: t.pagesTenant2.jobsImport.colBenefitsDesc },
    { name: 'categorySlug', desc: t.pagesTenant2.jobsImport.colCategorySlugDesc },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/jobs` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant2.jobsImport.backToList}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            {t.pagesTenant2.jobsImport.heading}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.pagesTenant2.jobsImport.subheading}{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card space-y-4 rounded-2xl border p-6">
        <div>
          <h2 className="font-heading text-lg">{t.pagesTenant2.jobsImport.sectionFormatHeading}</h2>
          <p className="text-muted-foreground text-sm">
            {t.pagesTenant2.jobsImport.sectionFormatDesc}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">{t.pagesTenant2.jobsImport.requiredCols}</p>
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
          <p className="text-foreground text-sm font-semibold">{t.pagesTenant2.jobsImport.optionalCols}</p>
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
          <p className="text-foreground text-sm font-semibold">{t.pagesTenant2.jobsImport.exampleRow}</p>
          <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs leading-relaxed">
{`title,location,description,employmentType,experienceLevel,locationType,salaryMin,salaryMax,status,tags
Senior Backend Engineer,Jakarta,"Bangun layanan backend skala besar untuk produk konsumen kami.",FULL_TIME,SENIOR,HYBRID,20000000,35000000,DRAFT,"go,postgres,kubernetes"`}
          </pre>
        </div>

        <div>
          <a
            href={templateHref}
            download
            className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.pagesTenant2.jobsImport.downloadTemplate}
          </a>
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">{t.pagesTenant2.jobsImport.uploadHeading}</h2>
        <TenantJobsImportForm tenantSlug={tenant.slug} />
      </section>
    </div>
  )
}
