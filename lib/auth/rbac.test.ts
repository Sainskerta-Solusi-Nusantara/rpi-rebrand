import { describe, it, expect } from 'vitest'
import type { TenantMembership } from '@/types/next-auth'
import { canAccessTenant, hasPermission, hasTenantPermission } from './rbac'

// Security-critical: these functions are the tenant-isolation boundary used by
// every server action + route guard. A regression here = cross-tenant leakage.

const recruiterInA: TenantMembership = {
  tenantId: 'tenant-A',
  slug: 'a',
  role: 'RECRUITER',
}
const ownerInA: TenantMembership = { tenantId: 'tenant-A', slug: 'a', role: 'OWNER' }
const memberInA: TenantMembership = { tenantId: 'tenant-A', slug: 'a', role: 'MEMBER' }

describe('hasPermission (global role)', () => {
  it('grants SUPERADMIN destructive platform permissions', () => {
    expect(hasPermission('SUPERADMIN', 'tenant.delete')).toBe(true)
    expect(hasPermission('SUPERADMIN', 'user.impersonate')).toBe(true)
  })

  it('denies ADMIN the destructive tenant ops SUPERADMIN keeps', () => {
    expect(hasPermission('ADMIN', 'tenant.delete')).toBe(false)
    expect(hasPermission('ADMIN', 'job.delete')).toBe(false)
  })

  it('limits USER to read-only scopes', () => {
    expect(hasPermission('USER', 'job.view')).toBe(true)
    expect(hasPermission('USER', 'job.create')).toBe(false)
  })

  it('treats null/undefined role as no permission', () => {
    expect(hasPermission(null, 'job.view')).toBe(false)
    expect(hasPermission(undefined, 'job.view')).toBe(false)
  })
})

describe('hasTenantPermission (tenant isolation)', () => {
  it('lets SUPERADMIN act on any tenant with no membership', () => {
    expect(hasTenantPermission('SUPERADMIN', [], 'tenant-A', 'job.delete')).toBe(true)
  })

  it('grants a tenant role its permission only inside its own tenant', () => {
    expect(
      hasTenantPermission('USER', [recruiterInA], 'tenant-A', 'job.update'),
    ).toBe(true)
    // Same membership, DIFFERENT tenant → denied (cross-tenant isolation).
    expect(
      hasTenantPermission('USER', [recruiterInA], 'tenant-B', 'job.update'),
    ).toBe(false)
  })

  it('denies a permission the membership role does not carry', () => {
    expect(hasTenantPermission('USER', [memberInA], 'tenant-A', 'job.create')).toBe(false)
    expect(hasTenantPermission('USER', [recruiterInA], 'tenant-A', 'billing.update')).toBe(
      false,
    )
    expect(hasTenantPermission('USER', [ownerInA], 'tenant-A', 'billing.update')).toBe(true)
  })

  it('denies when the user has no membership in the target tenant', () => {
    expect(hasTenantPermission('USER', [], 'tenant-A', 'job.view')).toBe(false)
    expect(hasTenantPermission('USER', undefined, 'tenant-A', 'job.view')).toBe(false)
  })

  it('does not let global ADMIN inherit non-global permissions via tenant scope', () => {
    // job.delete is NOT in the global ADMIN set, and ADMIN has no membership.
    expect(hasTenantPermission('ADMIN', [], 'tenant-A', 'job.delete')).toBe(false)
    // job.update IS in the global ADMIN set → allowed platform-wide.
    expect(hasTenantPermission('ADMIN', [], 'tenant-A', 'job.update')).toBe(true)
  })
})

describe('canAccessTenant', () => {
  it('allows platform admins everywhere', () => {
    expect(canAccessTenant('SUPERADMIN', [], 'tenant-A')).toBe(true)
    expect(canAccessTenant('ADMIN', [], 'tenant-A')).toBe(true)
  })

  it('allows a member only into tenants they belong to', () => {
    expect(canAccessTenant('USER', [recruiterInA], 'tenant-A')).toBe(true)
    expect(canAccessTenant('USER', [recruiterInA], 'tenant-B')).toBe(false)
    expect(canAccessTenant('USER', [], 'tenant-A')).toBe(false)
  })
})
