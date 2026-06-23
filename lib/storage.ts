import fs from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
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

// ---------------------------------------------------------------------------
// Storage transport — local filesystem (dev) vs Cloudflare R2 (prod)
//
// Both paths share one logical "key": a slash-joined relative path such as
// `avatars/{userId}/{basename}.jpg`. Local writes it under `public/uploads/`
// (served directly by Next); R2 uploads it under that key and serves it from
// `R2_PUBLIC_URL`. Keeping the key identical across providers means the delete
// helpers can route a stored URL back to the right transport.
// ---------------------------------------------------------------------------

type StoreResult = { ok: true; url: string } | { ok: false; error: string }

const R2_NOT_CONFIGURED = 'Storage provider R2 belum dikonfigurasi.'

let r2Singleton: S3Client | null = null

/**
 * Lazily build the R2 (S3-compatible) client. Returns null when any required
 * R2 env var is missing so callers can surface a clean "belum dikonfigurasi"
 * error instead of crashing — mirrors the graceful-degradation pattern used by
 * the AI and email layers.
 */
function r2Client(): S3Client | null {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME ||
    !env.R2_PUBLIC_URL
  ) {
    return null
  }
  if (!r2Singleton) {
    r2Singleton = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return r2Singleton
}

function r2PublicUrl(key: string): string {
  // env.R2_PUBLIC_URL is guaranteed present when r2Client() is non-null.
  return `${(env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')}/${key}`
}

/**
 * Derive the R2 object key from a stored public URL, scoped to `prefix` (e.g.
 * `avatars/`). Returns null when the URL is not an R2 URL under that prefix —
 * the guard that keeps deletes from straying outside their own namespace.
 */
export function r2KeyFromPublicUrl(
  url: string,
  prefix: string,
): string | null {
  if (!env.R2_PUBLIC_URL) return null
  const base = `${env.R2_PUBLIC_URL.replace(/\/+$/, '')}/`
  if (!url.startsWith(base)) return null
  const key = url.slice(base.length)
  return key.startsWith(prefix) ? key : null
}

/**
 * Persist `buffer` at the logical `key` using the configured provider and
 * return a servable URL. Validation (mime, size) is the caller's job; this
 * only moves bytes.
 */
async function storeFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<StoreResult> {
  if (env.STORAGE_PROVIDER === 'r2') {
    const client = r2Client()
    if (!client || !env.R2_BUCKET_NAME) {
      return { ok: false, error: R2_NOT_CONFIGURED }
    }
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          // Random basenames make every object immutable; cache hard.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
      return { ok: true, url: r2PublicUrl(key) }
    } catch (err) {
      console.error('[storeFile:r2] failed', err)
      return { ok: false, error: 'Gagal mengunggah berkas ke penyimpanan.' }
    }
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    return { ok: true, url: `/uploads/${key}` }
  } catch (err) {
    console.error('[storeFile:local] failed', err)
    return { ok: false, error: 'Gagal menyimpan berkas.' }
  }
}

/**
 * Best-effort delete of a previously stored file, scoped to `prefix`. Routes a
 * local `/uploads/{prefix}...` URL to the filesystem and an R2 public URL to
 * the bucket; ignores anything else (already gone, external, or unknown).
 */
async function removeFile(
  url: string | null | undefined,
  prefix: string,
): Promise<void> {
  if (!url) return

  if (url.startsWith(`/uploads/${prefix}`)) {
    try {
      const rel = url.replace(/^\/+/, '')
      await fs.unlink(path.join(process.cwd(), 'public', rel))
    } catch {
      // Ignore — the file may already be gone.
    }
    return
  }

  const key = r2KeyFromPublicUrl(url, prefix)
  if (!key) return
  const client = r2Client()
  if (!client || !env.R2_BUCKET_NAME) return
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
    )
  } catch (err) {
    console.error('[removeFile:r2] failed', err)
  }
}

/**
 * Save an avatar image and return a servable URL. Routes through the configured
 * provider: local writes under `public/uploads/avatars/{userId}/` (served
 * directly by Next), R2 uploads under `avatars/{userId}/…` and serves from
 * `R2_PUBLIC_URL`.
 */
