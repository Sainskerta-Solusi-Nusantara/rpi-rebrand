import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FileSpreadsheet, Download } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantCoursesImportForm } from '@/components/organisms/tenant-courses-import-form'

export const metadata = { title: 'Impor Kursus CSV — Dasbor' }

const REQUIRED_COLUMNS: { name: string; desc: string }[] = [
  { name: 'title', desc: 'Judul kursus (5–200 karakter).' },
  {
    name: 'description',
    desc: 'Deskripsi lengkap kursus (minimal 50 karakter).',
  },
]

const OPTIONAL_COLUMNS: { name: string; desc: string }[] = [
  {
    name: 'level',
    desc: 'BEGINNER | INTERMEDIATE | ADVANCED. Default BEGINNER.',
  },
  {
    name: 'durationHours',
    desc: 'Durasi total dalam jam (bilangan bulat 1–1000). Default 8.',
  },
  {
    name: 'instructorEmail',
    desc: 'Email instruktur. Pengguna harus menjadi anggota aktif tenant ini; jika tidak, baris dilewati.',
  },
  {
    name: 'thumbnail',
    desc: 'URL gambar sampul kursus (opsional).',
  },
  {
    name: 'status',
    desc: 'DRAFT | PUBLISHED | ARCHIVED. Default DRAFT.',
  },
]

export default async function TenantCoursesImportPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/kursus/import`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'course.create')) {
    notFound()
  }

  const templateHref = `/api/tenants/${tenant.slug}/kursus/template`

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/kursus` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar kursus
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">
            Impor kursus dari CSV
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Unggah hingga 100 baris kursus sekaligus untuk tenant{' '}
          <span className="font-medium text-foreground">{tenant.name}</span>.
        </p>
      </header>

      <section className="border-border bg-card space-y-4 rounded-2xl border p-6">
        <div>
          <h2 className="font-heading text-lg">Format CSV</h2>
          <p className="text-muted-foreground text-sm">
            Baris pertama harus berisi nama kolom. Nama kolom tidak dibedakan
            huruf besar/kecil.
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
{`title,description,level,durationHours,instructorEmail,status
Pengantar React,"Pelajari dasar-dasar React dari nol — komponen, state, props, dan hooks dengan studi kasus nyata. Kursus ini cocok untuk pemula yang ingin masuk ke ekosistem front-end modern.",BEGINNER,12,instructor@example.com,DRAFT`}
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
        <TenantCoursesImportForm tenantSlug={tenant.slug} />
      </section>
    </div>
  )
}
