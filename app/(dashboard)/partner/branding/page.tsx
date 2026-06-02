import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/branding/server'
import { getServerT } from '@/lib/i18n/server-dictionary'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-96 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BrandingForm: any = safeRequire('@/components/organisms/branding-form', 'BrandingForm')

export const metadata = { title: 'Branding' }

async function resolveTenantSlug(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) return hSlug
  const ut = await prisma.userTenant
    .findFirst({
      where: { userId },
      select: { tenant: { select: { slug: true } } },
    })
    .catch(() => null)
  return ut?.tenant?.slug ?? null
}

export default async function PartnerBrandingPage() {
  const t = await getServerT()
  const session = await getServerSession(authOptions)
  const slug = await resolveTenantSlug(session!.user.id)
  const branding = slug ? await getTenantBranding(slug).catch(() => null) : null

  return (
    <div className="p-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">{t.partner.branding.title}</h1>
        <p className="text-muted-foreground mt-1">{t.partner.branding.subtitle}</p>
      </header>

      <BrandingForm initial={branding} action="/api/branding" method="PATCH" />
    </div>
  )
}
