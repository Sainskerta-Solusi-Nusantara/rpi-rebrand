import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck, LogOut, ArrowRight } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { userMustEnrollTwoFactor } from '@/lib/auth/totp-policy'
import { LeaveTenantButton } from '@/components/organisms/tenant-member-actions'

export const metadata = { title: '2FA Wajib — Rumah Pekerja Indonesia' }

/**
 * Gating page reached when a tenant the user belongs to has
 * `requireTwoFactor=true` and the user has not yet enrolled. Shown by the
 * `(dashboard)/layout.tsx` redirect. SUPERADMIN never lands here.
 */
export default async function TwoFactorRequiredPage({
  searchParams,
}: {
  searchParams?: { tenant?: string }
}) {
  const session = await requireAuth('/dashboard')

  // If somehow the user is already compliant, skip back to dashboard so they
  // never see this page unnecessarily.
  const blocker = await userMustEnrollTwoFactor(session.user.id)
  if (!blocker) {
    redirect('/dashboard')
  }

  // Prefer the tenant in the URL if it's actually a tenant requiring 2FA the
  // user is member of; otherwise fall back to the blocker tenant.
  let tenant = blocker
  const requested = searchParams?.tenant
  if (requested && requested !== blocker.tenantSlug) {
    const candidate = await prisma.tenant
      .findUnique({
        where: { slug: requested },
        select: { id: true, name: true, slug: true, requireTwoFactor: true },
      })
      .catch(() => null)
    const isMember = candidate
      ? session.user.tenants.some((t) => t.tenantId === candidate.id)
      : false
    if (candidate?.requireTwoFactor && isMember) {
      tenant = {
        tenantId: candidate.id,
        tenantName: candidate.name,
        tenantSlug: candidate.slug,
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-[hsl(220,50%,14%)] text-white">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          2FA wajib
        </h1>
      </div>

      <p className="text-sm text-foreground">
        Tenant <strong>{tenant.tenantName}</strong> mewajibkan 2FA. Aktifkan
        terlebih dulu untuk lanjut.
      </p>
      <p className="text-muted-foreground text-sm">
        Setelah diaktifkan, Anda akan dapat mengakses dasbor seperti biasa.
        Anda hanya perlu mengaktifkan sekali — perangkat authenticator akan
        meminta kode 6-digit saat login berikutnya.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/keamanan/2fa' as any}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors"
        >
          Aktifkan 2FA sekarang
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/logout"
          className="border-border bg-background hover:bg-muted inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Keluar
        </Link>
      </div>

      <div className="border-border bg-muted/30 rounded-md border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          Tidak ingin lanjut di tenant ini?
        </p>
        <p className="text-muted-foreground mb-3 text-xs">
          Anda dapat keluar dari <strong>{tenant.tenantName}</strong>. Setelah
          keluar, kebijakan 2FA tenant ini tidak lagi berlaku untuk akun Anda.
        </p>
        <LeaveTenantButton tenantSlug={tenant.tenantSlug} />
      </div>
    </div>
  )
}
