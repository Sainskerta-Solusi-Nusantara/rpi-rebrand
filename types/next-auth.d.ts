// Module augmentation for NextAuth.js — overrides Agent 4 placeholder.
// Adds SSN-specific fields to Session.user, NextAuth User, and JWT.

import type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'

export type GlobalRole = 'SUPERADMIN' | 'ADMIN' | 'PARTNER' | 'USER'
export type TenantRole = 'OWNER' | 'ADMIN' | 'RECRUITER' | 'MEMBER'

export interface TenantMembership {
  tenantId: string
  slug: string
  role: TenantRole
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      globalRole: GlobalRole
      tenants: TenantMembership[]
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name?: string | null
    image?: string | null
    globalRole: GlobalRole
    tenants?: TenantMembership[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    globalRole: GlobalRole
    tenants: TenantMembership[]
  }
}
