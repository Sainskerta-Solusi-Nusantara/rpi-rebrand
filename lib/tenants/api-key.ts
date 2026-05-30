import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

export const TENANT_API_TOKEN_PREFIX = 'rpi_t'
export const TENANT_API_KEY_SCOPES = ['read', 'write', 'admin'] as const
export type TenantApiKeyScope = (typeof TENANT_API_KEY_SCOPES)[number]

export function hashTenantApiKey(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}

/**
 * Generate a fresh tenant API key. Format: `rpi_t_<base64url(32 bytes)>`.
 * The distinct `rpi_t_` prefix lets the server quickly distinguish tenant
 * keys from user PATs (`rpi_`). Returns the plain token (one-time, must be
 * shown to the user once) and the leading 14 chars for display.
 */
export function generateTenantApiKey(): { plain: string; prefix: string } {
  const body = randomBytes(32).toString('base64url')
  const plain = `${TENANT_API_TOKEN_PREFIX}_${body}`
  // First 14 chars = `rpi_t_` + 8 token chars, so the UI can disambiguate
  // tenant keys while keeping the rest secret.
  const prefix = plain.slice(0, 14)
  return { plain, prefix }
}

export type VerifiedTenantToken = {
  tenantId: string
  tokenId: string
  scopes: TenantApiKeyScope[]
}

/**
 * Parse a Bearer header and verify a tenant API key against the DB. Returns
 * the matched record (with active/expired/tenant-status checks), or null if
 * missing/invalid. Side effect: updates lastUsedAt + lastUsedIp on success
 * (best-effort).
 */
export async function verifyTenantBearerToken(
  authorizationHeader: string | null | undefined,
  opts: { ip?: string | null } = {},
): Promise<VerifiedTenantToken | null> {
  if (!authorizationHeader) return null
  const match = authorizationHeader.match(/^Bearer\s+(\S+)$/i)
  if (!match) return null
  const plain = match[1]
  if (!plain || !plain.startsWith(`${TENANT_API_TOKEN_PREFIX}_`)) return null

  try {
    const record = await prisma.tenantApiKey.findUnique({
      where: { tokenHash: hashTenantApiKey(plain) },
      select: {
        id: true,
        tenantId: true,
        scopes: true,
        revokedAt: true,
        expiresAt: true,
        tenant: { select: { status: true } },
      },
    })
    if (!record) return null
    if (record.revokedAt) return null
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null
    if (record.tenant?.status !== 'ACTIVE') return null

    // Best-effort lastUsedAt update; failures here must not block the API.
    prisma.tenantApiKey
      .update({
        where: { id: record.id },
        data: { lastUsedAt: new Date(), lastUsedIp: opts.ip ?? null },
      })
      .catch(() => {})

    return {
      tenantId: record.tenantId,
      tokenId: record.id,
      scopes: record.scopes as TenantApiKeyScope[],
    }
  } catch (err) {
    console.error('[verifyTenantBearerToken] failed', err)
    return null
  }
}

export function hasScope(
  token: VerifiedTenantToken,
  scope: TenantApiKeyScope,
): boolean {
  return token.scopes.includes(scope)
}
