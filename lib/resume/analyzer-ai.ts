import 'server-only'

import { z } from 'zod'
import { generateJson, isAiConfigured } from '@/lib/ai/client'
import {
  analyzeResume,
  type AnalysisResult,
  type AnalyzerResume,
  type Suggestion,
  type SuggestionCategory,
} from './analyzer'

/**
 * AI-backed resume analyzer.
 *
 * Wraps the deterministic rules engine (`analyzeResume`) with a real Claude call
 * when `ANTHROPIC_API_KEY` is set. The heuristic is ALWAYS computed first — it
 * owns the `score`, the `breakdown` rows, and the `autoFix` suggestions the
 * apply-suggestion action relies on. Claude only ADDS contextual suggestions
 * (phrasing rewrites, content gaps, tailored advice) that regex cannot produce.
 *
 * Deliberately:
 *   - the numeric `score` and `breakdown` stay 100% deterministic (AI does not
 *     move them), so the gauge is reproducible and apply-suggestion math holds;
 *   - AI suggestions are advisory — no `autoFix` — so the UI shows "edit manual".
 *
 * Any failure (no key, network, malformed response) falls back to the pure
 * heuristic result with `source:'heuristic'`. Behaviour with no key is identical
 * to calling `analyzeResume` directly.
 *
 * COST NOTE: only call this behind an explicit user action (the "Analisis ulang"
 * button via `analyzeMyResume`). It must NOT run on every CV page load.
 */

const CATEGORIES: readonly SuggestionCategory[] = [
  'length',
  'phrasing',
  'completeness',
  'skills',
  'achievements',
  'consistency',
  'contact',
]

const MAX_AI_SUGGESTIONS = 6

const aiSchema = z.object({
  suggestions: z
    .array(
      z.object({
        severity: z.enum(['high', 'medium', 'low']),
        category: z.enum([
          'length',
          'phrasing',
          'completeness',
          'skills',
          'achievements',
          'consistency',
          'contact',
        ]),
        title: z.string().trim().min(3).max(120),
        body: z.string().trim().min(10).max(800),
        exampleBefore: z.string().trim().max(400).optional(),
        exampleAfter: z.string().trim().max(400).optional(),
        affectedSection: z.string().trim().max(80).optional(),
      }),
    )
    .max(20),
})

const SYSTEM_PROMPT = [
  'Anda adalah perekrut senior yang memberi saran perbaikan CV (resume) yang konkret, spesifik, dan dapat langsung dieksekusi.',
  'Fokus pada hal yang TIDAK bisa ditangkap aturan sederhana: kualitas narasi, dampak terukur, relevansi pengalaman, framing pencapaian, dan kejelasan ringkasan.',
  'Tulis judul singkat dan body 1-3 kalimat dalam Bahasa Indonesia. Bila relevan, sertakan contoh exampleBefore dan exampleAfter.',
  'Setiap saran harus punya category salah satu dari: length, phrasing, completeness, skills, achievements, consistency, contact.',
  'Jangan membuat asumsi diskriminatif (usia, gender, suku, agama). Nilai hanya dari relevansi profesional.',
  `Beri maksimal ${MAX_AI_SUGGESTIONS} saran paling berdampak. Jangan mengulang hal yang sudah jelas dari aturan dasar.`,
  'Jawab HANYA dengan satu objek JSON valid berbentuk {"suggestions": [...]}. Tanpa teks lain, tanpa code fence.',
].join(' ')

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function buildPrompt(input: AnalyzerResume): string {
  const experiences = (input.experiences ?? [])
    .slice(0, 8)
    .map((e, i) => {
      const head = [asString(e.title), asString(e.company)]
        .filter(Boolean)
        .join(' @ ')
      const desc = asString(e.description).slice(0, 600)
      return `  ${i + 1}. ${head || '(tanpa judul)'}${desc ? `\n     ${desc}` : ''}`
    })
    .join('\n')
  const educations = (input.educations ?? [])
    .slice(0, 5)
    .map((e) =>
      [asString(e.degree), asString(e.field), asString(e.school)]
        .filter(Boolean)
        .join(', '),
    )
    .filter(Boolean)
    .join('; ')
  const skills = (input.skills ?? []).slice(0, 40).join(', ')

  return [
    'CV KANDIDAT',
    `- Nama/judul CV: ${asString(input.name) || '-'}`,
    `- Ringkasan: ${asString(input.summary).slice(0, 800) || '-'}`,
    `- Keterampilan: ${skills || '-'}`,
    `- Pendidikan: ${educations || '-'}`,
    '- Pengalaman:',
    experiences || '  (tidak ada)',
    '',
    'Beri saran perbaikan paling berdampak untuk CV ini.',
  ].join('\n')
}

/** Cheap de-dup: skip an AI suggestion whose title closely echoes a heuristic one. */
function isDuplicate(title: string, existingTitles: Set<string>): boolean {
  const norm = title.trim().toLowerCase()
  if (existingTitles.has(norm)) return true
  for (const t of existingTitles) {
    if (t.includes(norm) || norm.includes(t)) return true
  }
  return false
}

export async function analyzeResumeAI(
  input: AnalyzerResume,
): Promise<AnalysisResult> {
  const base = analyzeResume(input)

  if (!isAiConfigured()) {
    return { ...base, source: 'heuristic' }
  }

  try {
    const raw = await generateJson<unknown>({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input),
      maxTokens: 1024,
      temperature: 0.4,
    })
    const parsed = aiSchema.safeParse(raw)
    if (!parsed.success) {
      return { ...base, source: 'heuristic' }
    }

    const existingTitles = new Set(
      base.suggestions.map((s) => s.title.trim().toLowerCase()),
    )
    const aiSuggestions: Suggestion[] = []
    for (const s of parsed.data.suggestions) {
      if (aiSuggestions.length >= MAX_AI_SUGGESTIONS) break
      if (!CATEGORIES.includes(s.category)) continue
      if (isDuplicate(s.title, existingTitles)) continue
      existingTitles.add(s.title.trim().toLowerCase())
      aiSuggestions.push({
        id: `ai-${aiSuggestions.length}`,
        severity: s.severity,
        category: s.category,
        title: s.title,
        body: s.body,
        exampleBefore: s.exampleBefore,
        exampleAfter: s.exampleAfter,
        affectedSection: s.affectedSection,
        aiGenerated: true,
      })
    }

    return {
      ...base,
      suggestions: [...base.suggestions, ...aiSuggestions],
      source: 'ai',
    }
  } catch (err) {
    console.error('[resume/analyzer-ai] falling back to heuristic', err)
    return { ...base, source: 'heuristic' }
  }
}
