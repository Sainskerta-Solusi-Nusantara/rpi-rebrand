import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

export const API_TOKEN_PREFIX = 'ssn'
export const API_TOKEN_SCOPES = ['read', 'write'] as const
export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number]

export function hashApiToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}

/**
 * Generate a fresh token. Format: `rpi_<base64url(32 bytes)>`.
 * Returns the plain token (one-time, must show to the user once) and the
 * leading 12 chars for display.
 */
export function generateApiToken(): { plain: string; prefix: string } {
  const body = randomBytes(32).toString('base64url')
  const plain = `${API_TOKEN_PREFIX}_${body}`
  // Use the first 12 visible chars (excluding `rpi_` prefix) so the UI can
  // disambiguate tokens while keeping the rest secret.
  const prefix = plain.slice(0, 12)
  return { plain, prefix }
}

export type VerifiedToken = {
  userId: string
  tokenId: string
  scopes: ApiTokenScope[]
}

/**
 * Parse a Bearer header and verify the token against the DB. Returns the
 * matched record (with active status checks), or null if missing/invalid.
 * Side effect: updates lastUsedAt + lastUsedIp on success (best-effort).
 */
export async function verifyBearerToken(
  authorizationHeader: string | null | undefined,
  opts: { ip?: string | null } = {},
): Promise<VerifiedToken | null> {
  if (!authorizationHeader) return null
  const match = authorizationHeader.match(/^Bearer\s+(\S+)$/i)
  if (!match) return null
  const plain = match[1]
  if (!plain || !plain.startsWith(`${API_TOKEN_PREFIX}_`)) return null

  try {
    const record = await prisma.personalAccessToken.findUnique({
      where: { tokenHash: hashApiToken(plain) },
      select: {
        id: true,
        userId: true,
        scopes: true,
        revokedAt: true,
        expiresAt: true,
        user: { select: { status: true } },
      },
    })
    if (!record) return null
    if (record.revokedAt) return null
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null
    if (record.user?.status !== 'ACTIVE') return null

    // Best-effort lastUsedAt update; failures here must not block the API.
    prisma.personalAccessToken
      .update({
        where: { id: record.id },
        data: { lastUsedAt: new Date(), lastUsedIp: opts.ip ?? null },
      })
      .catch(() => {})

    return {
      userId: record.userId,
      tokenId: record.id,
      scopes: record.scopes as ApiTokenScope[],
    }
  } catch (err) {
    console.error('[verifyBearerToken] failed', err)
    return null
  }
}

export function hasScope(token: VerifiedToken, scope: ApiTokenScope): boolean {
  return token.scopes.includes(scope)
}
