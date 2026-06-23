import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// token-crypto.ts reads CALENDAR_TOKEN_KEY through `@/lib/env`, which parses the
// env once at module load and memoizes the decoded key. To exercise both the
// "key configured" and "no key (dev)" branches we reset the module registry and
// re-import after mutating process.env, so each case gets a fresh module graph.

const BASE_ENV = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  NEXTAUTH_SECRET: 'x'.repeat(32),
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_ROOT_DOMAIN: 'localhost',
}

// 32 bytes -> 64 hex chars (AES-256).
const HEX_KEY = 'a'.repeat(64)

async function loadCrypto(key?: string) {
  vi.resetModules()
  for (const [k, v] of Object.entries(BASE_ENV)) process.env[k] = v
  if (key === undefined) delete process.env.CALENDAR_TOKEN_KEY
  else process.env.CALENDAR_TOKEN_KEY = key
  return import('./token-crypto')
}

const ORIGINAL = { ...process.env }
afterEach(() => {
  process.env = { ...ORIGINAL }
})

describe('token-crypto with a configured key', () => {
  it('round-trips a token through encrypt → decrypt', async () => {
    const { encryptToken, decryptToken } = await loadCrypto(HEX_KEY)
    const plain = 'ya29.secret-access-token'
    const enc = encryptToken(plain)
    expect(enc).not.toBeNull()
    expect(enc).toMatch(/^enc:v1:/)
    expect(enc).not.toContain(plain)
    expect(decryptToken(enc)).toBe(plain)
  })

  it('encrypts non-deterministically (random IV) but both decrypt back', async () => {
    const { encryptToken, decryptToken } = await loadCrypto(HEX_KEY)
    const a = encryptToken('same')
    const b = encryptToken('same')
    expect(a).not.toBe(b)
    expect(decryptToken(a)).toBe('same')
    expect(decryptToken(b)).toBe('same')
  })

  it('is idempotent: re-encrypting ciphertext is a no-op', async () => {
    const { encryptToken } = await loadCrypto(HEX_KEY)
    const once = encryptToken('tok')
    expect(encryptToken(once)).toBe(once)
  })

  it('treats unprefixed values as legacy plaintext on decrypt', async () => {
    const { decryptToken } = await loadCrypto(HEX_KEY)
    expect(decryptToken('legacy-plaintext-token')).toBe('legacy-plaintext-token')
  })

  it('passes null/undefined straight through', async () => {
    const { encryptToken, decryptToken } = await loadCrypto(HEX_KEY)
    expect(encryptToken(null)).toBeNull()
    expect(encryptToken(undefined)).toBeNull()
    expect(decryptToken(null)).toBeNull()
  })

  it('rejects tampered ciphertext via the GCM auth tag', async () => {
    const { encryptToken, decryptToken } = await loadCrypto(HEX_KEY)
    const enc = encryptToken('tok') as string
    // Flip the last base64 char of the ciphertext segment.
    const tampered = enc.slice(0, -1) + (enc.endsWith('A') ? 'B' : 'A')
    expect(() => decryptToken(tampered)).toThrow()
  })

  it('throws on a malformed key (not 32 bytes)', async () => {
    const { encryptToken } = await loadCrypto('deadbeef') // 4 bytes
    expect(() => encryptToken('tok')).toThrow(/32 bytes/)
  })
})

describe('token-crypto without a key (dev passthrough)', () => {
  it('encrypt is a no-op and decrypt returns plaintext', async () => {
    const { encryptToken, decryptToken } = await loadCrypto(undefined)
    expect(encryptToken('tok')).toBe('tok')
    expect(decryptToken('tok')).toBe('tok')
  })

  it('throws if ciphertext is encountered with no key configured', async () => {
    const { decryptToken } = await loadCrypto(undefined)
    expect(() => decryptToken('enc:v1:a.b.c')).toThrow(/CALENDAR_TOKEN_KEY/)
  })
})
