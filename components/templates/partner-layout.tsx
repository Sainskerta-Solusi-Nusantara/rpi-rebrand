'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase, Sparkles, Users } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Badge } from '@/components/atoms/badge'
import { DashboardLayout } from './dashboard-layout'
import { useI18n } from '@/lib/i18n/i18n-provider'
import { cn, getInitials } from '@/lib/utils'

export interface PartnerTenantContext {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
  activeJobs?: number
  totalCandidates?: number
}

export interface PartnerLayoutProps {
  children: React.ReactNode
  tenant: PartnerTenantContext
  className?: string
}

const PLAN_TONE: Record<PartnerTenantContext['plan'], 'gold' | 'indigo' | 'navy' | 'muted'> = {
  ENTERPRISE: 'gold',
  PRO: 'indigo',
  STARTER: 'navy',
  FREE: 'muted',
}

export function PartnerLayout({ children, tenant, className }: PartnerLayoutProps) {
  const { t } = useI18n()
  const tp = t.public.partnerLayout
  return (
    <DashboardLayout>
      <div className={cn('flex flex-col gap-6', className)}>
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary to-primary/85 p-5 text-primary-foreground shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                size="lg"
                src={tenant.logoUrl ?? undefined}
                alt={tenant.name}
                fallback={getInitials(tenant.name)}
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-primary-foreground/60">{tp.activeTenant}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl">{tenant.name}</h2>
                  <Badge tone={PLAN_TONE[tenant.plan]}>{tenant.plan}</Badge>
                </div>
                <p className="text-xs text-primary-foreground/70">{tenant.slug}.rumahpekerja.id</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <Stat icon={Briefcase} label={tp.activeJobs} value={tenant.activeJobs ?? 0} />
              <Stat icon={Users} label={tp.candidates} value={tenant.totalCandidates ?? 0} />
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={'/dashboard/jobs/new' as any}
                className="hidden md:inline-flex items-center justify-center gap-1.5 self-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" /> {tp.postJob}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </dl>
          </div>
        </section>
        {children}
      </div>
    </DashboardLayout>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase
  label: string
  value: number
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary-foreground/60">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="font-heading text-2xl text-secondary">
        {new Intl.NumberFormat('id-ID').format(value)}
      </dd>
    </div>
  )
}

export default PartnerLayout
