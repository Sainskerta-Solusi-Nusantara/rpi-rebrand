import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Code, BookOpen } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { EmbedWidgetConfig } from '@/components/organisms/embed-widget-config'

export const metadata = { title: 'Embed Widget — Dasbor' }

export default async function TenantEmbedPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/embed`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    notFound()
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL

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
          <Code className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Embed widget</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Tempel papan lowongan{' '}
          <span className="font-medium text-foreground">{tenant.name}</span> di
          situs eksternal Anda. Konfigurasi tampilan, salin snippet, dan pasang
          di halaman tujuan.
        </p>
      </header>

      <section
        aria-label="Cara pakai"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Cara pakai</h2>
        </div>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm">
          <li>
            Atur jumlah lowongan yang ingin ditampilkan dan pilih tema
            (terang/gelap) di bagian{' '}
            <span className="text-foreground font-medium">Konfigurasi</span>.
          </li>
          <li>
            Periksa tampilan akhir pada bagian{' '}
            <span className="text-foreground font-medium">
              Pratinjau langsung
            </span>{' '}
            — ini adalah hasil yang akan dilihat pengunjung situs Anda.
          </li>
          <li>
            Salin salah satu snippet:
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <span className="text-foreground font-medium">Iframe</span> —
                cocok untuk CMS yang membatasi JavaScript (WordPress block,
                Wix, Webflow embed widget).
              </li>
              <li>
                <span className="text-foreground font-medium">Script</span> —
                lebih responsif; iframe menyesuaikan ukuran kontainer dan
                kontennya.
              </li>
            </ul>
          </li>
          <li>
            Tempel snippet di halaman tujuan (misal: halaman &ldquo;Karier&rdquo;
            atau &ldquo;Lowongan&rdquo; di situs perusahaan Anda).
          </li>
          <li>
            Snippet akan otomatis menampilkan lowongan terbaru. Perubahan di
            dasbor RPI tampil langsung tanpa perlu memperbarui snippet.
          </li>
        </ol>
      </section>

      <EmbedWidgetConfig tenantSlug={tenant.slug} baseUrl={baseUrl} />
    </div>
  )
}
