import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { getTenantBranding } from '@/lib/branding/server'
import { ThemeProvider } from '@/lib/branding/theme-provider'
// TODO(agents): PublicLayout template — wires PublicHeader + PublicFooter.
// Fallback below until the template is exported.
let PublicLayout: React.ComponentType<{ children: React.ReactNode; tenant?: unknown }> = ({
  children,
}) => <div className="min-h-screen flex flex-col">{children}</div>
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/components/templates/public-layout')
  if (mod?.PublicLayout) PublicLayout = mod.PublicLayout
} catch {
  /* template not yet available */
}

export default async function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = headers()
  const slug = h.get('x-tenant-slug') ?? undefined

  // Resolve the tenant (if any) and its branding for theme.
  const tenant = slug
    ? await prisma.tenant
        .findUnique({
          where: { slug },
          select: { id: true, slug: true, name: true, status: true },
        })
        .catch(() => null)
    : null

  const branding = await getTenantBranding(slug).catch(() => null)

  return (
    <ThemeProvider initial={branding ?? undefined}>
      <PublicLayout tenant={tenant ?? undefined}>{children}</PublicLayout>
    </ThemeProvider>
  )
}
