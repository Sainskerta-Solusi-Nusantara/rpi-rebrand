'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  ALLOWED_RESUME_MIME,
  MAX_RESUME_BYTES,
  deleteLocalResumeFile,
  saveResumeFile,
} from '@/lib/storage'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const MAX_RESUMES_PER_USER = 10

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

// ---------------------------------------------------------------------------
// Resume content schema (builder mode)
// ---------------------------------------------------------------------------

const resumeContentSchema = z
  .object({
    summary: z.string().max(2000).optional(),
    experiences: z
      .array(
        z.object({
          title: z.string().max(120),
          company: z.string().max(120),
          location: z.string().max(120).optional(),
          startDate: z.string().max(20),
          endDate: z.string().max(20).optional(),
          current: z.boolean().optional(),
          description: z.string().max(3000).optional(),
        }),
      )
      .max(20)
      .optional(),
    educations: z
      .array(
        z.object({
          school: z.string().max(120),
          degree: z.string().max(120).optional(),
          field: z.string().max(120).optional(),
          startDate: z.string().max(20),
          endDate: z.string().max(20).optional(),
          description: z.string().max(1000).optional(),
        }),
      )
      .max(10)
      .optional(),
    skills: z.array(z.string().max(60)).max(30).optional(),
    languages: z.array(z.string().max(60)).max(10).optional(),
  })
  .strict()

export type ResumeContent = z.infer<typeof resumeContentSchema>

const nameSchema = z
  .string({ required_error: 'Nama CV wajib diisi' })
  .trim()
  .min(1, 'Nama CV wajib diisi')
  .max(80, 'Nama CV maksimal 80 karakter')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

async function audit(
  userId: string,
  action: AuditAction,
  resourceId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource: 'user.resume',
        resourceId,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
  } catch (err) {
    console.error('[resume audit] failed', err)
  }
}

// ---------------------------------------------------------------------------
// createResume — empty builder-mode resume
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: nameSchema,
  content: resumeContentSchema.optional(),
})

export async function createResume(input: {
  name: string
  content?: ResumeContent
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }

  try {
    const count = await prisma.resume.count({ where: { userId } })
    if (count >= MAX_RESUMES_PER_USER) {
      return {
        ok: false,
        error: `Maksimal ${MAX_RESUMES_PER_USER} CV per akun.`,
      }
    }

    const created = await prisma.resume.create({
      data: {
        userId,
        name: parsed.data.name,
        content: (parsed.data.content ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      select: { id: true },
    })

    await audit(userId, AuditAction.CREATE, created.id, {
      name: parsed.data.name,
    })

    revalidatePath('/dashboard/cv')
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    console.error('[createResume] failed', err)
    return { ok: false, error: 'Gagal membuat CV. Coba lagi.' }
  }
}

// ---------------------------------------------------------------------------
// updateResume — name / content / isPrimary
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.preprocess(emptyToUndefined, nameSchema.optional()),
  content: resumeContentSchema.optional(),
  isPrimary: z.boolean().optional(),
})

export async function updateResume(input: {
  id: string
  name?: string
  content?: ResumeContent
  isPrimary?: boolean
}): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }

  const { id, name, content, isPrimary } = parsed.data

  try {
    const existing = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true, isPrimary: true },
    })
    if (!existing || existing.userId !== userId) {
      return { ok: false, error: 'CV tidak ditemukan.' }
    }

    const data: Prisma.ResumeUpdateInput = {}
    if (name !== undefined) data.name = name
    if (content !== undefined) {
      data.content = content as Prisma.InputJsonValue
    }

    if (isPrimary === true) {
      // Atomic: clear other primaries + set this one in a single transaction.
      await prisma.$transaction([
        prisma.resume.updateMany({
          where: { userId, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        }),
        prisma.resume.update({
          where: { id },
          data: { ...data, isPrimary: true },
        }),
      ])
    } else if (isPrimary === false) {
      await prisma.resume.update({
        where: { id },
        data: { ...data, isPrimary: false },
      })
    } else if (Object.keys(data).length > 0) {
      await prisma.resume.update({ where: { id }, data })
    } else {
      return { ok: true }
    }

    await audit(userId, AuditAction.UPDATE, id, {
      changedName: name !== undefined,
      changedContent: content !== undefined,
      changedPrimary: isPrimary !== undefined,
    })

    revalidatePath('/dashboard/cv')
    revalidatePath(`/dashboard/cv/${id}`)
    return { ok: true }
  } catch (err) {
    console.error('[updateResume] failed', err)
    return { ok: false, error: 'Gagal menyimpan. Coba lagi.' }
  }
}

