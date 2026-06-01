import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'

/**
 * HMAC-SHA256 token tying together (searchId, userId), signed with the
 * NextAuth secret. Used by saved-search digest emails to provide a public
 * one-click unsubscribe link that does not require login.
 *
 * Encoding: base64url of `${searchId}:${userId}:${sig}` where `sig` is the
 * base64url'd HMAC over `${searchId}:${userId}`.
 */

function b64urlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecodeToString(input: string): string | null {
  try {
    // Restore padding.
    const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4)
    const norm = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
    return Buffer.from(norm, 'base64').toString('utf8')
  } catch {
    return null
  }
}

function getKey(): string | null {
  const secret = env.NEXTAUTH_SECRET
  if (!secret || secret.length < 16) return null
  return secret
}

function sign(payload: string, key: string): string {
  return b64urlEncode(createHmac('sha256', key).update(payload).digest())
}

/**
 * Produce an unsubscribe token for the given saved-search + owner pair.
 * Returns null when the signing key is unavailable (defensive — should not
 * happen in a properly configured deployment).
 */
export function signUnsubscribeToken(searchId: string, userId: string): string | null {
  const key = getKey()
  if (!key) return null
  if (!searchId || !userId) return null
  const payload = `${searchId}:${userId}`
  const sig = sign(payload, key)
  return b64urlEncode(`${payload}:${sig}`)
}

/**
 * Verify an unsubscribe token and recover the embedded identifiers.
 * Returns null on any malformed input, signature mismatch, or missing key.
 */
export function verifyUnsubscribeToken(
  token: string,
): { searchId: string; userId: string } | null {
  if (!token || typeof token !== 'string') return null
  const key = getKey()
  if (!key) return null

  const decoded = b64urlDecodeToString(token)
  if (!decoded) return null

  // Format: searchId:userId:sig — each id is a cuid (no colons), so a simple
  // split is safe. Be defensive anyway.
  const parts = decoded.split(':')
  if (parts.length !== 3) return null
  const [searchId, userId, sig] = parts as [string, string, string]
  if (!searchId || !userId || !sig) return null

  const expected = sign(`${searchId}:${userId}`, key)
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  if (a.length !== b.length) return null
  try {
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return { searchId, userId }
}
