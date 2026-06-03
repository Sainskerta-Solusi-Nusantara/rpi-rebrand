import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Globe, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { CustomDomainSetupForm } from '@/components/organisms/tenant-domain-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Domain Kustom — Dasbor' }

export default async function TenantDomainPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/domain`,
  )
  const t = await getServerT()

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        customDomain: true,
        domainVerificationToken: true,
        domainVerifiedAt: true,
      },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'tenant.update')) {
    notFound()
  }

  const recordName = tenant.customDomain
    ? `_rpi-verify.${tenant.customDomain}`
    : null

  const initial = {
    customDomain: tenant.customDomain,
    hasToken: Boolean(tenant.domainVerificationToken),
    verifiedAt: tenant.domainVerifiedAt,
    recordName,
    tokenPreview: tenant.domainVerificationToken,
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant1.domain.backLink.replace('{name}', tenant.name)}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">{t.pagesTenant1.domain.heading}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.pagesTenant1.domain.subheading
            .replace('{name}', tenant.name)
            .replace('{example}', 'karir.contoh.com')}
        </p>
      </header>

      <section
        aria-label="Manfaat domain kustom"
        className="border-border bg-muted/30 rounded-2xl border p-5"
      >
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold">{t.pagesTenant1.domain.whyHeading}</h2>
        </div>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          <li>{t.pagesTenant1.domain.whyBullet1}</li>
          <li>{t.pagesTenant1.domain.whyBullet2}</li>
          <li>{t.pagesTenant1.domain.whyBullet3}</li>
        </ul>
      </section>

      <section
        aria-label="Pengaturan domain"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.pagesTenant1.domain.settingsHeading}</h2>
        </div>
        <CustomDomainSetupForm tenantSlug={tenant.slug} initial={initial} />
      </section>

      <section
        aria-label="Cara DNS"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{t.pagesTenant1.domain.dnsHeading}</h2>
        </div>
        <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
          <li>{t.pagesTenant1.domain.dnsStep1}</li>
          <li>
            {t.pagesTenant1.domain.dnsStep2Pre}{' '}
            <strong>TXT record</strong>{' '}
            {t.pagesTenant1.domain.dnsStep2Mid}{' '}
            <code>_rpi-verify.&lt;domain-anda&gt;</code>{' '}
            {t.pagesTenant1.domain.dnsStep2Post}
          </li>
          <li>{t.pagesTenant1.domain.dnsStep3}</li>
          <li>
            {t.pagesTenant1.domain.dnsStep4Pre}{' '}
            <strong>Cek verifikasi</strong>{' '}
            {t.pagesTenant1.domain.dnsStep4Mid}{' '}
            <em>Aktif</em>{' '}
            {t.pagesTenant1.domain.dnsStep4Post}
          </li>
          <li>{t.pagesTenant1.domain.dnsStep5}</li>
        </ol>
        <p className="text-muted-foreground mt-3 text-xs">
          {t.pagesTenant1.domain.dnsNote.replace('{prefix}', 'rpi-verify-')}
        </p>
      </section>
    </div>
  )
}
