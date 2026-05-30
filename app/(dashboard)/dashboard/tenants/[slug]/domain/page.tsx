import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Globe, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { CustomDomainSetupForm } from '@/components/organisms/tenant-domain-form'

export const metadata = { title: 'Domain Kustom — Dasbor' }

export default async function TenantDomainPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/domain`,
  )

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
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Domain kustom</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Tampilkan portal{' '}
          <span className="font-medium text-foreground">{tenant.name}</span> di
          domain pilihan Anda sendiri (mis. <code>karir.contoh.com</code>) untuk
          pengalaman brand yang konsisten.
        </p>
      </header>

      <section
        aria-label="Manfaat domain kustom"
        className="border-border bg-muted/30 rounded-2xl border p-5"
      >
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Mengapa pakai domain sendiri?</h2>
        </div>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          <li>Memperkuat identitas brand di mata kandidat & klien.</li>
          <li>URL ringkas dan mudah diingat untuk kampanye rekrutmen.</li>
          <li>Meningkatkan kepercayaan saat berbagi tautan lowongan.</li>
        </ul>
      </section>

      <section
        aria-label="Pengaturan domain"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Pengaturan domain</h2>
        </div>
        <CustomDomainSetupForm tenantSlug={tenant.slug} initial={initial} />
      </section>

      <section
        aria-label="Cara DNS"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Cara DNS</h2>
        </div>
        <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
          <li>
            Masuk ke pengelola DNS domain Anda (mis. Cloudflare, Niagahoster,
            Domainesia).
          </li>
          <li>
            Buat <strong>TXT record</strong> baru dengan nama{' '}
            <code>_rpi-verify.&lt;domain-anda&gt;</code> dan nilai token yang
            kami terbitkan setelah Anda menyimpan domain.
          </li>
          <li>
            Simpan record. Tunggu propagasi DNS (umumnya 1-30 menit, maksimum
            beberapa jam).
          </li>
          <li>
            Klik <strong>Cek verifikasi</strong> di atas. Jika berhasil, badge{' '}
            <em>Aktif</em> akan muncul.
          </li>
          <li>
            Setelah verifikasi, arahkan juga record A/CNAME domain Anda ke
            endpoint platform sesuai instruksi tim dukungan agar lalu lintas
            HTTPS bisa diarahkan.
          </li>
        </ol>
        <p className="text-muted-foreground mt-3 text-xs">
          Catatan: token verifikasi diawali <code>rpi-verify-</code> agar mudah
          dikenali di antara record DNS lain.
        </p>
      </section>
    </div>
  )
}
