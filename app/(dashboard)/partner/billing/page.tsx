import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export const metadata = { title: 'Penagihan' }

const planLabels: Record<string, string> = {
  FREE: 'Gratis',
  PRO: 'Pro',
  BUSINESS: 'Bisnis',
  ENTERPRISE: 'Enterprise',
}

async function resolveTenantId(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) {
    const t = await prisma.tenant.findUnique({ where: { slug: hSlug }, select: { id: true } }).catch(() => null)
    if (t?.id) return t.id
  }
  const ut = await prisma.userTenant
    .findFirst({ where: { userId }, select: { tenantId: true } })
    .catch(() => null)
  return ut?.tenantId ?? null
}

export default async function PartnerBillingPage() {
  const session = await getServerSession(authOptions)
  const tenantId = await resolveTenantId(session!.user.id)

  const [tenant, subscription] = await Promise.all([
    tenantId
      ? prisma.tenant.findUnique({ where: { id: tenantId } }).catch(() => null)
      : Promise.resolve(null),
    tenantId
      ? prisma.subscription
          .findFirst({
            where: { tenantId },
            orderBy: { currentPeriodEnd: 'desc' },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ])

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Penagihan & Paket</h1>
        <p className="text-muted-foreground mt-1">
          Kelola paket berlangganan dan tagihan tenant Anda.
        </p>
      </header>

      <section className="border-border bg-card rounded-xl border p-6">
        <h2 className="font-heading text-xl">Paket Saat Ini</h2>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-muted-foreground text-sm">Paket</div>
            <div className="font-heading text-2xl">
              {planLabels[tenant?.planTier ?? 'FREE'] ?? 'Gratis'}
            </div>
          </div>
          {subscription ? (
            <div className="text-sm">
              <div className="text-muted-foreground">Periode aktif</div>
              <div className="font-medium">
                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
                  subscription.currentPeriodStart,
                )}{' '}
                –{' '}
                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
                  subscription.currentPeriodEnd,
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6">
          <a
            href="/partner/billing/upgrade"
            className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 font-medium"
          >
            Tingkatkan Paket
          </a>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">Riwayat Tagihan</h2>
        <p className="text-muted-foreground">
          Riwayat tagihan akan ditampilkan setelah integrasi pembayaran aktif.
        </p>
      </section>
    </div>
  )
}
