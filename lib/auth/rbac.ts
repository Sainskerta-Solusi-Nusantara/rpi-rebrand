import type { GlobalRole, TenantRole, TenantMembership } from '@/types/next-auth'

/**
 * Permission union — namespaced by domain. Keep additive and stable;
 * permissions are referenced from server actions and route guards.
 */
export type Permission =
  // Job postings
  | 'job.view'
  | 'job.create'
  | 'job.update'
  | 'job.delete'
  | 'job.publish'
  // Users
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.impersonate'
  // Tenant management
  | 'tenant.view'
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.delete'
  | 'tenant.suspend'
  // Branding
  | 'branding.view'
  | 'branding.update'
  // Team / memberships
  | 'team.view'
  | 'team.invite'
  | 'team.update'
  | 'team.remove'
  // Courses (learning)
  | 'course.view'
  | 'course.create'
  | 'course.update'
  | 'course.delete'
  // Audit
  | 'audit.view'
  | 'audit.export'
  // Billing
  | 'billing.view'
  | 'billing.update'

/**
 * Global role → platform-wide permissions.
 * SUPERADMIN: everything. ADMIN: everything except destructive tenant ops.
 * PARTNER: tenant-side capabilities granted via membership; minimal global.
 * USER: read-only profile-scoped global.
 */
export const ROLE_PERMISSIONS: Record<GlobalRole, Permission[]> = {
  SUPERADMIN: [
    'job.view', 'job.create', 'job.update', 'job.delete', 'job.publish',
    'user.view', 'user.create', 'user.update', 'user.delete', 'user.impersonate',
    'tenant.view', 'tenant.create', 'tenant.update', 'tenant.delete', 'tenant.suspend',
    'branding.view', 'branding.update',
    'team.view', 'team.invite', 'team.update', 'team.remove',
    'course.view', 'course.create', 'course.update', 'course.delete',
    'audit.view', 'audit.export',
    'billing.view', 'billing.update',
  ],
  ADMIN: [
    'job.view', 'job.update', 'job.publish',
    'user.view', 'user.update',
    'tenant.view', 'tenant.update', 'tenant.suspend',
    'branding.view', 'branding.update',
    'team.view',
    'course.view', 'course.update',
    'audit.view', 'audit.export',
    'billing.view',
  ],
  PARTNER: [
    'job.view',
    'tenant.view',
    'branding.view',
    'team.view',
    'course.view',
  ],
  USER: [
    'job.view',
    'course.view',
  ],
}

/**
 * Tenant-scoped role → permissions within that tenant.
 * OWNER: full control of tenant + billing.
 * ADMIN: full operational control, no billing/destructive.
 * RECRUITER: job + team-view scope.
 * MEMBER: read-only.
 */
export const TENANT_ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  OWNER: [
    'job.view', 'job.create', 'job.update', 'job.delete', 'job.publish',
    'tenant.view', 'tenant.update',
    'branding.view', 'branding.update',
    'team.view', 'team.invite', 'team.update', 'team.remove',
    'course.view', 'course.create', 'course.update', 'course.delete',
    'audit.view',
    'billing.view', 'billing.update',
  ],
  ADMIN: [
    'job.view', 'job.create', 'job.update', 'job.delete', 'job.publish',
    'tenant.view', 'tenant.update',
    'branding.view', 'branding.update',
    'team.view', 'team.invite', 'team.update', 'team.remove',
    'course.view', 'course.create', 'course.update', 'course.delete',
    'audit.view',
  ],
  RECRUITER: [
    'job.view', 'job.create', 'job.update', 'job.publish',
    'tenant.view',
    'team.view',
    'course.view',
  ],
  MEMBER: [
    'job.view',
    'tenant.view',
    'team.view',
    'course.view',
  ],
}

/** Check whether a global role grants a given permission. */
export function hasPermission(role: GlobalRole | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check whether a user has a permission within a specific tenant,
 * combining global override (SUPERADMIN/ADMIN) and tenant membership role.
 */
export function hasTenantPermission(
  globalRole: GlobalRole | undefined | null,
  memberships: TenantMembership[] | undefined,
  tenantId: string,
  permission: Permission,
): boolean {
  if (globalRole === 'SUPERADMIN') return true
  if (globalRole === 'ADMIN' && ROLE_PERMISSIONS.ADMIN.includes(permission)) return true
  const membership = memberships?.find((m) => m.tenantId === tenantId)
  if (!membership) return false
  return TENANT_ROLE_PERMISSIONS[membership.role]?.includes(permission) ?? false
}

/** Determine if a user can access a tenant at all (any membership or global override). */
export function canAccessTenant(
  globalRole: GlobalRole | undefined | null,
  memberships: TenantMembership[] | undefined,
  tenantId: string,
): boolean {
  if (globalRole === 'SUPERADMIN' || globalRole === 'ADMIN') return true
  return Boolean(memberships?.some((m) => m.tenantId === tenantId))
}
