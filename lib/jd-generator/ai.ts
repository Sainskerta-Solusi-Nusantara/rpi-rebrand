import 'server-only'

import { z } from 'zod'
import {
  EmploymentType,
  ExperienceLevel,
  LocationType,
} from '@prisma/client'
import { generateJson, isAiConfigured } from '@/lib/ai/client'
import {
  generateJobDescription,
  type JdGeneratorInput,
  type JdGeneratorOutput,
} from './generate'

/**
 * AI-backed Job Description generator.
 *
 * Wraps the deterministic template generator (`generateJobDescription`) with a
 * real Claude call when `ANTHROPIC_API_KEY` is set. The output shape is
 * identical (`JdGeneratorOutput`), so the server action, audit log, and form UI
 * need no changes — only the "brain" is upgraded.
 *
 * Resilience: any failure — no key, network error, malformed/short response —
 * silently falls back to the template. The template is also returned verbatim
 * when AI is not configured, so behaviour with no key is unchanged.
 *
 * Returns `{ output, source }` so the caller can record which path produced the
 * text in its audit metadata.
 */

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry-level (fresh graduate / career switcher)',
  JUNIOR: 'Junior (±1 tahun pengalaman)',
  MID: 'Mid-level (±3 tahun pengalaman)',
  SENIOR: 'Senior (±5 tahun pengalaman)',
  LEAD: 'Lead (±7 tahun, memimpin tim/teknis)',
  EXECUTIVE: 'Executive (±10 tahun, level kepemimpinan)',
}

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'penuh waktu',
  PART_TIME: 'paruh waktu',
  CONTRACT: 'kontrak',
  INTERNSHIP: 'magang',
  FREELANCE: 'freelance',
}

const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  ONSITE: 'on-site (di kantor)',
  HYBRID: 'hybrid',
  REMOTE: 'remote',
}

const outputSchema = z.object({
  description: z.string().trim().min(40),
  responsibilities: z.string().trim().min(20),
  requirements: z.string().trim().min(20),
  benefits: z.string().trim().min(10),
})

const SYSTEM_PROMPT = [
  'Anda adalah perekrut senior yang menulis deskripsi lowongan kerja dalam Bahasa Indonesia yang profesional, jelas, dan inklusif.',
  'Tulis konten yang spesifik dan menarik, hindari klise kosong dan jargon berlebihan.',
  'Bagian responsibilities, requirements, dan benefits HARUS berupa daftar dengan setiap baris diawali "- " (tanda hubung lalu spasi).',
  'Bagian description berupa 2-3 paragraf naratif (bukan daftar).',
  'Jawab HANYA dengan satu objek JSON valid berisi kunci: description, responsibilities, requirements, benefits. Tanpa teks lain, tanpa code fence.',
].join(' ')

function buildPrompt(input: JdGeneratorInput): string {
  const tags = input.tags.length > 0 ? input.tags.join(', ') : '(tidak disebutkan)'
  return [
    'Buat draft deskripsi lowongan berdasarkan detail berikut:',
    `- Judul posisi: ${input.title}`,
    `- Level pengalaman: ${LEVEL_LABEL[input.level]}`,
    `- Tipe pekerjaan: ${EMPLOYMENT_LABEL[input.employmentType]}`,
    `- Pengaturan kerja: ${LOCATION_TYPE_LABEL[input.locationType]}`,
    `- Lokasi: ${input.location || '(tidak disebutkan)'}`,
    `- Keterampilan/teknologi (tags): ${tags}`,
    '',
    'Sesuaikan jumlah tahun pengalaman pada requirements dengan level di atas.',
    'Sertakan 5-8 poin responsibilities, 4-6 poin requirements, dan 4-6 poin benefits.',
  ].join('\n')
}

export async function generateJobDescriptionAI(
  input: JdGeneratorInput,
): Promise<{ output: JdGeneratorOutput; source: 'ai' | 'template' }> {
  const template = () => generateJobDescription(input)

  if (!isAiConfigured()) {
    return { output: template(), source: 'template' }
  }

  try {
    const raw = await generateJson<unknown>({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input),
      maxTokens: 2048,
      temperature: 0.7,
    })
    const parsed = outputSchema.safeParse(raw)
    if (!parsed.success) {
      return { output: template(), source: 'template' }
    }
    return { output: parsed.data, source: 'ai' }
  } catch (err) {
    console.error('[jd-generator/ai] falling back to template', err)
    return { output: template(), source: 'template' }
  }
}
