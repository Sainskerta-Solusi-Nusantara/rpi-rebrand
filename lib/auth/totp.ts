import * as OTPAuth from 'otpauth'
import { createHash, randomBytes } from 'node:crypto'

export const TOTP_ISSUER = 'Rumah Pekerja Indonesia'
export const TOTP_PERIOD = 30
export const TOTP_DIGITS = 6
export const TOTP_ALGORITHM = 'SHA1'
export const TOTP_WINDOW = 1 // allow ±30s clock drift

export const RECOVERY_CODE_COUNT = 10

export function generateTotpSecret(): string {
  // 20 bytes = 160 bits (RFC4226 recommendation). otpauth uses base32 for keys.
  return new OTPAuth.Secret({ size: 20 }).base32
}

function makeTotp(secretBase32: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
}

/** otpauth:// URI used by authenticator apps when scanning a QR code. */
export function buildTotpUri(secretBase32: string, label: string): string {
  return makeTotp(secretBase32, label).toString()
}

/** Verify a 6-digit code against a secret. Tolerates ±TOTP_WINDOW periods. */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  if (!code) return false
  const normalized = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalized)) return false
  try {
    const totp = makeTotp(secretBase32, 'verify')
    const delta = totp.validate({ token: normalized, window: TOTP_WINDOW })
    return delta !== null
  } catch {
    return false
  }
}

function randomRecoveryCode(): string {
  // 10-char base32-ish from 8 bytes of randomness → 16 hex chars → take 10 + hyphen.
  const raw = randomBytes(6).toString('hex').toUpperCase() // 12 chars
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

export function generateRecoveryCodes(n = RECOVERY_CODE_COUNT): string[] {
  const out = new Set<string>()
  while (out.size < n) out.add(randomRecoveryCode())
  return Array.from(out)
}

export function hashRecoveryCode(plain: string): string {
  // Recovery codes are high-entropy random secrets, single-use, so sha256 is
  // sufficient (matches our token-hash pattern elsewhere).
  return createHash('sha256').update(plain.trim().toUpperCase()).digest('hex')
}
