import bcrypt from 'bcrypt'

const BCRYPT_COST = 12

/** Hash a plaintext password with bcrypt (cost 12). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST)
}

/** Verify a plaintext password against a bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

/**
 * Check whether a password appears in the HaveIBeenPwned breach corpus.
 * Uses k-anonymity: SHA-1 hashes the password locally, sends only the first
 * 5 characters of the hash to the API, and scans the suffixes returned for
 * a full match. The plaintext never leaves the server.
 *
 * Returns `true` if the password has been seen in known breaches.
 *
 * On network error or any non-OK response, returns `false` (fail-open).
 * Production hardening: cache results, add a circuit breaker, surface
 * separately from validation so a flaky API doesn't block sign-up.
 */
export async function checkPwnedPassword(password: string): Promise<boolean> {
  const count = await pwnedCount(password)
  return count > 0
}

/**
 * Returns the number of times the password appears in HaveIBeenPwned.
 * 0 means not breached. Returns -1 on network/API error so callers can
 * distinguish "verified safe" from "unable to verify".
 */
export async function pwnedCount(password: string): Promise<number> {
  if (!password) return 0
  try {
    const sha1 = await sha1Hex(password)
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // privacy: pad response so traffic size doesn't leak
        'User-Agent': 'rpi-rebrand/1.0 (Indonesia recruitment platform)',
      },
      // Server-side cache for 1 hour — same prefix is hot
      next: { revalidate: 3600 },
    })
    if (!res.ok) return -1
    const text = await res.text()
    for (const line of text.split('\n')) {
      const [hashSuffix, countStr] = line.trim().split(':')
      if (!hashSuffix || !countStr) continue
      if (hashSuffix === suffix) return parseInt(countStr, 10) || 0
    }
    return 0
  } catch {
    return -1
  }
}

async function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const buf = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}
