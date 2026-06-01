'use server'

import { headers } from 'next/headers'
import { AuditAction, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { type JobQuestionType } from '@/lib/jobs/question-actions'
import {
  ALLOWED_JOB_ATTACHMENT_MIME,
  MAX_JOB_ATTACHMENT_BYTES,
  saveJobAttachment,
} from '@/lib/storage'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export type AnswerInput = {
  questionId: string
  value: string
}

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

function readOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string') out.push(item)
  }
  return out
}

/**
 * Validate one (questionId,value) pair against the canonical question type
 * rules. Returns either an `error` description (with the offending questionId)
 * or the normalised value to persist.
 */
function validateAnswer(opts: {
  question: {
    id: string
    label: string
    type: string
    required: boolean
    options: unknown
  }
  value: string
}): { error: string } | { value: string } {
  const { question } = opts
  const trimmed = typeof opts.value === 'string' ? opts.value.trim() : ''

  if (question.required && trimmed.length === 0) {
    return { error: `Pertanyaan "${question.label}" wajib diisi.` }
  }
  // Optional + empty → store empty string (acts as "no answer"). We still
  // persist the row so audit trails remain consistent per question shown.
  if (!question.required && trimmed.length === 0) {
    return { value: '' }
  }

  const type = question.type as JobQuestionType

  switch (type) {
    case 'short_text': {
      if (trimmed.length > 500) {
        return {
          error: `Jawaban untuk "${question.label}" terlalu panjang (maks 500 karakter).`,
        }
      }
      return { value: trimmed }
    }
    case 'long_text': {
      if (trimmed.length > 5000) {
        return {
          error: `Jawaban untuk "${question.label}" terlalu panjang (maks 5000 karakter).`,
        }
      }
      return { value: trimmed }
    }
    case 'single_choice': {
      const opts = readOptions(question.options)
      if (!opts.includes(trimmed)) {
        return {
          error: `Pilihan untuk "${question.label}" tidak valid.`,
        }
      }
      return { value: trimmed }
    }
    case 'multi_choice': {
      const opts = readOptions(question.options)
      let parsed: unknown
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        return {
          error: `Jawaban untuk "${question.label}" tidak valid.`,
        }
      }
      if (!Array.isArray(parsed)) {
        return {
          error: `Jawaban untuk "${question.label}" tidak valid.`,
        }
      }
      const cleaned: string[] = []
      const seen = new Set<string>()
      for (const item of parsed) {
        if (typeof item !== 'string') continue
        if (!opts.includes(item)) {
          return {
            error: `Pilihan untuk "${question.label}" tidak valid.`,
          }
        }
        if (seen.has(item)) continue
        seen.add(item)
        cleaned.push(item)
      }
      if (question.required && cleaned.length === 0) {
        return {
          error: `Pertanyaan "${question.label}" wajib diisi.`,
        }
      }
      return { value: JSON.stringify(cleaned) }
    }
    case 'file_url': {
      // Validate as a relative or absolute URL we'd actually serve. Allow our
      // own /uploads/* paths (saveResumeFile output) plus http(s) URLs.
      if (
        !/^(https?:\/\/|\/uploads\/)/i.test(trimmed) ||
        trimmed.length > 1000
      ) {
        return {
          error: `URL berkas untuk "${question.label}" tidak valid.`,
        }
      }
      return { value: trimmed }
    }
    case 'yes_no': {
      const v = trimmed.toLowerCase()
      if (v !== 'yes' && v !== 'no') {
        return {
          error: `Jawaban untuk "${question.label}" harus "yes" atau "no".`,
        }
      }
      return { value: v }
    }
    default:
      return { error: `Tipe pertanyaan tidak didukung pada "${question.label}".` }
  }
}

/**
 * Persist a batch of candidate answers for an application owned by the signed
 * in user. Validates each (question, value) pair against the question's stored
 * type/options before upserting in a single transaction so the page only sees
 * a consistent set.
 *
 * Required-field enforcement: this helper validates per-answer required-ness
 * against the answers explicitly provided. Callers that need to refuse the
 * whole submission when *unanswered* required questions exist should pre-fetch
 * the question list (see `getJobQuestions`) and merge defaults to empty before
 * calling.
 */
