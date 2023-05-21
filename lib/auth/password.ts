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
 * Check password against HaveIBeenPwned k-anonymity API.
 * MVP stub — always returns false. Wire to real API in production.
 * TODO: Implement SHA-1 prefix lookup against https://api.pwnedpasswords.com/range/{prefix}
 */
export async function checkPwnedPassword(_password: string): Promise<boolean> {
  return false
}
