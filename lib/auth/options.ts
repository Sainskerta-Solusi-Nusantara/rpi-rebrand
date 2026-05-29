import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { verifyPassword } from '@/lib/auth/password'
import { hashRecoveryCode, verifyTotpCode } from '@/lib/auth/totp'
import { approximateIp, markDeviceAlertSent, recordLoginDevice } from '@/lib/auth/devices'
import { loginAlertEmail, sendEmail } from '@/lib/mailer'
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
        totpCode: { label: 'TOTP code', type: 'text' },
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
            totpSecret: true,
            totpEnabledAt: true,
          },
        })
        if (!user || !user.passwordHash) return null
        if (user.status !== 'ACTIVE') return null
        const ok = await verifyPassword(credentials.password, user.passwordHash)
        if (!ok) return null

        if (user.totpEnabledAt && user.totpSecret) {
          const codeRaw = (credentials.totpCode ?? '').toString().trim()
          if (!codeRaw) {
            // Signal to the UI that 2FA is required by throwing a known error
            // string. NextAuth surfaces this as the `error` query param.
            throw new Error('TOTP_REQUIRED')
          }
          let codeOk = false
          if (/^\d{6}$/.test(codeRaw)) {
            codeOk = verifyTotpCode(user.totpSecret, codeRaw)
          }
          if (!codeOk) {
            // Try as recovery code; consume on success.
            const recovery = await prisma.totpRecoveryCode.findUnique({
              where: { codeHash: hashRecoveryCode(codeRaw) },
              select: { id: true, userId: true, usedAt: true },
            })
            if (recovery && recovery.userId === user.id && !recovery.usedAt) {
              await prisma.totpRecoveryCode.update({
                where: { id: recovery.id },
                data: { usedAt: new Date() },
              })
              codeOk = true
            }
          }
          if (!codeOk) {
            throw new Error('TOTP_INVALID')
          }
        }

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
      // rest of the app has a canonical Prisma user to reference, and
      // upsert an Account row to track the OAuth linkage. We also flip
      // emailVerified since Google already verified the address.
      if (account?.provider === 'google' && user.email) {
        try {
          const email = user.email.toLowerCase()
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              emailVerified: new Date(),
            },
            create: {
              email,
              name: user.name ?? null,
              image: user.image ?? null,
              globalRole: 'USER',
              status: 'ACTIVE',
              emailVerified: new Date(),
            },
            select: { id: true },
          })

          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              userId: dbUser.id,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state:
                typeof account.session_state === 'string' ? account.session_state : null,
            },
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state:
                typeof account.session_state === 'string' ? account.session_state : null,
            },
          })
        } catch (err) {
          console.error('[auth/signIn] google upsert failed', err)
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
      const userId = (user as { id?: string }).id
      await logAuthEvent('signIn', userId, {
        provider: account?.provider,
        email: user.email,
      })

      // Device tracking + new-device alert email. Best-effort: never let
      // alerting break the login flow.
      if (!userId) return
      let ua: string | null = null
      let ip: string | null = null
      try {
        const h = headers()
        ua = h.get('user-agent')
        ip =
          h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          h.get('x-real-ip') ??
          null
      } catch {
        // Headers not available — skip device tracking.
        return
      }

      const result = await recordLoginDevice({ userId, userAgent: ua, ip })
      if (!result) return
      if (!result.isNew || result.device.alertSentAt) return

      // Look up email + name for the alert content.
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        })
        if (!dbUser?.email) return
        const securityUrl =
          (env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
            env.NEXTAUTH_URL?.replace(/\/$/, '') ||
            '') + '/dashboard/keamanan'
        const { subject, text, html } = loginAlertEmail({
          name: dbUser.name,
          userAgent: ua ?? 'unknown',
          ip,
          ipApprox: approximateIp(ip),
          when: new Date(),
          securityUrl,
        })
        const sent = await sendEmail({ to: dbUser.email, subject, text, html })
        if (sent.ok) {
          await markDeviceAlertSent(result.device.id)
        } else {
          console.error('[signIn alert] mailer failed', sent.error)
        }
      } catch (err) {
        console.error('[signIn alert] failed', err)
      }
    },
    async signOut({ token }) {
      await logAuthEvent('signOut', (token as { id?: string })?.id)
    },
  },
}
