import fs from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { env } from '@/lib/env'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const ALLOWED_AVATAR_MIME = Object.keys(MIME_TO_EXT)
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB

export function extForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null
}

function randomBasename(): string {
  return randomBytes(12).toString('hex')
}

/**
 * Save an avatar image and return a relative URL that the app can serve.
 * Local storage writes under `public/uploads/avatars/{userId}/` so Next can
 * serve it without a custom route. R2 transport is a TODO — the call will
 * return an error until configured.
 */
export async function saveAvatar(opts: {
  userId: string
  buffer: Buffer
  mime: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ext = extForMime(opts.mime)
  if (!ext) return { ok: false, error: 'Format gambar tidak didukung.' }
  if (opts.buffer.length > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Ukuran gambar melebihi 5 MB.' }
  }

  if (env.STORAGE_PROVIDER === 'r2') {
    // R2 transport intentionally unimplemented in this scope — when wiring,
    // upload via S3 SDK with env.R2_* credentials and return the public URL.
    return {
      ok: false,
      error: 'Storage provider R2 belum dikonfigurasi.',
    }
  }

  try {
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'avatars', opts.userId)
    await fs.mkdir(baseDir, { recursive: true })
    const filename = `${randomBasename()}.${ext}`
    const filePath = path.join(baseDir, filename)
    await fs.writeFile(filePath, opts.buffer)
    return { ok: true, url: `/uploads/avatars/${opts.userId}/${filename}` }
  } catch (err) {
    console.error('[saveAvatar] failed', err)
    return { ok: false, error: 'Gagal menyimpan gambar.' }
  }
}

/**
 * Best-effort cleanup of a previously stored local avatar. Silently ignores
 * remote or unknown URLs — those are the responsibility of the caller's
 * provider-specific delete path.
 */
export async function deleteLocalAvatar(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith('/uploads/avatars/')) return
  try {
    const rel = url.replace(/^\/+/, '')
    const filePath = path.join(process.cwd(), 'public', rel)
    await fs.unlink(filePath)
  } catch {
    // Ignore — the file may already be gone.
  }
}

export const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB
const LOGO_MIME_TO_EXT: Record<string, string> = {
  ...MIME_TO_EXT,
  'image/svg+xml': 'svg',
}
export const ALLOWED_LOGO_MIME = Object.keys(LOGO_MIME_TO_EXT)

export function logoExtForMime(mime: string): string | null {
  return LOGO_MIME_TO_EXT[mime] ?? null
}

export async function saveTenantLogo(opts: {
  tenantId: string
  slot: 'light' | 'dark' | 'favicon'
  buffer: Buffer
  mime: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ext = logoExtForMime(opts.mime)
  if (!ext) return { ok: false, error: 'Format gambar tidak didukung.' }
  if (opts.buffer.length > MAX_LOGO_BYTES) {
    return { ok: false, error: 'Ukuran gambar melebihi 2 MB.' }
  }

  if (env.STORAGE_PROVIDER === 'r2') {
    return { ok: false, error: 'Storage provider R2 belum dikonfigurasi.' }
  }

  try {
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'tenants', opts.tenantId)
    await fs.mkdir(baseDir, { recursive: true })
    const filename = `${opts.slot}-${randomBasename()}.${ext}`
    await fs.writeFile(path.join(baseDir, filename), opts.buffer)
    return { ok: true, url: `/uploads/tenants/${opts.tenantId}/${filename}` }
  } catch (err) {
    console.error('[saveTenantLogo] failed', err)
    return { ok: false, error: 'Gagal menyimpan gambar.' }
  }
}

export async function deleteLocalTenantLogo(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith('/uploads/tenants/')) return
  try {
    const rel = url.replace(/^\/+/, '')
    await fs.unlink(path.join(process.cwd(), 'public', rel))
  } catch {
    // ignore
  }
}
