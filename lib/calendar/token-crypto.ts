import crypto from 'node:crypto'
import { env } from '@/lib/env'

/**
 * Envelope encryption for calendar OAuth tokens at rest.
 *
 * `CalendarAccount.accessToken` / `refreshToken` used to be persisted in
 * plaintext. This wraps them with AES-256-GCM using a key-encryption key (KEK)
 * from `CALENDAR_TOKEN_KEY`. Design goals:
 *
 *  - **Zero-migration rollout.** Ciphertext is tagged with a version prefix;
 *    `decryptToken` returns any unprefixed value as-is, so legacy plaintext
 *    rows keep working and get upgraded to ciphertext the next time they are
 *    written (re-connect or token refresh).
 *  - **Idempotent writes.** `encryptToken` is a no-op on already-encrypted
 *    input, so passthrough "keep the existing refresh_token" fallbacks in the
 *    OAuth callbacks don't double-wrap.
 *  - **Graceful in dev.** With no `CALENDAR_TOKEN_KEY` set, encryption is a
 *    passthrough (plaintext) — local dev stays green. A key MUST be set in
 *    multi-tenant prod; once set, an unprefixed value still decrypts fine but
 *    a prefixed value without a key throws (misconfiguration, fail loud).
 */

const PREFIX = 'enc:v1:'

let cachedKey: Buffer | null | undefined

/**
 * Decode `CALENDAR_TOKEN_KEY` to a 32-byte AES-256 key. Accepts 64 hex chars
 * or base64 of 32 bytes. Returns null when unset (dev passthrough). Throws on a
 * present-but-malformed key — a misconfigured KEK must not silently degrade to
 * plaintext.
 */
function loadKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey
  const raw = env.CALENDAR_TOKEN_KEY
  if (!raw) {
    cachedKey = null
    return null
  }
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error(
      'CALENDAR_TOKEN_KEY must decode to 32 bytes (AES-256): provide 64 hex chars or base64 of 32 random bytes.',
    )
  }
  cachedKey = key
  return key
}

/**
 * Encrypt a token for storage. No-op on null/undefined and on values that are
 * already encrypted (so callers can pass an existing stored value through a
 * fallback without double-wrapping). Without a configured key, returns the
 * plaintext unchanged.
 */
export function encryptToken(plain: string): string
export function encryptToken(plain: string | null | undefined): string | null
export function encryptToken(plain: string | null | undefined): string | null {
  if (plain == null) return null
  if (plain.startsWith(PREFIX)) return plain
  const key = loadKey()
  if (!key) return plain
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return (
    PREFIX +
    [iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(
      '.',
    )
  )
}

/**
 * Decrypt a stored token. Returns unprefixed (legacy plaintext) values as-is.
 * Throws when ciphertext is present but no key is configured, or when the
 * payload is malformed / fails the GCM auth tag.
 */
export function decryptToken(stored: string | null | undefined): string | null {
  if (stored == null) return null
  if (!stored.startsWith(PREFIX)) return stored
  const key = loadKey()
  if (!key) {
    throw new Error(
      'Encountered an encrypted calendar token but CALENDAR_TOKEN_KEY is not set.',
    )
  }
  const parts = stored.slice(PREFIX.length).split('.')
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted calendar token.')
  }
  const iv = Buffer.from(parts[0]!, 'base64')
  const tag = Buffer.from(parts[1]!, 'base64')
  const ct = Buffer.from(parts[2]!, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
