import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Badge } from '@/components/atoms/badge'
import { cn, formatRupiah, getInitials } from '@/lib/utils'

export type TenantPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'INACTIVE'

export interface TenantCardData {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  plan: TenantPlan
  status: TenantStatus
  members: number
  mrr?: number
  href?: string
}

export interface TenantCardProps {
  tenant: TenantCardData
  className?: string
}

const PLAN_BADGE: Record<TenantPlan, { label: string; tone: 'gold' | 'indigo' | 'muted' | 'navy' }> = {
  FREE: { label: 'Free', tone: 'muted' },
  STARTER: { label: 'Starter', tone: 'navy' },
  PRO: { label: 'Pro', tone: 'indigo' },
  ENTERPRISE: { label: 'Enterprise', tone: 'gold' },
}

const STATUS_BADGE: Record<TenantStatus, { label: string; tone: 'success' | 'warning' | 'destructive' | 'muted' }> = {
  ACTIVE: { label: 'Aktif', tone: 'success' },
  TRIAL: { label: 'Trial', tone: 'warning' },
  SUSPENDED: { label: 'Disuspensi', tone: 'destructive' },
  INACTIVE: { label: 'Nonaktif', tone: 'muted' },
}

export function TenantCard({ tenant, className }: TenantCardProps) {
  const plan = PLAN_BADGE[tenant.plan]
  const status = STATUS_BADGE[tenant.status]
  const inner = (
    <article
      className={cn(
        'group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground transition-all hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-md',
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <Avatar
          size="lg"
          src={tenant.logoUrl ?? undefined}
          alt={tenant.name}
          fallback={getInitials(tenant.name)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg">{tenant.name}</p>
          <p className="truncate text-xs text-muted-foreground">{tenant.slug}.rumahpekerja.id</p>
        </div>
        {tenant.href ? (
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge tone={plan.tone}>{plan.label}</Badge>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> Anggota
          </dt>
          <dd className="mt-1 font-medium tabular-nums">{tenant.members}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">MRR</dt>
          <dd className="mt-1 font-medium tabular-nums text-secondary">
            {tenant.mrr !== undefined ? formatRupiah(tenant.mrr) : '—'}
          </dd>
        </div>
      </dl>
    </article>
  )
  return tenant.href ? (
    <Link href={tenant.href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export default TenantCard
