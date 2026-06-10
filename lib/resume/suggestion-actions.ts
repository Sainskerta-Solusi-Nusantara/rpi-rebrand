'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  analyzeResume,
  type AnalysisResult,
  type AnalyzerResume,
} from '@/lib/resume/analyzer'
import { analyzeResumeAI } from '@/lib/resume/analyzer-ai'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

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
  resource: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
  } catch (err) {
    console.error('[resume.suggestion audit] failed', err)
  }
}

/**
 * Pull the saved JSON content + the user's contact info into the
 * loose shape the analyzer expects.
 */
function toAnalyzerInput(
  resume: {
    name: string
    fileUrl: string | null
    content: Prisma.JsonValue | null
  },
  user: { email: string | null; phone: string | null } | null,
): AnalyzerResume {
  const c =
    resume.content && typeof resume.content === 'object'
      ? (resume.content as Record<string, unknown>)
      : {}

  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' ? v : undefined

  return {
    name: resume.name,
    fileUrl: resume.fileUrl,
    summary: str(c.summary),
    experiences: arr(c.experiences).map((e) => {
      const x = (e ?? {}) as Record<string, unknown>
      return {
        title: str(x.title),
        company: str(x.company),
        location: str(x.location),
        startDate: str(x.startDate),
        endDate: str(x.endDate),
        current: typeof x.current === 'boolean' ? x.current : undefined,
        description: str(x.description),
      }
    }),
    educations: arr(c.educations).map((e) => {
      const x = (e ?? {}) as Record<string, unknown>
      return {
        school: str(x.school),
        degree: str(x.degree),
        field: str(x.field),
        startDate: str(x.startDate),
        endDate: str(x.endDate),
        description: str(x.description),
      }
    }),
    skills: arr(c.skills)
      .map((s) => (typeof s === 'string' ? s : ''))
      .filter(Boolean),
    languages: arr(c.languages)
      .map((s) => (typeof s === 'string' ? s : ''))
      .filter(Boolean),
    email: user?.email ?? undefined,
    phone: user?.phone ?? undefined,
    links: [],
  }
}

// ---------------------------------------------------------------------------
// analyzeMyResume
// ---------------------------------------------------------------------------

export async function analyzeMyResume(
  resumeId: string,
): Promise<ActionResult<AnalysisResult>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvMessaging.resumeSuggestion.mustLogin }
  const userId = session.user.id

  if (typeof resumeId !== 'string' || resumeId.length === 0) {
    return { ok: false, error: t.srvMessaging.resumeSuggestion.resumeIdInvalid }
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        userId: true,
        name: true,
        fileUrl: true,
        content: true,
      },
    })
    if (!resume || resume.userId !== userId) {
      return { ok: false, error: t.srvMessaging.resumeSuggestion.resumeNotFound }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    })

    const input = toAnalyzerInput(resume, user)
    // On-demand action — this is the ONLY place we spend Claude tokens. The CV
    // page load stays on the cheap sync heuristic (`analyzeResume`). When no key
    // is configured this is identical to the heuristic path.
    const result = await analyzeResumeAI(input)

    await audit(userId, AuditAction.UPDATE, 'resume.analyzed', resume.id, {
      resumeId: resume.id,
      score: result.score,
      source: result.source ?? 'heuristic',
    })

    return { ok: true, data: result }
  } catch (err) {
    console.error('[analyzeMyResume] failed', err)
    return { ok: false, error: t.srvMessaging.resumeSuggestion.analyzeFailed }
  }
}

// ---------------------------------------------------------------------------
// applySuggestion — auto-fix for supported suggestions
// ---------------------------------------------------------------------------

const TRIM_SUMMARY_MAX = 600

export async function applySuggestion(
  resumeId: string,
  suggestionId: string,
): Promise<ActionResult<AnalysisResult>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvMessaging.resumeSuggestion.mustLogin }
  const userId = session.user.id

  if (typeof resumeId !== 'string' || resumeId.length === 0) {
    return { ok: false, error: t.srvMessaging.resumeSuggestion.resumeIdInvalid }
  }
  if (typeof suggestionId !== 'string' || suggestionId.length === 0) {
    return { ok: false, error: t.srvMessaging.resumeSuggestion.suggestionIdInvalid }
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { id: true, userId: true, name: true, fileUrl: true, content: true },
    })
    if (!resume || resume.userId !== userId) {
      return { ok: false, error: t.srvMessaging.resumeSuggestion.resumeNotFound }
    }

    const content =
      resume.content && typeof resume.content === 'object'
        ? ({ ...(resume.content as Record<string, unknown>) } as Record<string, unknown>)
        : ({} as Record<string, unknown>)

    let changed = false

    // ---- trim-summary ----
    if (suggestionId === 'summary-too-long') {
      const summary = typeof content.summary === 'string' ? content.summary : ''
      if (summary.length > TRIM_SUMMARY_MAX) {
        // Trim to last sentence boundary within limit when possible
        const cut = summary.slice(0, TRIM_SUMMARY_MAX)
        const lastStop = Math.max(
          cut.lastIndexOf('. '),
          cut.lastIndexOf('! '),
          cut.lastIndexOf('? '),
        )
        const trimmed =
          lastStop > TRIM_SUMMARY_MAX * 0.6
            ? cut.slice(0, lastStop + 1)
            : cut.trim() + '…'
        content.summary = trimmed
        changed = true
      }
    }

    // ---- add-skill-<name> ----
    if (suggestionId.startsWith('add-skill-')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true },
      })
      const input = toAnalyzerInput(resume, user)
      const result = analyzeResume(input)
      const target = result.suggestions.find((s) => s.id === suggestionId)
      const skill =
        target?.autoFix?.kind === 'add-skill'
          ? (target.autoFix.payload as { skill?: unknown }).skill
          : undefined
      if (typeof skill === 'string' && skill.trim()) {
        const skills = Array.isArray(content.skills)
          ? ([...(content.skills as unknown[])] as unknown[])
          : []
        const exists = skills.some(
          (s) =>
            typeof s === 'string' &&
            s.trim().toLowerCase() === skill.trim().toLowerCase(),
        )
        if (!exists) {
          skills.push(skill.trim())
          content.skills = skills
          changed = true
        }
      }
    }

    if (!changed) {
      return {
        ok: false,
        error: t.srvMessaging.resumeSuggestion.manualEditRequired,
      }
    }

    await prisma.resume.update({
      where: { id: resume.id },
      data: { content: content as Prisma.InputJsonValue },
    })

    await audit(userId, AuditAction.UPDATE, 'resume.suggestion.applied', resume.id, {
      resumeId: resume.id,
      suggestionId,
    })

    revalidatePath(`/dashboard/cv/${resume.id}`)

    // Recompute analysis after applying
    const refreshed = await prisma.resume.findUnique({
      where: { id: resume.id },
      select: { id: true, userId: true, name: true, fileUrl: true, content: true },
    })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    })
    if (!refreshed) return { ok: false, error: t.srvMessaging.resumeSuggestion.resumeNotFound }
    const newResult = analyzeResume(toAnalyzerInput(refreshed, user))
    return { ok: true, data: newResult }
  } catch (err) {
    console.error('[applySuggestion] failed', err)
    return { ok: false, error: t.srvMessaging.resumeSuggestion.applyFailed }
  }
}
