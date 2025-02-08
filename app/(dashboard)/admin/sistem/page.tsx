import { prisma } from '@/lib/db'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-24 w-full animate-pulse rounded-xl"
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
const KPICard: any = safeRequire('@/components/molecules/kpi-card', 'KPICard')

export const metadata = { title: 'Kesehatan Sistem' }

async function checkDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

export default async function AdminSystemPage() {
  const [db, sessionsActive, recentLogins, totalAuditLast24] = await Promise.all([
    checkDb(),
    prisma.session.count({ where: { expires: { gt: new Date() } } }).catch(() => 0),
    prisma.auditLog
      .count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })
      .catch(() => 0),
    prisma.auditLog
      .count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      .catch(() => 0),
  ])

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Kesehatan Sistem</h1>
        <p className="text-muted-foreground mt-1">
          Status layanan, performa basis data, dan aktivitas terkini.
        </p>
      </header>

      <section>
        <h2 className="font-heading text-xl mb-4">Layanan</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className={`border-border rounded-xl border p-4 ${
              db.ok ? 'bg-card' : 'bg-destructive/10'
            }`}
          >
            <div className="text-muted-foreground text-xs uppercase">Basis Data</div>
            <div className="font-heading mt-1 text-2xl">{db.ok ? 'Sehat' : 'Bermasalah'}</div>
            <div className="text-muted-foreground mt-1 text-xs">Latensi {db.latencyMs} ms</div>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <div className="text-muted-foreground text-xs uppercase">Auth</div>
            <div className="font-heading mt-1 text-2xl">Aktif</div>
            <div className="text-muted-foreground mt-1 text-xs">NextAuth JWT</div>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <div className="text-muted-foreground text-xs uppercase">Penyimpanan</div>
            <div className="font-heading mt-1 text-2xl">—</div>
            <div className="text-muted-foreground mt-1 text-xs">
              TODO: integrasi monitoring storage
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">Aktivitas 24 Jam</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KPICard label="Sesi Aktif" value={sessionsActive} />
          <KPICard label="Login (24j)" value={recentLogins} />
          <KPICard label="Kejadian Audit (24j)" value={totalAuditLast24} />
        </div>
      </section>
    </div>
  )
}
