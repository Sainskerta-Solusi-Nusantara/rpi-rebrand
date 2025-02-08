import { prisma } from '@/lib/db'

export const metadata = { title: 'Moderasi' }

export default async function AdminModerationPage() {
  const [draftJobs, pausedJobs, pendingTenants, suspendedUsers] = await Promise.all([
    prisma.job
      .findMany({
        where: { status: 'DRAFT' },
        take: 25,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          tenant: { select: { name: true, slug: true } },
        },
      })
      .catch(() => []),
    prisma.job
      .findMany({
        where: { status: 'PAUSED' },
        take: 25,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          tenant: { select: { name: true } },
        },
      })
      .catch(() => []),
    prisma.tenant
      .findMany({
        where: { status: 'PROVISIONING' },
        take: 25,
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []),
    prisma.user
      .findMany({
        where: { status: 'SUSPENDED' },
        take: 25,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, email: true, name: true, updatedAt: true },
      })
      .catch(() => []),
  ])

  return (
    <div className="p-6 space-y-10">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Antrian Moderasi</h1>
        <p className="text-muted-foreground mt-1">
          Tinjau dan ambil tindakan pada item yang menunggu keputusan.
        </p>
      </header>

      <section>
        <h2 className="font-heading text-xl mb-4">
          Lowongan Draf <span className="text-muted-foreground text-sm">({draftJobs.length})</span>
        </h2>
        <ul className="border-border divide-border divide-y rounded-xl border">
          {draftJobs.map((j) => (
            <li key={j.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{j.title}</div>
                <div className="text-muted-foreground text-xs">
                  {j.tenant.name} • diperbarui{' '}
                  {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(j.updatedAt)}
                </div>
              </div>
              <a href={`/jobs/${j.slug}`} className="text-primary text-sm underline">
                Tinjau
              </a>
            </li>
          ))}
          {draftJobs.length === 0 ? (
            <li className="text-muted-foreground p-4 text-center text-sm">Tidak ada draf.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">
          Lowongan Dijeda <span className="text-muted-foreground text-sm">({pausedJobs.length})</span>
        </h2>
        <ul className="border-border divide-border divide-y rounded-xl border">
          {pausedJobs.map((j) => (
            <li key={j.id} className="flex items-center justify-between p-4">
              <div className="font-medium">{j.title}</div>
              <div className="text-muted-foreground text-xs">{j.tenant.name}</div>
            </li>
          ))}
          {pausedJobs.length === 0 ? (
            <li className="text-muted-foreground p-4 text-center text-sm">Tidak ada.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">
          Tenant Provisioning{' '}
          <span className="text-muted-foreground text-sm">({pendingTenants.length})</span>
        </h2>
        <ul className="border-border divide-border divide-y rounded-xl border">
          {pendingTenants.map((t) => (
            <li key={t.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-muted-foreground text-xs font-mono">{t.slug}</div>
              </div>
              <div className="text-muted-foreground text-xs">
                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(t.createdAt)}
              </div>
            </li>
          ))}
          {pendingTenants.length === 0 ? (
            <li className="text-muted-foreground p-4 text-center text-sm">Tidak ada.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">
          Pengguna Ditangguhkan{' '}
          <span className="text-muted-foreground text-sm">({suspendedUsers.length})</span>
        </h2>
        <ul className="border-border divide-border divide-y rounded-xl border">
          {suspendedUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{u.name ?? u.email}</div>
                <div className="text-muted-foreground text-xs">{u.email}</div>
              </div>
              <div className="text-muted-foreground text-xs">
                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(u.updatedAt)}
              </div>
            </li>
          ))}
          {suspendedUsers.length === 0 ? (
            <li className="text-muted-foreground p-4 text-center text-sm">Tidak ada.</li>
          ) : null}
        </ul>
      </section>
    </div>
  )
}
