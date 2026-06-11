import 'server-only'

import { z } from 'zod'
import { generateJson, isAiConfigured } from '@/lib/ai/client'

/**
 * AI personalization layer for job recommendations.
 *
 * The deterministic engine (`recommendJobsForUser`) already ranks jobs; this
 * only ADDS a short, personalized "why it fits you" sentence per job via a
 * SINGLE Claude call. It never reorders and never changes the score — the
 * heuristic remains the source of truth for ranking.
 *
 * Returns an empty `reasons` map with `source:'heuristic'` when AI is not
 * configured or the call fails, so callers degrade gracefully.
 *
 * COST NOTE: invoke only behind an explicit user action (the "Jelaskan dengan
 * AI" button), never on page load — the recommendations page renders on every
 * visit.
 */

export type RecProfile = {
  headline: string | null
  location: string | null
  skills: string[]
}

export type RecJobForPrompt = {
  id: string
  title: string
  tags: string[]
  location: string
  locationType: string
  experienceLevel: string
}

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        reason: z.string().trim().min(8).max(240),
      }),
    )
    .max(30),
})

const SYSTEM_PROMPT = [
  'Anda adalah asisten karier yang menjelaskan kecocokan lowongan kepada kandidat secara personal dan jujur.',
  'Untuk SETIAP lowongan yang diberikan, tulis SATU kalimat singkat (maksimal ~25 kata) dalam Bahasa Indonesia yang menjelaskan mengapa lowongan itu cocok untuk kandidat ini, berdasarkan keterampilan, headline, lokasi, dan level.',
  'Spesifik dan konkret — sebut keterampilan/konteks yang relevan; hindari klise kosong.',
  'Jangan membuat asumsi diskriminatif (usia, gender, suku, agama).',
  'Gunakan HANYA id lowongan yang diberikan. Jawab HANYA dengan satu objek JSON valid {"items":[{"id","reason"}]}. Tanpa teks lain, tanpa code fence.',
].join(' ')

function buildPrompt(profile: RecProfile, jobs: RecJobForPrompt[]): string {
  const jobLines = jobs.map(
    (j) =>
      `[id=${j.id}] ${j.title} — keterampilan: ${
        j.tags.join(', ') || '-'
      } — lokasi: ${j.location || '-'} (${j.locationType}) — level: ${j.experienceLevel}`,
  )
  return [
    'KANDIDAT',
    `- Headline: ${profile.headline?.trim() || '-'}`,
    `- Lokasi: ${profile.location?.trim() || '-'}`,
    `- Keterampilan: ${profile.skills.join(', ') || '-'}`,
    '',
    'LOWONGAN (beri satu alasan untuk setiap id):',
    ...jobLines,
  ].join('\n')
}

export async function generateRecommendationReasons(
  profile: RecProfile,
  jobs: RecJobForPrompt[],
): Promise<{ reasons: Record<string, string>; source: 'ai' | 'heuristic' }> {
  if (!isAiConfigured() || jobs.length === 0) {
    return { reasons: {}, source: 'heuristic' }
  }

  try {
    const raw = await generateJson<unknown>({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(profile, jobs),
      maxTokens: 1200,
      temperature: 0.5,
    })
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return { reasons: {}, source: 'heuristic' }
    }

    const allowed = new Set(jobs.map((j) => j.id))
    const reasons: Record<string, string> = {}
    for (const item of parsed.data.items) {
      const reason = item.reason.trim()
      if (allowed.has(item.id) && reason) reasons[item.id] = reason
    }
    // If the model returned nothing usable, treat as a heuristic (no-op) result.
    if (Object.keys(reasons).length === 0) {
      return { reasons: {}, source: 'heuristic' }
    }
    return { reasons, source: 'ai' }
  } catch (err) {
    console.error('[recommendations/ai] falling back to heuristic', err)
    return { reasons: {}, source: 'heuristic' }
  }
}