// ---------------------------------------------------------------------------
// uploadResumeFile — formData: id + file
// ---------------------------------------------------------------------------

export async function uploadResumeFile(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  const id = formData.get('id')
  if (typeof id !== 'string' || id.length === 0) {
    return { ok: false, error: 'ID CV tidak valid.' }
  }
  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return { ok: false, error: 'Berkas tidak ditemukan.' }
  }
  if (file.size === 0) return { ok: false, error: 'Berkas kosong.' }
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, error: 'Ukuran dokumen melebihi 10 MB.' }
  }
  const mime = file.type
  if (!ALLOWED_RESUME_MIME.includes(mime)) {
    return { ok: false, error: 'Format dokumen harus PDF, DOC, atau DOCX.' }
  }

  try {
    const existing = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true, fileUrl: true },
    })
    if (!existing || existing.userId !== userId) {
      return { ok: false, error: 'CV tidak ditemukan.' }
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const save = await saveResumeFile({ userId, buffer: buf, mime })
    if (!save.ok) return { ok: false, error: save.error }

    await prisma.resume.update({
      where: { id },
      data: { fileUrl: save.url },
    })

    if (existing.fileUrl && existing.fileUrl !== save.url) {
      void deleteLocalResumeFile(existing.fileUrl)
    }

    await audit(userId, AuditAction.UPDATE, id, {
      fileUrl: save.url,
      action: 'upload',
    })

    revalidatePath('/dashboard/cv')
    revalidatePath(`/dashboard/cv/${id}`)
    return { ok: true, data: { url: save.url } }
  } catch (err) {
    console.error('[uploadResumeFile] failed', err)
    return { ok: false, error: 'Gagal mengunggah dokumen. Coba lagi.' }
  }
}

// ---------------------------------------------------------------------------
// removeResumeFile — clear fileUrl + delete file
// ---------------------------------------------------------------------------

export async function removeResumeFile(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  if (typeof id !== 'string' || id.length === 0) {
    return { ok: false, error: 'ID CV tidak valid.' }
  }

  try {
    const existing = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true, fileUrl: true },
    })
    if (!existing || existing.userId !== userId) {
      return { ok: false, error: 'CV tidak ditemukan.' }
    }
    if (!existing.fileUrl) return { ok: true }

    await prisma.resume.update({
      where: { id },
      data: { fileUrl: null },
    })
    void deleteLocalResumeFile(existing.fileUrl)

    await audit(userId, AuditAction.UPDATE, id, {
      from: existing.fileUrl,
      to: null,
      action: 'remove-file',
    })

    revalidatePath('/dashboard/cv')
    revalidatePath(`/dashboard/cv/${id}`)
    return { ok: true }
  } catch (err) {
    console.error('[removeResumeFile] failed', err)
    return { ok: false, error: 'Gagal menghapus dokumen. Coba lagi.' }
  }
}

// ---------------------------------------------------------------------------
// deleteResume — full removal + promote oldest as primary
// ---------------------------------------------------------------------------

export async function deleteResume(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  const userId = session.user.id

  if (typeof id !== 'string' || id.length === 0) {
    return { ok: false, error: 'ID CV tidak valid.' }
  }

  try {
    const existing = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true, fileUrl: true, isPrimary: true },
    })
    if (!existing || existing.userId !== userId) {
      return { ok: false, error: 'CV tidak ditemukan.' }
    }

    await prisma.resume.delete({ where: { id } })

    // If the deleted resume was primary, promote the oldest remaining one
    // (by createdAt asc) — sensible because it is likely the user's
    // longest-curated CV.
    let promotedId: string | null = null
    if (existing.isPrimary) {
      const next = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      if (next) {
        await prisma.resume.update({
          where: { id: next.id },
          data: { isPrimary: true },
        })
        promotedId = next.id
      }
    }

    if (existing.fileUrl) {
      void deleteLocalResumeFile(existing.fileUrl)
    }

    await audit(userId, AuditAction.DELETE, id, {
      wasPrimary: existing.isPrimary,
      promotedId,
    })

    revalidatePath('/dashboard/cv')
    return { ok: true }
  } catch (err) {
    console.error('[deleteResume] failed', err)
    return { ok: false, error: 'Gagal menghapus CV. Coba lagi.' }
  }
}
