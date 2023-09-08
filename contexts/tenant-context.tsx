'use client'

/**
 * Client-side tenant context.
 *
 * Server middleware resolves the subdomain → tenant slug and writes it to
 * the `x-tenant-slug` request header. Server Components/Layouts then load
 * the Tenant row and feed a serializable subset down to this provider so
 * client components can read identity (id, slug, name, planTier) without
 * an extra round-trip.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'

export type TenantPlanTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'

export type TenantInfo = {
  id: string
  slug: string
  name: string
  planTier: TenantPlanTier
}

type TenantContextValue = {
  tenant: TenantInfo | null
}

const TenantContext = createContext<TenantContextValue>({ tenant: null })

export type TenantProviderProps = {
  tenant: TenantInfo | null
  children: ReactNode
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  const value = useMemo<TenantContextValue>(() => ({ tenant }), [tenant])
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

/**
 * Read the active tenant. Returns null on the apex domain (no tenant).
 * Components that strictly require a tenant should use `useRequiredTenant`.
 */
export function useTenant(): TenantInfo | null {
  return useContext(TenantContext).tenant
}

/** Throwing variant for components that may only render inside a tenant. */
export function useRequiredTenant(): TenantInfo {
  const tenant = useTenant()
  if (!tenant) {
    throw new Error('useRequiredTenant(): no tenant in context.')
  }
  return tenant
}
