import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, BookOpen, Lock, Code2, KeyRound } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { buildOpenApiSpec } from '@/lib/openapi/spec'
import { OpenApiViewer } from '@/components/organisms/openapi-viewer'
import { ApiKeyQuickCreate } from '@/components/organisms/api-key-quick-create'

export const metadata = { title: 'Dokumentasi API — Dasbor' }

export default async function TenantApiDocsPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/api-docs`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
    notFound()
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.pekerja.sainskerta.net'
  const spec = buildOpenApiSpec({ slug: tenant.slug, baseUrl })

  const curlExample = `curl -H "Authorization: Bearer rpi_t_xxxxx..." \\
     "${baseUrl}/api/tenants/${tenant.slug}/audit/export?from=2026-01-01"`

  const nodeExample = `const res = await fetch(
  "${baseUrl}/api/tenants/${tenant.slug}/audit/export",
  {
    headers: { Authorization: \`Bearer \${process.env.RPI_TENANT_KEY}\` },
  },
)
const csv = await res.text()`

  const pythonExample = `import os, requests

r = requests.get(
    "${baseUrl}/api/tenants/${tenant.slug}/audit/export",
    headers={"Authorization": f"Bearer {os.environ['RPI_TENANT_KEY']}"},
    timeout=30,
)
r.raise_for_status()
csv = r.text`

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
          <BookOpen className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Dokumentasi API</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Dokumentasi REST API untuk tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
          Dihasilkan otomatis dari spesifikasi OpenAPI 3.0.
        </p>
      </header>

      {/* Section 1: Otentikasi */}
      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Otentikasi</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Semua endpoint tenant menerima Tenant API Key sebagai{' '}
          <em>Bearer token</em>. Kirim header:
        </p>
        <pre className="bg-background border-border mt-3 overflow-x-auto rounded-md border p-3 text-xs">
          <code>{`Authorization: Bearer rpi_t_<token>`}</code>
        </pre>
        <p className="text-muted-foreground mt-3 text-sm">
          Setiap kunci dibatasi pada tenant penerbit dan memiliki scope (
          <code className="bg-muted rounded px-1">read</code>,{' '}
          <code className="bg-muted rounded px-1">write</code>,{' '}
          <code className="bg-muted rounded px-1">admin</code>). Anda dapat
          membuat dan mencabut kunci di halaman{' '}
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`/dashboard/tenants/${tenant.slug}/api-keys` as any}
            className="text-primary hover:underline"
          >
            API Keys
          </Link>
          .
        </p>
      </section>

      {/* Section 2: Auto-generated OpenAPI doc */}
      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Referensi endpoint</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          Spesifikasi mentah tersedia di{' '}
          <code className="bg-muted rounded px-1">
            GET /api/tenants/{tenant.slug}/openapi.json
          </code>{' '}
          (membutuhkan otentikasi yang sama dengan endpoint lain).
        </p>
        <OpenApiViewer spec={spec} />
      </section>

      {/* Section 3: Contoh penggunaan */}
      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Code2 className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Contoh penggunaan</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          Mengunduh ekspor audit dengan tiga bahasa berbeda. Ganti{' '}
          <code className="bg-muted rounded px-1">rpi_t_xxxxx…</code> dengan
          kunci asli dari halaman API Keys.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-foreground mb-2 text-sm font-medium">curl</h3>
            <pre className="bg-background border-border overflow-x-auto rounded-md border p-3 text-xs">
              <code>{curlExample}</code>
            </pre>
          </div>
          <div>
            <h3 className="text-foreground mb-2 text-sm font-medium">
              Node (fetch)
            </h3>
            <pre className="bg-background border-border overflow-x-auto rounded-md border p-3 text-xs">
              <code>{nodeExample}</code>
            </pre>
          </div>
          <div>
            <h3 className="text-foreground mb-2 text-sm font-medium">
              Python (requests)
            </h3>
            <pre className="bg-background border-border overflow-x-auto rounded-md border p-3 text-xs">
              <code>{pythonExample}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Section 4: Quick-create API key */}
      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Buat kunci cepat</h2>
        </div>
        <ApiKeyQuickCreate tenantSlug={tenant.slug} />
      </section>
    </div>
  )
}
