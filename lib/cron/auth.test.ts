import { describe, it, expect } from 'vitest'
import { extractCronSecret, isCronAuthorized } from './auth'

const SECRET = 'super-secret-cron-value'

function reqWith(headers: Record<string, string>): Request {
  return new Request('http://localhost/api/cron/x', { method: 'POST', headers })
}

describe('extractCronSecret', () => {
  it('reads the Authorization: Bearer convention', () => {
    expect(extractCronSecret(reqWith({ authorization: `Bearer ${SECRET}` }))).toBe(SECRET)
  })

  it('reads the x-cron-secret convention', () => {
    expect(extractCronSecret(reqWith({ 'x-cron-secret': SECRET }))).toBe(SECRET)
  })

  it('prefers Authorization when both are present', () => {
    const r = reqWith({ authorization: `Bearer ${SECRET}`, 'x-cron-secret': 'other' })
    expect(extractCronSecret(r)).toBe(SECRET)
  })

  it('returns empty string when neither header is present', () => {
    expect(extractCronSecret(reqWith({}))).toBe('')
  })

  it('does not treat a non-Bearer Authorization as a secret', () => {
    expect(extractCronSecret(reqWith({ authorization: 'Basic abc' }))).toBe('')
  })
})

describe('isCronAuthorized', () => {
  it('authorizes a correct Bearer secret', () => {
    expect(isCronAuthorized(reqWith({ authorization: `Bearer ${SECRET}` }), SECRET)).toBe(true)
  })

  it('authorizes a correct x-cron-secret', () => {
    expect(isCronAuthorized(reqWith({ 'x-cron-secret': SECRET }), SECRET)).toBe(true)
  })

  it('rejects a wrong secret', () => {
    expect(isCronAuthorized(reqWith({ 'x-cron-secret': 'nope' }), SECRET)).toBe(false)
  })

  it('rejects a secret of different length', () => {
    expect(isCronAuthorized(reqWith({ 'x-cron-secret': SECRET + 'x' }), SECRET)).toBe(false)
  })

  it('rejects when no secret header is supplied', () => {
    expect(isCronAuthorized(reqWith({}), SECRET)).toBe(false)
  })

  it('returns false when the configured secret is empty/undefined', () => {
    expect(isCronAuthorized(reqWith({ authorization: 'Bearer ' }), '')).toBe(false)
    expect(isCronAuthorized(reqWith({ 'x-cron-secret': 'anything' }), undefined)).toBe(false)
    expect(isCronAuthorized(reqWith({ 'x-cron-secret': 'anything' }), null)).toBe(false)
  })
})