export async function saveApplicationAnswers(input: {
  applicationId: string
  answers: AnswerInput[]
}): Promise<ActionResult<{ saved: number }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const userId = session.user.id

  if (!input.applicationId) {
    return { ok: false, error: 'ID lamaran tidak valid.' }
  }
  const answers = Array.isArray(input.answers) ? input.answers : []
  if (answers.length === 0) {
    return { ok: true, data: { saved: 0 } }
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        jobId: true,
      },
    })
    if (!application) {
      return { ok: false, error: 'Lamaran tidak ditemukan.' }
    }
    if (application.userId !== userId) {
      return { ok: false, error: 'Anda tidak berhak mengubah lamaran ini.' }
    }

    // Pull all questions for the job once; we'll filter to the supplied IDs
    // below and reject unknown ones.
    const questions = await prisma.jobQuestion.findMany({
      where: { jobId: application.jobId },
      select: {
        id: true,
        label: true,
        type: true,
        required: true,
        options: true,
      },
    })
    const byId = new Map(questions.map((q) => [q.id, q]))

    const normalised: Array<{ questionId: string; value: string }> = []
    for (const a of answers) {
      if (!a || typeof a.questionId !== 'string') continue
      const q = byId.get(a.questionId)
      if (!q) {
        return {
          ok: false,
          error: 'Pertanyaan tidak ditemukan untuk lowongan ini.',
        }
      }
      const result = validateAnswer({
        question: q,
        value: typeof a.value === 'string' ? a.value : '',
      })
      if ('error' in result) {
        return { ok: false, error: result.error }
      }
      normalised.push({ questionId: q.id, value: result.value })
    }

    if (normalised.length === 0) {
      return { ok: true, data: { saved: 0 } }
    }

    await prisma.$transaction(
      normalised.map((n) =>
        prisma.applicationAnswer.upsert({
          where: {
            applicationId_questionId: {
              applicationId: application.id,
              questionId: n.questionId,
            },
          },
          create: {
            applicationId: application.id,
            questionId: n.questionId,
            value: n.value,
          },
          update: { value: n.value },
        }),
      ),
    )

    const meta = getRequestMeta()
    await prisma.auditLog
      .create({
        data: {
          tenantId: application.tenantId,
          userId,
          action: AuditAction.CREATE,
          resource: 'application.answer',
          resourceId: application.id,
          metadata: {
            jobId: application.jobId,
            count: normalised.length,
            questionIds: normalised.map((n) => n.questionId),
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch((err) => {
        console.error('[saveApplicationAnswers audit] failed', err)
      })

    return { ok: true, data: { saved: normalised.length } }
  } catch (err) {
    console.error('[saveApplicationAnswers] failed', err)
    return { ok: false, error: 'Gagal menyimpan jawaban. Coba lagi.' }
  }
}

/**
 * Upload an attachment for a `file_url` answer. Returns the URL to embed back
 * into the corresponding answer value. The caller (apply modal) is expected
 * to invoke `submitApplication` with the returned URL as the answer value.
 */
export async function uploadJobAnswerAttachment(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const userId = session.user.id

  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return { ok: false, error: 'Berkas tidak ditemukan.' }
  }
  if (file.size === 0) return { ok: false, error: 'Berkas kosong.' }
  if (file.size > MAX_JOB_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Ukuran berkas melebihi 10 MB.' }
  }
  const mime = file.type
  if (!ALLOWED_JOB_ATTACHMENT_MIME.includes(mime)) {
    return { ok: false, error: 'Format berkas tidak didukung.' }
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const save = await saveJobAttachment({ userId, buffer: buf, mime })
    if (!save.ok) return { ok: false, error: save.error }
    return { ok: true, data: { url: save.url } }
  } catch (err) {
    console.error('[uploadJobAnswerAttachment] failed', err)
    return { ok: false, error: 'Gagal mengunggah berkas. Coba lagi.' }
  }
}
