import { getTenantBranding } from '@/lib/branding/server'

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

export const metadata = { title: 'Branding Platform' }

export default async function AdminBrandingPage() {
  // Platform-default branding (no tenant context).
  const branding = await getTenantBranding(undefined).catch(() => null)

  return (
    <div className="p-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">Branding Platform</h1>
        <p className="text-muted-foreground mt-1">
          Atur identitas visual default RPI yang digunakan di domain utama.
        </p>
      </header>

      <BrandingForm initial={branding} action="/api/branding" method="PATCH" scope="platform" />
    </div>
  )
}
