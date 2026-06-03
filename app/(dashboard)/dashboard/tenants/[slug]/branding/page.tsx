import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Palette, Image as ImageIcon } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantBrandingForm } from '@/components/organisms/tenant-branding-form'
import { TenantLogoUploader } from '@/components/organisms/tenant-logo-uploader'

export const metadata = { title: 'Branding Tenant — Dasbor' }

const DEFAULTS = {
  primaryColor: '#0a2540',
  secondaryColor: '#c9a961',
  accentColor: '#635bff',
  backgroundColor: '#ffffff',
  foregroundColor: '#0a2540',
  ringColor: '#c9a961',
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  radius: 12,
  density: 'normal',
}

export default async function BrandingPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/branding`)

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        branding: {
          select: {
            logoLight: true,
            logoDark: true,
            favicon: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
            backgroundColor: true,
            foregroundColor: true,
            ringColor: true,
            fontHeading: true,
            fontBody: true,
            radius: true,
            density: true,
          },
        },
      },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'branding.update')) {
    notFound()
  }

  const b = tenant.branding
  const initial = {
    primaryColor: b?.primaryColor ?? DEFAULTS.primaryColor,
    secondaryColor: b?.secondaryColor ?? DEFAULTS.secondaryColor,
    accentColor: b?.accentColor ?? DEFAULTS.accentColor,
    backgroundColor: b?.backgroundColor ?? DEFAULTS.backgroundColor,
    foregroundColor: b?.foregroundColor ?? DEFAULTS.foregroundColor,
    ringColor: b?.ringColor ?? DEFAULTS.ringColor,
    fontHeading: b?.fontHeading ?? DEFAULTS.fontHeading,
    fontBody: b?.fontBody ?? DEFAULTS.fontBody,
    radius: b?.radius ?? DEFAULTS.radius,
    density: b?.density ?? DEFAULTS.density,
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
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
          <Palette className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Branding</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Sesuaikan tampilan tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>:
          logo, warna, tipografi, dan layout.
        </p>
      </header>

      <section
        aria-label="Logo & favicon"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Logo & favicon</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <TenantLogoUploader
            tenantSlug={tenant.slug}
            slot="light"
            label="Logo (light)"
            helpText="Tampil di latar terang. SVG/PNG transparan, maks 2 MB."
            initialUrl={b?.logoLight ?? null}
            previewBg="bg-white"
          />
          <TenantLogoUploader
            tenantSlug={tenant.slug}
            slot="dark"
            label="Logo (dark)"
            helpText="Tampil di latar gelap. SVG/PNG transparan, maks 2 MB."
            initialUrl={b?.logoDark ?? null}
            previewBg="bg-primary"
          />
          <TenantLogoUploader
            tenantSlug={tenant.slug}
            slot="favicon"
            label="Favicon"
            helpText="Ikon tab browser. Bujur sangkar 32×32 atau 64×64."
            initialUrl={b?.favicon ?? null}
            previewBg="bg-white"
          />
        </div>
      </section>

      <section
        aria-label="Tema & warna"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Tema & warna</h2>
        </div>
        <TenantBrandingForm tenantSlug={tenant.slug} initial={initial} />
      </section>
    </div>
  )
}
