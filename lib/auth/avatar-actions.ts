'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  ALLOWED_AVATAR_MIME,
  MAX_AVATAR_BYTES,
  deleteLocalAvatar,
  saveAvatar,
} from '@/lib/storage'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return { ok: false, error: 'Berkas tidak ditemukan.' }
  }
  if (file.size === 0) return { ok: false, error: 'Berkas kosong.' }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Ukuran gambar melebihi 5 MB.' }
  }
  const mime = file.type
  if (!ALLOWED_AVATAR_MIME.includes(mime)) {
    return { ok: false, error: 'Format gambar harus JPEG, PNG, atau WEBP.' }
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const save = await saveAvatar({ userId: session.user.id, buffer: buf, mime })
    if (!save.ok) return { ok: false, error: save.error }

    const prior = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: save.url },
    })

    // Best-effort cleanup of the previous local avatar (do not block on it).
    if (prior?.image && prior.image !== save.url) {
      void deleteLocalAvatar(prior.image)
    }

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.UPDATE,
        resource: 'user.avatar',
        resourceId: session.user.id,
        metadata: { to: save.url },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard/profil')
    return { ok: true, data: { url: save.url } }
  } catch (err) {
    console.error('[uploadAvatar] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  try {
    const prior = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })
    if (!prior?.image) return { ok: true }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    })
    void deleteLocalAvatar(prior.image)

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.UPDATE,
        resource: 'user.avatar',
        resourceId: session.user.id,
        metadata: { from: prior.image, to: null },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard/profil')
    return { ok: true }
  } catch (err) {
    console.error('[removeAvatar] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
