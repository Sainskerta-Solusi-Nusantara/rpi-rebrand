import { describe, it, expect } from 'vitest'

// storage.ts imports `@/lib/env`, which parses the runtime env at module load
// and throws when required vars are missing. Seed a minimal valid env (plus an
// R2 public URL so the key-derivation contract is exercisable) BEFORE importing
// the module under test, then dynamic-import it. Pure/deterministic — no fs, no
// network, matching the unit-test philosophy in vitest.config.ts.
process.env.DATABASE_URL ??= 'postgresql://u:p@localhost:5432/db'
process.env.NEXTAUTH_SECRET ??= 'x'.repeat(32)
process.env.NEXTAUTH_URL ??= 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000'
process.env.NEXT_PUBLIC_ROOT_DOMAIN ??= 'localhost'
process.env.R2_PUBLIC_URL ??= 'https://cdn.example.com'

const {
  extForMime,
  logoExtForMime,
  resumeExtForMime,
  jobAttachmentExtForMime,
  r2KeyFromPublicUrl,
} = await import('./storage')

describe('mime → ext mapping', () => {
  it('maps avatar image mimes', () => {
    expect(extForMime('image/jpeg')).toBe('jpg')
    expect(extForMime('image/png')).toBe('png')
    expect(extForMime('image/webp')).toBe('webp')
    expect(extForMime('application/pdf')).toBeNull()
  })

  it('logo mapping adds svg on top of images', () => {
    expect(logoExtForMime('image/svg+xml')).toBe('svg')
    expect(logoExtForMime('image/png')).toBe('png')
    expect(logoExtForMime('text/plain')).toBeNull()
  })

  it('resume mapping covers doc formats only', () => {
    expect(resumeExtForMime('application/pdf')).toBe('pdf')
    expect(resumeExtForMime('application/msword')).toBe('doc')
    expect(
      resumeExtForMime(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe('docx')
    expect(resumeExtForMime('image/png')).toBeNull()
  })

  it('job attachment mapping is the widest (docs + images + txt)', () => {
    expect(jobAttachmentExtForMime('application/pdf')).toBe('pdf')
    expect(jobAttachmentExtForMime('image/jpeg')).toBe('jpg')
    expect(jobAttachmentExtForMime('text/plain')).toBe('txt')
    expect(jobAttachmentExtForMime('application/zip')).toBeNull()
  })
})

describe('r2KeyFromPublicUrl', () => {
  it('strips the public base and returns the key when prefix matches', () => {
    expect(
      r2KeyFromPublicUrl('https://cdn.example.com/avatars/u1/abc.jpg', 'avatars/'),
    ).toBe('avatars/u1/abc.jpg')
    expect(
      r2KeyFromPublicUrl(
        'https://cdn.example.com/resumes/u9/deadbeef.pdf',
        'resumes/',
      ),
    ).toBe('resumes/u9/deadbeef.pdf')
  })

  it('returns null when the key is outside the requested prefix', () => {
    expect(
      r2KeyFromPublicUrl('https://cdn.example.com/avatars/u1/abc.jpg', 'resumes/'),
    ).toBeNull()
  })

  it('returns null for non-R2 URLs (local paths, other hosts)', () => {
    expect(r2KeyFromPublicUrl('/uploads/avatars/u1/abc.jpg', 'avatars/')).toBeNull()
    expect(
      r2KeyFromPublicUrl('https://evil.example.org/avatars/u1/abc.jpg', 'avatars/'),
    ).toBeNull()
  })
})
