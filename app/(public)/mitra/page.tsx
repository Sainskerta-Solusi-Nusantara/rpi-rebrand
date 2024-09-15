import type { Metadata } from 'next'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Mitra Perekrut',
  description:
    'Bergabung dengan ratusan mitra perekrut terverifikasi yang memanfaatkan platform Rumah Pekerja Indonesia.',
}

export default async function MitraPage() {
  const [partners, totalPartners, totalJobs] = await Promise.all([
    prisma.tenant
      .findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 24,
        include: {
          branding: { select: { logoLight: true, logoDark: true, primaryColor: true } },
          _count: { select: { jobs: true } },
        },
      })
      .catch(() => []),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.job.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="font-heading text-3xl md:text-5xl">Mitra Perekrut Kami</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {totalPartners.toLocaleString('id-ID')} perusahaan mempercayakan rekrutmen mereka kepada
          Rumah Pekerja Indonesia, dengan {totalJobs.toLocaleString('id-ID')} lowongan aktif.
        </p>
      </header>

      {partners.length === 0 ? (
        <div className="border-border rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">Belum ada mitra terdaftar.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {partners.map((p) => (
            <li
              key={p.id}
              className="border-border bg-card rounded-xl border p-6 text-center hover:shadow-md transition"
            >
              <a href={`https://${p.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'}`}>
                {p.branding?.logoLight ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.branding.logoLight}
                    alt={p.name}
                    className="mx-auto mb-3 h-12 w-auto object-contain"
                  />
                ) : (
                  <div
                    className="mx-auto mb-3 grid size-12 place-items-center rounded-lg"
                    style={{ background: p.branding?.primaryColor ?? '#0A2540', color: '#fff' }}
                    aria-hidden
                  >
                    <span className="font-heading text-xl">{p.name[0]}</span>
                  </div>
                )}
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {p._count.jobs} lowongan aktif
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
