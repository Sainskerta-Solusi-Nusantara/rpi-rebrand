'use client'

// Team-invite form used by the partner Team page. Thin wrapper around the
// shared `TenantInviteForm` (organism) so the partner zone can invite members
// by tenant slug. The real form logic + i18n live in tenant-invite-form.tsx.
import { TenantInviteForm } from '@/components/organisms/tenant-invite-form'

export function InviteForm({ tenantSlug }: { tenantSlug: string }) {
  return <TenantInviteForm tenantSlug={tenantSlug} />
}

export default InviteForm
