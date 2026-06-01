import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FileSpreadsheet, Download } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantMembersImportForm } from '@/components/organisms/tenant-members-import-form'

export const metadata = { title: 'Impor Anggota CSV — Dasbor' }

const REQUIRED_COLUMNS: { name: string; desc: string }[] = [
  { name: 'email', desc: 'Email anggota yang akan diundang. Akan dinormalisasi ke huruf kecil.' },
  {
    name: 'role',
    desc: 'Peran di tenant: ADMIN | RECRUITER | MEMBER. Tidak case-sensitive.',
  },
]

const OPTIONAL_COLUMNS: { name: string; desc: string }[] = [
  {
    name: 'name',
    desc: 'Nama tampilan (hanya untuk preview; tidak ikut ke undangan).',
  },
]

export default async function TenantMembersImportPage({
  params,
}: {
  params: { slug: string }
}) {
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

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke tenant
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            Impor anggota dari CSV
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Kirim hingga 50 undangan anggota sekaligus untuk tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card space-y-4 rounded-2xl border p-6">
        <div>
          <h2 className="font-heading text-lg">Format CSV</h2>
          <p className="text-muted-foreground text-sm">
            Baris pertama harus berisi nama kolom. Nama kolom tidak dibedakan
            huruf besar/kecil. Email duplikat di dalam CSV akan diproses sekali
            (baris pertama menang). Email yang sudah menjadi anggota tenant atau
            sudah punya undangan aktif akan dilewati.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">Kolom wajib</p>
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
          <p className="text-foreground text-sm font-semibold">Kolom opsional</p>
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
          <p className="text-foreground text-sm font-semibold">Contoh baris</p>
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
            Unduh template CSV
          </a>
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">Unggah file</h2>
        <TenantMembersImportForm tenantSlug={tenant.slug} />
      </section>
    </div>
  )
}
