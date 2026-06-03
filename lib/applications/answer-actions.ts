'use server'

import { headers } from 'next/headers'
import { AuditAction, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { type JobQuestionType } from '@/lib/jobs/question-constants'
import {
  ALLOWED_JOB_ATTACHMENT_MIME,
  MAX_JOB_ATTACHMENT_BYTES,
  saveJobAttachment,
} from '@/lib/storage'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvApplications } from '@/lib/i18n/dictionaries/srv-applications'

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

type AnswerMessages = (typeof srvApplications)['id' | 'en']['answerActions']

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
  m: AnswerMessages
}): { error: string } | { value: string } {
  const { question, m } = opts
  const trimmed = typeof opts.value === 'string' ? opts.value.trim() : ''

  if (question.required && trimmed.length === 0) {
    return { error: m.validateRequired.replace('{label}', question.label) }
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
          error: m.validateShortTooLong.replace('{label}', question.label),
        }
      }
      return { value: trimmed }
    }
    case 'long_text': {
      if (trimmed.length > 5000) {
        return {
          error: m.validateLongTooLong.replace('{label}', question.label),
        }
      }
      return { value: trimmed }
    }
    case 'single_choice': {
      const opts = readOptions(question.options)
      if (!opts.includes(trimmed)) {
        return {
          error: m.validateSingleInvalid.replace('{label}', question.label),
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
          error: m.validateMultiInvalid.replace('{label}', question.label),
        }
      }
      if (!Array.isArray(parsed)) {
        return {
          error: m.validateMultiInvalid.replace('{label}', question.label),
        }
      }
      const cleaned: string[] = []
      const seen = new Set<string>()
      for (const item of parsed) {
        if (typeof item !== 'string') continue
        if (!opts.includes(item)) {
          return {
            error: m.validateMultiChoiceInvalid.replace('{label}', question.label),
          }
        }
        if (seen.has(item)) continue
        seen.add(item)
        cleaned.push(item)
      }
      if (question.required && cleaned.length === 0) {
        return {
          error: m.validateMultiRequired.replace('{label}', question.label),
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
          error: m.validateFileUrlInvalid.replace('{label}', question.label),
        }
      }
      return { value: trimmed }
    }
    case 'yes_no': {
      const v = trimmed.toLowerCase()
      if (v !== 'yes' && v !== 'no') {
        return {
          error: m.validateYesNoInvalid.replace('{label}', question.label),
        }
      }
      return { value: v }
    }
    default:
      return { error: m.validateTypeUnsupported.replace('{label}', question.label) }
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
  const locale = await getServerLocale()
  const m = srvApplications[locale].answerActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const userId = session.user.id

  if (!input.applicationId) {
    return { ok: false, error: m.applicationIdInvalid }
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
      return { ok: false, error: m.applicationNotFound }
    }
    if (application.userId !== userId) {
      return { ok: false, error: m.notOwner }
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
          error: m.questionNotFound,
        }
      }
      const result = validateAnswer({
        question: q,
        value: typeof a.value === 'string' ? a.value : '',
        m,
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
    return { ok: false, error: m.saveFailed }
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
  const locale = await getServerLocale()
  const m = srvApplications[locale].answerActions
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: m.mustLogin }
  }
  const userId = session.user.id

  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return { ok: false, error: m.fileNotFound }
  }
  if (file.size === 0) return { ok: false, error: m.fileEmpty }
  if (file.size > MAX_JOB_ATTACHMENT_BYTES) {
    return { ok: false, error: m.fileTooLarge }
  }
  const mime = file.type
  if (!ALLOWED_JOB_ATTACHMENT_MIME.includes(mime)) {
    return { ok: false, error: m.fileFormatUnsupported }
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const save = await saveJobAttachment({ userId, buffer: buf, mime })
    if (!save.ok) return { ok: false, error: save.error }
    return { ok: true, data: { url: save.url } }
  } catch (err) {
    console.error('[uploadJobAnswerAttachment] failed', err)
    return { ok: false, error: m.uploadFailed }
  }
}
