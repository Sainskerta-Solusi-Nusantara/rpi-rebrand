'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import {
  generateRecommendationReasons,
  type RecJobForPrompt,
} from './ai'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

const MAX_JOBS = 12

const inputSchema = z.object({
  jobs: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(300),
        tags: z.array(z.string().max(80)).max(40),
        location: z.string().max(200),
        locationType: z.string().max(40),
        experienceLevel: z.string().max(40),
      }),
    )
    .min(1)
    .max(MAX_JOBS),
})

/** Pull lowercase, de-duplicated skills from a resume.content JSON blob. */
function extractSkills(content: unknown): string[] {
  if (!content || typeof content !== 'object') return []
  const c = content as { skills?: unknown }
  if (!Array.isArray(c.skills)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of c.skills) {
    if (typeof raw !== 'string') continue
    const norm = raw.trim()
    const key = norm.toLowerCase()
    if (!norm || seen.has(key)) continue
    seen.add(key)
    out.push(norm)
  }
  return out.slice(0, 40)
}

/**
 * Generate personalized "why it fits you" reasons for the visible top
 * recommendations. On-demand only (the "Jelaskan dengan AI" button). The job
 * list comes from the client (public job data); the candidate profile is read
 * server-side from the authenticated session. Returns an empty map with
 * `source:'heuristic'` when AI is unavailable.
 */
export async function explainMyRecommendations(input: {
  jobs: RecJobForPrompt[]
}): Promise<ActionResult<{ reasons: Record<string, string>; source: 'ai' | 'heuristic' }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk untuk memakai fitur ini.' }
  }
  const userId = session.user.id

  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Data lowongan tidak valid.' }
  }

  try {
    const [user, resume] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { headline: true, location: true },
      }),
      prisma.resume.findFirst({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { content: true },
      }),
    ])

    const result = await generateRecommendationReasons(
      {
        headline: user?.headline ?? null,
        location: user?.location ?? null,
        skills: extractSkills(resume?.content),
      },
      parsed.data.jobs,
    )

    return { ok: true, data: result }
  } catch (err) {
    console.error('[explainMyRecommendations] failed', err)
    return { ok: false, error: 'Gagal membuat penjelasan AI. Coba lagi.' }
  }
}
