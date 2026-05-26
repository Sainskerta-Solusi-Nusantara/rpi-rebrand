import type { Metadata } from 'next'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { tenantMeta } from '@/lib/tenant-meta'

export const metadata: Metadata = {
  title: 'Mitra Perekrut',
  description:
    'Bergabung dengan ratusan mitra perekrut terverifikasi yang memanfaatkan platform Rumah Pekerja Indonesia.',
}

type Partner = {
  id: string
  slug: string
  name: string
  primaryColor: string
  jobsCount: number
  industry: string
}

const getPartners = cache(async (): Promise<Partner[]> => {
  const rows = await prisma.tenant
    .findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ planTier: 'desc' }, { createdAt: 'desc' }],
      include: {
        branding: { select: { primaryColor: true } },
        _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
      },
    })
    .catch(() => [])

  return rows.map((t) => {
    const meta = tenantMeta(t.slug)
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      primaryColor: t.branding?.primaryColor ?? meta.fallbackColor,
      jobsCount: t._count.jobs,
      industry: meta.industry,
    }
  })
})

const getGlobalStats = cache(async () => {
  const [activeTenants, publishedJobs] = await Promise.all([
    prisma.tenant.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.job.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
  ])
  return { activeTenants, publishedJobs }
})

export default async function MitraPage() {
  const [partners, stats] = await Promise.all([getPartners(), getGlobalStats()])
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="font-heading text-3xl md:text-5xl">Mitra Perekrut Kami</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {stats.activeTenants.toLocaleString('id-ID')} perusahaan mempercayakan
          rekrutmen mereka kepada Rumah Pekerja Indonesia, dengan{' '}
          {stats.publishedJobs.toLocaleString('id-ID')} lowongan aktif.
        </p>
      </header>

      {partners.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-12 text-center">
          <p className="text-foreground/85">Belum ada mitra terdaftar.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Jadilah yang pertama bergabung di platform ini.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {partners.map((p) => (
            <li
              key={p.id}
              className="border-border bg-card rounded-xl border p-6 text-center hover:shadow-md transition"
            >
              <a href={`https://${p.slug}.${rootDomain}`}>
                <div
                  className="mx-auto mb-3 grid size-14 place-items-center rounded-lg"
                  style={{ background: p.primaryColor, color: '#fff' }}
                  aria-hidden
                >
                  <span className="font-heading text-2xl">{p.name[0]}</span>
                </div>
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground mt-1 text-xs">{p.industry}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {p.jobsCount} lowongan aktif
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <section className="border-border bg-muted/30 mt-16 rounded-2xl border p-10 text-center">
        <h2 className="font-heading text-2xl md:text-3xl">Jadi Mitra Perekrut</h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Pasang lowongan, kelola talent pool, dan bangun brand karier Anda di platform yang fokus
          pada pekerja Indonesia.
        </p>
        <a
          href="/register?role=partner"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded-md px-6 py-3 font-medium"
        >
          Daftar Sebagai Mitra
        </a>
      </section>
    </div>
  )
}