export async function saveAvatar(opts: {
  userId: string
  buffer: Buffer
  mime: string
}): Promise<StoreResult> {
  const ext = extForMime(opts.mime)
  if (!ext) return { ok: false, error: 'Format gambar tidak didukung.' }
  if (opts.buffer.length > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Ukuran gambar melebihi 5 MB.' }
  }

  const key = `avatars/${opts.userId}/${randomBasename()}.${ext}`
  return storeFile(key, opts.buffer, opts.mime)
}

/**
 * Best-effort cleanup of a previously stored avatar (local file or R2 object).
 * Silently ignores external or unknown URLs.
 */
export async function deleteLocalAvatar(url: string | null | undefined): Promise<void> {
  await removeFile(url, 'avatars/')
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
}): Promise<StoreResult> {
  const ext = logoExtForMime(opts.mime)
  if (!ext) return { ok: false, error: 'Format gambar tidak didukung.' }
  if (opts.buffer.length > MAX_LOGO_BYTES) {
    return { ok: false, error: 'Ukuran gambar melebihi 2 MB.' }
  }

  const key = `tenants/${opts.tenantId}/${opts.slot}-${randomBasename()}.${ext}`
  return storeFile(key, opts.buffer, opts.mime)
}

export async function deleteLocalTenantLogo(url: string | null | undefined): Promise<void> {
  await removeFile(url, 'tenants/')
}

// ---------------------------------------------------------------------------
// Resumes (CV)
// ---------------------------------------------------------------------------

const RESUME_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
}

export const ALLOWED_RESUME_MIME = Object.keys(RESUME_MIME_TO_EXT)
export const MAX_RESUME_BYTES = 10 * 1024 * 1024 // 10 MB

export function resumeExtForMime(mime: string): string | null {
  return RESUME_MIME_TO_EXT[mime] ?? null
}

/**
 * Save a resume document (PDF/DOC/DOCX) and return a servable URL. Local writes
 * under `public/uploads/resumes/{userId}/`; R2 uploads under
 * `resumes/{userId}/…` and serves from `R2_PUBLIC_URL`.
 */
export async function saveResumeFile(opts: {
  userId: string
  buffer: Buffer
  mime: string
}): Promise<StoreResult> {
  const ext = resumeExtForMime(opts.mime)
  if (!ext) return { ok: false, error: 'Format dokumen tidak didukung.' }
  if (opts.buffer.length > MAX_RESUME_BYTES) {
    return { ok: false, error: 'Ukuran dokumen melebihi 10 MB.' }
  }

  const key = `resumes/${opts.userId}/${randomBasename()}.${ext}`
  return storeFile(key, opts.buffer, opts.mime)
}

/**
 * Best-effort cleanup of a previously stored resume file (local file or R2
 * object). Silently ignores external or unknown URLs.
 */
export async function deleteLocalResumeFile(
  url: string | null | undefined,
): Promise<void> {
  await removeFile(url, 'resumes/')
}

// ---------------------------------------------------------------------------
// Job application attachments (file_url answers to custom questions)
// ---------------------------------------------------------------------------

const ATTACHMENT_MIME_TO_EXT: Record<string, string> = {
  ...RESUME_MIME_TO_EXT,
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/plain': 'txt',
}

export const ALLOWED_JOB_ATTACHMENT_MIME = Object.keys(ATTACHMENT_MIME_TO_EXT)
export const MAX_JOB_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB

export function jobAttachmentExtForMime(mime: string): string | null {
  return ATTACHMENT_MIME_TO_EXT[mime] ?? null
}

/**
 * Save a generic attachment uploaded by a candidate as an answer to a
 * `file_url` custom job question. Local writes under
 * `public/uploads/job-attachments/{userId}/`; R2 uploads under
 * `job-attachments/{userId}/…` and serves from `R2_PUBLIC_URL`.
 */
export async function saveJobAttachment(opts: {
  userId: string
  buffer: Buffer
  mime: string
}): Promise<StoreResult> {
  const ext = jobAttachmentExtForMime(opts.mime)
  if (!ext) return { ok: false, error: 'Format berkas tidak didukung.' }
  if (opts.buffer.length > MAX_JOB_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Ukuran berkas melebihi 10 MB.' }
  }

  const key = `job-attachments/${opts.userId}/${randomBasename()}.${ext}`
  return storeFile(key, opts.buffer, opts.mime)
}
