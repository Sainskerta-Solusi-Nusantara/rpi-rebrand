import 'server-only'

import { z } from 'zod'
import { generateJson, isAiConfigured } from '@/lib/ai/client'
import {
  scoreApplication,
  type ScreeningResult,
  type ScoringApplication,
  type ScoringJob,
  type ScoringResume,
  type ScoringUser,
} from './screening'

/**
 * AI-backed application screening.
 *
 * Wraps the deterministic heuristic (`scoreApplication`) with a real Claude
 * call when `ANTHROPIC_API_KEY` is set. The heuristic is ALWAYS computed first
 * — it is cheap, deterministic, and provides the breakdown, content tags
 * (skill-cocok / lokasi-cocok / lengkap / …) and matchedSkills the recruiter UI
 * relies on. When AI is available we let Claude produce a holistic 0-100 score
 * plus a human-readable Indonesian `reason`; we then:
 *   - use the AI score as the headline score,
 *   - recompute ONLY the match band tag (match-tinggi/sedang/perlu-tinjauan)
 *     from the AI score so the badge stays consistent,
 *   - keep every other heuristic tag + the breakdown for UI compatibility.
 *
 * Any failure (no key, network, malformed/short response) falls back to the
 * pure heuristic result with `source:'heuristic'` and `reason:null`. Behaviour
 * with no key is therefore identical to before.
 */

export type ScoringInput = {
  application: ScoringApplication
  job: ScoringJob
  user: ScoringUser
  primaryResume: ScoringResume
}

export type AiScreeningResult = ScreeningResult & {
  reason: string | null
  source: 'ai' | 'heuristic'
}

const BAND_TAGS = ['match-tinggi', 'match-sedang', 'perlu-tinjauan'] as const

/** Mirror of the heuristic band thresholds (screening.ts buildTags). */
function bandTag(score: number): (typeof BAND_TAGS)[number] {
  if (score >= 75) return 'match-tinggi'
  if (score >= 50) return 'match-sedang'
  return 'perlu-tinjauan'
}

const aiSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string().trim().min(10).max(1200),
})

const SYSTEM_PROMPT = [
  'Anda adalah perekrut senior yang menilai kecocokan kandidat dengan sebuah lowongan kerja secara objektif dan adil.',
  'Beri skor kecocokan 0-100 (100 = sangat cocok) berdasarkan keterampilan, pengalaman, level, dan lokasi.',
  'Sertakan alasan singkat (1-3 kalimat) dalam Bahasa Indonesia yang menjelaskan kekuatan utama dan gap utama kandidat.',
  'Jangan membuat asumsi diskriminatif (usia, gender, suku, agama). Nilai hanya dari relevansi profesional.',
  'Jawab HANYA dengan satu objek JSON valid berisi kunci: score (angka), reason (teks). Tanpa teks lain, tanpa code fence.',
].join(' ')

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function extractResumeText(content: unknown): {
  skills: string[]
  summary: string
  experienceTitles: string[]
} {
  if (!content || typeof content !== 'object') {
    return { skills: [], summary: '', experienceTitles: [] }
  }
  const c = content as { skills?: unknown; summary?: unknown; experiences?: unknown }
  const skills = Array.isArray(c.skills)
    ? c.skills.filter((s): s is string => typeof s === 'string').slice(0, 40)
    : []
  const experienceTitles = Array.isArray(c.experiences)
    ? c.experiences
        .map((e) => (e && typeof e === 'object' ? asString((e as { title?: unknown }).title) : ''))
        .filter(Boolean)
        .slice(0, 12)
    : []
  return { skills, summary: asString(c.summary), experienceTitles }
}

function buildPrompt(input: ScoringInput): string {
  const { job, user, primaryResume, application } = input
  const resume = extractResumeText(primaryResume?.content)
  const coverLetter = asString(application?.coverLetter).slice(0, 1500)

  return [
    'LOWONGAN',
    `- Judul: ${job?.title ?? '-'}`,
    `- Level: ${job?.experienceLevel ?? '-'}`,
    `- Lokasi: ${job?.location || '-'} (${job?.locationType ?? '-'})`,
    `- Keterampilan dibutuhkan: ${(job?.tags ?? []).join(', ') || '-'}`,
    '',
    'KANDIDAT',
    `- Headline: ${asString(user?.headline) || '-'}`,
    `- Lokasi: ${asString(user?.location) || '-'}`,
    `- Punya CV: ${primaryResume ? 'ya' : 'tidak'}`,
    `- Keterampilan: ${resume.skills.join(', ') || '-'}`,
    `- Riwayat posisi: ${resume.experienceTitles.join('; ') || '-'}`,
    `- Ringkasan: ${resume.summary.slice(0, 800) || '-'}`,
    `- Cover letter: ${coverLetter || '-'}`,
    '',
    'Nilai kecocokan kandidat untuk lowongan ini.',
  ].join('\n')
}

export async function scoreApplicationAI(
  input: ScoringInput,
): Promise<AiScreeningResult> {
  const heuristic = scoreApplication(input)

  if (!isAiConfigured()) {
    return { ...heuristic, reason: null, source: 'heuristic' }
  }

  try {
    const raw = await generateJson<unknown>({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input),
      maxTokens: 512,
      temperature: 0.3,
    })
    const parsed = aiSchema.safeParse(raw)
    if (!parsed.success) {
      return { ...heuristic, reason: null, source: 'heuristic' }
    }

    const score = Math.round(parsed.data.score)
    // Keep all heuristic content tags, but swap the band tag for one derived
    // from the AI score so the badge matches the headline number.
    const contentTags = heuristic.tags.filter(
      (tg) => !BAND_TAGS.includes(tg as (typeof BAND_TAGS)[number]),
    )
    const tags = [bandTag(score), ...contentTags]

    return {
      ...heuristic,
      score,
      tags,
      reason: parsed.data.reason,
      source: 'ai',
    }
  } catch (err) {
    console.error('[screening-ai] falling back to heuristic', err)
    return { ...heuristic, reason: null, source: 'heuristic' }
  }
}
