import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import type { GlobalRole, TenantMembership } from '@/types/next-auth'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

/**
 * Audit-log helper. Best-effort; never throws into auth flow.
 * TODO(Agent X): swap to dedicated audit service when available.
 */
async function logAuthEvent(
  event: 'signIn' | 'signOut',
  userId: string | undefined,
  meta: Record<string, unknown> = {},
) {
  try {
    const anyPrisma = prisma as unknown as {
      auditLog?: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> }
    }
    if (!anyPrisma.auditLog?.create) return
    await anyPrisma.auditLog.create({
      data: {
        action: `auth.${event}`,
        userId: userId ?? null,
        metadata: meta,
      },
    })
  } catch {
    // Swallow — never break auth on audit failure.
  }
}

async function loadTenantMemberships(userId: string): Promise<TenantMembership[]> {
  try {
    const rows = await prisma.userTenant.findMany({
      where: { userId },
      select: {
        tenantId: true,
        role: true,
        tenant: { select: { slug: true } },
      },
    })
    return rows.map((r) => ({
      tenantId: r.tenantId,
      slug: r.tenant.slug,
      role: r.role as TenantMembership['role'],
    }))
  } catch {
    return []
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.toLowerCase().trim()
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            globalRole: true,
            status: true,
          },
        })
        if (!user || !user.passwordHash) return null
        if (user.status !== 'ACTIVE') return null
        const ok = await verifyPassword(credentials.password, user.passwordHash)
        if (!ok) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          globalRole: user.globalRole as GlobalRole,
        }
      },
    }),
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // On Google sign-in: upsert a User row with default USER role so the
      // rest of the app has a canonical Prisma user to reference.
      if (account?.provider === 'google' && user.email) {
        try {
          await prisma.user.upsert({
            where: { email: user.email.toLowerCase() },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
            create: {
              email: user.email.toLowerCase(),
              name: user.name ?? null,
              image: user.image ?? null,
              globalRole: 'USER',
              status: 'ACTIVE',
            },
          })
        } catch {
          // Fail closed only if linkage truly broken; otherwise allow.
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      // First sign-in: hydrate from authorize() return value.
      if (user) {
        // Re-fetch canonical DB id (Google flow may not have set it on user).
        let dbUser: { id: string; globalRole: string } | null = null
        if ((user as { id?: string }).id) {
          token.id = (user as { id: string }).id
          token.globalRole =
            ((user as { globalRole?: GlobalRole }).globalRole as GlobalRole) ?? 'USER'
        } else if (user.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true, globalRole: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.globalRole = dbUser.globalRole as GlobalRole
          }
        }
        if (token.id) {
          token.tenants = await loadTenantMemberships(token.id)
        } else {
          token.tenants = []
        }
      }

      // Manual refresh trigger (e.g., after tenant join) — reload memberships.
      if (trigger === 'update' && token.id) {
        token.tenants = await loadTenantMemberships(token.id)
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.globalRole = (token.globalRole as GlobalRole) ?? 'USER'
        session.user.tenants = (token.tenants as TenantMembership[]) ?? []
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      await logAuthEvent('signIn', (user as { id?: string }).id, {
        provider: account?.provider,
        email: user.email,
      })
    },
    async signOut({ token }) {
      await logAuthEvent('signOut', (token as { id?: string })?.id)
    },
  },
}
