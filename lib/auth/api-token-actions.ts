'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  API_TOKEN_SCOPES,
  generateApiToken,
  hashApiToken,
  type ApiTokenScope,
} from '@/lib/auth/api-token'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvAuth1 } from '@/lib/i18n/dictionaries/srv-auth1'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const MAX_TOKENS_PER_USER = 20

const expirySchema = z.enum(['none', '30d', '90d', '180d', '365d'])
type ExpiryChoice = z.infer<typeof expirySchema>

function expiryToDate(choice: ExpiryChoice): Date | null {
  const days: Record<Exclude<ExpiryChoice, 'none'>, number> = {
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
  }
  if (choice === 'none') return null
  return new Date(Date.now() + days[choice] * 24 * 60 * 60 * 1000)
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  expiry: expirySchema.default('90d'),
  scopes: z.array(z.enum(API_TOKEN_SCOPES)).min(1),
})

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

/**
 * Create a new Personal Access Token for the signed-in user.
 * Returns the plain token ONCE — caller must show it to the user immediately
 * and not store it; the DB only retains a sha256 hash.
 */
export async function createApiToken(formData: FormData): Promise<
  ActionResult<{ plain: string; prefix: string; expiresAt: Date | null }>
> {
  const locale = await getServerLocale()
  const t = srvAuth1[locale].apiToken
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.mustLogin }

  const scopesRaw = formData.getAll('scopes').map((v) => String(v))
  const parsed = await localizedParse(createSchema, {
    name: formData.get('name'),
    expiry: formData.get('expiry') ?? 'none',
    scopes: scopesRaw,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { name, expiry, scopes } = parsed.data

  try {
    const activeCount = await prisma.personalAccessToken.count({
      where: { userId: session.user.id, revokedAt: null },
    })
    if (activeCount >= MAX_TOKENS_PER_USER) {
      return {
        ok: false,
        error: t.tokenLimitReached.replace('{max}', String(MAX_TOKENS_PER_USER)),
      }
    }

    const { plain, prefix } = generateApiToken()
    const tokenHash = hashApiToken(plain)
    const expiresAt = expiryToDate(expiry)
    const meta = getRequestMeta()

    const created = await prisma.personalAccessToken.create({
      data: {
        userId: session.user.id,
        name,
        tokenHash,
        tokenPrefix: prefix,
        scopes: scopes as ApiTokenScope[],
        expiresAt,
      },
      select: { id: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.CREATE,
        resource: 'api_token',
        resourceId: created.id,
        metadata: { name, scopes, expiresAt: expiresAt?.toISOString() ?? null },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard/keamanan/api-tokens')
    return { ok: true, data: { plain, prefix, expiresAt } }
  } catch (err) {
    console.error('[createApiToken] failed', err)
    return { ok: false, error: t.genericError }
  }
}

export async function revokeApiToken(tokenId: string): Promise<ActionResult> {
  const locale = await getServerLocale()
  const t = srvAuth1[locale].apiToken
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.mustLogin }
  if (!tokenId) return { ok: false, error: t.invalidTokenId }

  try {
    const token = await prisma.personalAccessToken.findUnique({
      where: { id: tokenId },
      select: { id: true, userId: true, revokedAt: true, name: true },
    })
    if (!token) return { ok: false, error: t.tokenNotFound }
    if (token.userId !== session.user.id) {
      return { ok: false, error: t.tokenNotOwned }
    }
    if (token.revokedAt) return { ok: true }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.personalAccessToken.update({
        where: { id: tokenId },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.REVOKE,
          resource: 'api_token',
          resourceId: tokenId,
          metadata: { name: token.name },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan/api-tokens')
    return { ok: true }
  } catch (err) {
    console.error('[revokeApiToken] failed', err)
    return { ok: false, error: t.genericError }
  }
}
