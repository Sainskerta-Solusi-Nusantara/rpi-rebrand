/**
 * Match Scorer — rules-based AI candidate-job match scorer.
 *
 * Pure deterministic scoring of an Application against its Job, optionally
 * enriched with the candidate's primary Resume + User profile. No LLM calls,
 * no external HTTP, no new dependencies. Output is in [0, 100] and decomposes
 * into 6 weighted dimensions whose maxima sum to exactly 100:
 *
 *   1. Keyword overlap     (25) — tokens shared between job text and resume.
 *   2. Skills coverage     (25) — tech keywords required by job vs. present.
 *   3. Location fit        (15) — remote, exact, same-province, or far.
 *   4. Experience fit      (20) — candidate years vs. required years/level.
 *   5. Employment fit      (10) — employment-type alignment.
 *   6. Education fit       ( 5) — degree level alignment.
 *
 * Why these weights? Recruiters consistently rank skill + content overlap as
 * the strongest signal of fit; the two are split 25/25 so that a candidate
 * who has the tech stack (skills) but whose resume narrative is thin (low
 * keyword overlap), or vice-versa, lands in the "partial match" band rather
 * than the top. Experience is the next-most-actionable signal (20). Location
 * is meaningful (15) because most recruiters still prefer same-province or
 * remote candidates. Employment type (10) catches contract-vs-FT mismatches.
 * Education (5) is a tie-breaker rather than a gate — most roles tolerate
 * skill-equivalent education.
 *
 * Outputs are language-neutral (the breakdown labels live in the UI), but
 * `notes` is Indonesian, intended to be surfaced verbatim under the score
 * card.
 */

import type {
  EmploymentType,
  ExperienceLevel,
  LocationType,
} from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MatchDimension = {
  score: number
  max: number
}

export type KeywordOverlapDim = MatchDimension & {
  matchedKeywords: string[]
  missedKeywords: string[]
}
export type SkillsCoverageDim = MatchDimension & {
  present: string[]
  missing: string[]
}
export type LocationFitDim = MatchDimension & {
  candidateLocation?: string
  jobLocation?: string
  note: string
}
export type ExperienceFitDim = MatchDimension & {
  candidateYears: number
  requiredYears?: number
  note: string
}
export type EmploymentFitDim = MatchDimension & { note: string }
export type EducationFitDim = MatchDimension & { note: string }

export type MatchBreakdown = {
  keywordOverlap: KeywordOverlapDim
  skillsCoverage: SkillsCoverageDim
  locationFit: LocationFitDim
  experienceFit: ExperienceFitDim
  employmentFit: EmploymentFitDim
  educationFit: EducationFitDim
}

export type MatchResult = {
  score: number
  breakdown: MatchBreakdown
  tags: string[]
  notes: string[]
  /** Holistic AI reason for the headline score; null on the heuristic path.
   *  Set by `scoreApplicationToJobAI` (lib/match/match-scorer-ai.ts). */
  reason?: string | null
  /** Which engine produced the headline score. Absent ⇒ heuristic, for
   *  backward compatibility with callers that predate the AI augmentation. */
  source?: 'ai' | 'heuristic'
}

export type MatchApplication = {
  coverLetter?: string | null
} | null | undefined

export type MatchJob = {
  title: string
  description: string
  requirements?: string | null
  employmentType: EmploymentType
  experienceLevel: ExperienceLevel
  location: string
  locationType: LocationType
  tags?: string[]
} | null | undefined

export type MatchUser = {
  headline?: string | null
  location?: string | null
} | null | undefined

export type MatchResume = {
  fileUrl?: string | null
  content?: unknown
} | null | undefined

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WEIGHTS = {
  keywordOverlap: 25,
  skillsCoverage: 25,
  locationFit: 15,
  experienceFit: 20,
  employmentFit: 10,
  educationFit: 5,
} as const

const STOPWORDS = new Set([
  'dan',
  'atau',
  'untuk',
  'dengan',
  'dari',
  'yang',
  'di',
  'ke',
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'with',
  // Add a few more high-frequency tokens that would otherwise dominate
  // overlap counts in JD copy.
  'pada',
  'oleh',
  'akan',
  'adalah',
  'tidak',
  'is',
  'are',
  'be',
  'of',
  'in',
  'on',
  'to',
])

/**
 * Built-in tech / methodology keyword taxonomy. Limited deliberately — we
 * want a high-precision signal that "the candidate has the tech we asked
 * for", not a fuzzy NLP topic model. Aliases (e.g. "k8s" ↔ "kubernetes")
 * are normalized via `SKILL_ALIASES` below before matching.
 */
const TECH_KEYWORDS = [
  'react',
  'vue',
  'next.js',
  'node',
  'python',
  'go',
  'java',
  'typescript',
  'javascript',
  'aws',
  'gcp',
  'azure',
  'docker',
  'kubernetes',
  'k8s',
  'sql',
  'postgres',
  'mongodb',
  'redis',
  'rust',
  'elixir',
  'graphql',
  'rest',
  'api',
  'ci/cd',
  'git',
  'agile',
  'scrum',
  'figma',
  'tableau',
] as const

const SKILL_ALIASES: Record<string, string> = {
  k8s: 'kubernetes',
  'next.js': 'next.js',
  nextjs: 'next.js',
  postgresql: 'postgres',
  'node.js': 'node',
  nodejs: 'node',
  golang: 'go',
}

const LEVEL_TO_YEARS: Record<ExperienceLevel, number> = {
  ENTRY: 0,
  JUNIOR: 1,
  MID: 3,
  SENIOR: 5,
  LEAD: 8,
  EXECUTIVE: 10,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  if (!text) return []
  const out: string[] = []
  const seen = new Set<string>()
  // Split on whitespace + most punctuation but keep '.', '+', '#' so we can
  // pick up things like "next.js", "c++", "c#" via the keyword matcher even
  // though this generic tokenizer doesn't lookup taxonomy.
  for (const raw of text.toLowerCase().split(/[^a-z0-9.+#/-]+/)) {
    const tok = raw.replace(/^[-.+#/]+|[-.+#/]+$/g, '').trim()
    if (tok.length < 3) continue
    if (STOPWORDS.has(tok)) continue
    if (seen.has(tok)) continue
    seen.add(tok)
    out.push(tok)
  }
  return out
}

function normalizeSkill(raw: string): string {
  const lower = raw.trim().toLowerCase()
  return SKILL_ALIASES[lower] ?? lower
}

type ResumeContent = {
  summary?: unknown
  skills?: unknown
  experiences?: unknown
  educations?: unknown
}

type ResumeExperience = {
  title?: unknown
  company?: unknown
  description?: unknown
  startDate?: unknown
  endDate?: unknown
  current?: unknown
}

type ResumeEducation = {
  degree?: unknown
  field?: unknown
  school?: unknown
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x === 'string' && x.trim()) out.push(x.trim())
  }
  return out
}

function readResume(resume: MatchResume): {
  summary: string
  skills: string[]
  experiences: ResumeExperience[]
  educations: ResumeEducation[]
} {
  if (!resume?.content || typeof resume.content !== 'object') {
    return { summary: '', skills: [], experiences: [], educations: [] }
  }
  const c = resume.content as ResumeContent
  return {
    summary: asString(c.summary),
    skills: asStringArray(c.skills),
    experiences: Array.isArray(c.experiences)
      ? (c.experiences as ResumeExperience[]).filter(
          (e) => e && typeof e === 'object',
        )
      : [],
    educations: Array.isArray(c.educations)
      ? (c.educations as ResumeEducation[]).filter(
          (e) => e && typeof e === 'object',
        )
      : [],
  }
}

/**
 * Compute total years of experience from a list of resume experiences. Sums
 * each (endDate - startDate) span — overlapping roles are double-counted
 * which is OK for the bands we use (we cap at 60).
 */
function computeCandidateYears(experiences: ResumeExperience[]): number {
  if (experiences.length === 0) return 0
  let totalMs = 0
  const now = Date.now()
  for (const exp of experiences) {
    const startRaw = asString(exp.startDate)
    if (!startRaw) continue
    const start = parseLooseDate(startRaw)
    if (!start) continue
    let end: number | null = null
    if (exp.current === true) {
      end = now
    } else {
      const endRaw = asString(exp.endDate)
      const parsed = parseLooseDate(endRaw)
      end = parsed ?? null
    }
    if (end === null || end <= start) continue
    totalMs += end - start
  }
  const years = totalMs / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(0, Math.min(60, Math.round(years)))
}

function parseLooseDate(s: string): number | null {
  if (!s) return null
  const normalized = /^\d{4}$/.test(s) ? `${s}-01-01` : s
  const t = new Date(normalized).getTime()
  return Number.isFinite(t) ? t : null
}

/** Try to extract "N tahun" / "N years" from job requirements; returns null if absent. */
function extractRequiredYears(text: string): number | null {
  if (!text) return null
  const lower = text.toLowerCase()
  const re = /(\d+)\s*(?:\+)?\s*(?:tahun|years|year|thn)/g
  let best: number | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(lower)) !== null) {
    const n = Number(m[1])
    if (Number.isFinite(n) && n >= 0 && n <= 40) {
      if (best === null || n < best) best = n
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Per-dimension scorers
// ---------------------------------------------------------------------------

function scoreKeywordOverlap(
  job: NonNullable<MatchJob>,
  candidateText: string,
): KeywordOverlapDim {
  const jobText =
    [job.description ?? '', job.requirements ?? ''].join(' ') +
    ' ' +
    (job.tags ?? []).join(' ')
  const required = tokenize(jobText)
  if (required.length === 0) {
    return {
      score: WEIGHTS.keywordOverlap,
      max: WEIGHTS.keywordOverlap,
      matchedKeywords: [],
      missedKeywords: [],
    }
  }
  const candidateTokens = new Set(tokenize(candidateText))
  const matched: string[] = []
  const missed: string[] = []
  for (const tok of required) {
    if (candidateTokens.has(tok)) matched.push(tok)
    else missed.push(tok)
  }
  // Ratio of required-token coverage. >50% maps to full points; pro-rate
  // linearly below.
  const ratio = matched.length / required.length
  let score: number
  if (ratio >= 0.5) {
    score = WEIGHTS.keywordOverlap
  } else {
    // 0..0.5 -> 0..WEIGHTS.keywordOverlap
    score = Math.round(WEIGHTS.keywordOverlap * (ratio / 0.5))
  }
  return {
    score,
    max: WEIGHTS.keywordOverlap,
    matchedKeywords: matched.slice(0, 10),
    missedKeywords: missed.slice(0, 10),
  }
}

function scoreSkillsCoverage(
  job: NonNullable<MatchJob>,
  resumeSkills: string[],
  candidateText: string,
): SkillsCoverageDim {
  const haystack = [
    job.title,
    job.description,
    job.requirements ?? '',
    (job.tags ?? []).join(' '),
  ]
    .join(' ')
    .toLowerCase()
  const required: string[] = []
  for (const kw of TECH_KEYWORDS) {
    // Use a tolerant substring check — "ci/cd" and "k8s" don't word-boundary
    // well, so we accept any literal substring.
    if (haystack.includes(kw)) required.push(kw)
  }
  // Always normalize via aliases so e.g. "K8s" in JD matches "Kubernetes" in
  // resume.
  const requiredSet = new Set(required.map(normalizeSkill))
  if (requiredSet.size === 0) {
    return {
      score: Math.round(WEIGHTS.skillsCoverage * 0.6),
      max: WEIGHTS.skillsCoverage,
      present: [],
      missing: [],
    }
  }

  const candidateSkillSet = new Set(
    resumeSkills.map((s) => normalizeSkill(s)),
  )
  const candidateLower = candidateText.toLowerCase()
  const present: string[] = []
  const missing: string[] = []
  for (const skill of requiredSet) {
    const inSkills = candidateSkillSet.has(skill)
    const inText = candidateLower.includes(skill)
    if (inSkills || inText) present.push(skill)
    else missing.push(skill)
  }
  const ratio = present.length / requiredSet.size
  const score = Math.round(WEIGHTS.skillsCoverage * ratio)
  return {
    score,
    max: WEIGHTS.skillsCoverage,
    present,
    missing,
  }
}

function inferProvince(loc: string): string {
  // Indonesian addresses are typically formatted "City, Province" — take
  // the trailing comma-separated chunk. This is intentionally crude.
  const parts = loc.split(',').map((p) => p.trim().toLowerCase())
  return parts[parts.length - 1] ?? ''
}

function scoreLocationFit(
  job: NonNullable<MatchJob>,
  candidateLocation: string | null | undefined,
): LocationFitDim {
  const max = WEIGHTS.locationFit
  const jobLoc = (job.location ?? '').trim()
  const cLoc = (candidateLocation ?? '').trim()
  if (job.locationType === 'REMOTE') {
    return {
      score: max,
      max,
      candidateLocation: cLoc || undefined,
      jobLocation: jobLoc || undefined,
      note: 'Pekerjaan ini remote-friendly.',
    }
  }
  if (!cLoc || !jobLoc) {
    return {
      score: Math.round(max * 0.33),
      max,
      candidateLocation: cLoc || undefined,
      jobLocation: jobLoc || undefined,
      note: 'Lokasi kandidat tidak tersedia.',
    }
  }
  const cL = cLoc.toLowerCase()
  const jL = jobLoc.toLowerCase()
  if (cL === jL || cL.includes(jL) || jL.includes(cL)) {
    return {
      score: max,
      max,
      candidateLocation: cLoc,
      jobLocation: jobLoc,
      note: `Lokasi ${cLoc} cocok dengan posisi ${jobLoc}.`,
    }
  }
  // Same-province fallback.
  const cProvince = inferProvince(cLoc)
  const jProvince = inferProvince(jobLoc)
  if (cProvince && jProvince && cProvince === jProvince) {
    return {
      score: Math.round(max * (10 / 15)),
      max,
      candidateLocation: cLoc,
      jobLocation: jobLoc,
      note: `Lokasi ${cLoc} berada di provinsi yang sama dengan posisi ${jobLoc}.`,
    }
  }
  return {
    score: Math.round(max * (5 / 15)),
    max,
    candidateLocation: cLoc,
    jobLocation: jobLoc,
    note: `Lokasi ${cLoc} berbeda dengan posisi ${jobLoc}.`,
  }
}

function scoreExperienceFit(
  job: NonNullable<MatchJob>,
  candidateYears: number,
): { dim: ExperienceFitDim; overqualified: boolean; junior: boolean } {
  const max = WEIGHTS.experienceFit
  const fromText =
    extractRequiredYears(job.requirements ?? '') ??
    extractRequiredYears(job.description ?? '')
  const required = fromText ?? LEVEL_TO_YEARS[job.experienceLevel]
  let score: number
  let overqualified = false
  let junior = false
  if (candidateYears >= required && candidateYears <= required + 3) {
    score = max
  } else if (candidateYears > required + 3) {
    score = Math.round(max * (12 / 20))
    overqualified = true
  } else if (candidateYears >= required - 1 && candidateYears < required) {
    score = Math.round(max * (14 / 20))
    junior = true
  } else {
    score = Math.round(max * (5 / 20))
  }
  return {
    dim: {
      score,
      max,
      candidateYears,
      requiredYears: required,
      note: `Pengalaman ${candidateYears} tahun ${
        candidateYears >= required ? 'memenuhi' : 'masih di bawah'
      } kebutuhan ${required} tahun.`,
    },
    overqualified,
    junior,
  }
}

function scoreEmploymentFit(
  job: NonNullable<MatchJob>,
  resumeContent: unknown,
): EmploymentFitDim {
  const max = WEIGHTS.employmentFit
  // Resume content may store an optional preference. We accept either a
  // top-level string `preferredEmployment` or an array `employmentPreferences`.
  let preferred: string | string[] | null = null
  if (resumeContent && typeof resumeContent === 'object') {
    const c = resumeContent as Record<string, unknown>
    if (typeof c.preferredEmployment === 'string') {
      preferred = c.preferredEmployment
    } else if (Array.isArray(c.employmentPreferences)) {
      preferred = c.employmentPreferences.filter(
        (x): x is string => typeof x === 'string',
      )
    }
  }
  if (!preferred || (Array.isArray(preferred) && preferred.length === 0)) {
    return {
      score: Math.round(max * 0.7),
      max,
      note: 'Preferensi tipe kerja kandidat tidak tersedia.',
    }
  }
  const wanted = Array.isArray(preferred)
    ? preferred.map((s) => s.toLowerCase())
    : [preferred.toLowerCase()]
  const jobType = job.employmentType.toLowerCase()
  // Accept either the enum name (`full_time`) or human form (`full time`).
  const normalized = wanted.map((w) => w.replace(/[\s-]+/g, '_'))
  if (normalized.includes(jobType)) {
    return {
      score: max,
      max,
      note: `Tipe kerja ${jobType} sesuai dengan preferensi kandidat.`,
    }
  }
  return {
    score: Math.round(max * 0.3),
    max,
    note: `Tipe kerja ${jobType} berbeda dengan preferensi kandidat.`,
  }
}

function scoreEducationFit(
  job: NonNullable<MatchJob>,
  educations: ResumeEducation[],
): EducationFitDim {
  const max = WEIGHTS.educationFit
  const text = `${job.description ?? ''} ${job.requirements ?? ''}`
  const re = /\b(s1|s2|s3|sarjana|magister|doktor|diploma|d3|d4)\b/i
  const requires = re.test(text)
  if (!requires) {
    return {
      score: Math.round(max * 0.6),
      max,
      note: 'Tidak ada syarat pendidikan eksplisit.',
    }
  }
  const haystack = educations
    .map((e) => `${asString(e.degree)} ${asString(e.field)}`.toLowerCase())
    .join(' ')
  if (re.test(haystack) || haystack.length > 0) {
    return {
      score: max,
      max,
      note: 'Pendidikan kandidat sesuai dengan syarat lowongan.',
    }
  }
  return {
    score: Math.round(max * 0.4),
    max,
    note: 'Pendidikan kandidat belum sesuai dengan syarat lowongan.',
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const EMPTY_BREAKDOWN: MatchBreakdown = {
  keywordOverlap: {
    score: 0,
    max: WEIGHTS.keywordOverlap,
    matchedKeywords: [],
    missedKeywords: [],
  },
  skillsCoverage: {
    score: 0,
    max: WEIGHTS.skillsCoverage,
    present: [],
    missing: [],
  },
  locationFit: { score: 0, max: WEIGHTS.locationFit, note: '' },
  experienceFit: {
    score: 0,
    max: WEIGHTS.experienceFit,
    candidateYears: 0,
    note: '',
  },
  employmentFit: { score: 0, max: WEIGHTS.employmentFit, note: '' },
  educationFit: { score: 0, max: WEIGHTS.educationFit, note: '' },
}

/**
 * Score a single Application against its Job. Resume + user enrich the score
 * but are optional — when either is missing the scorer falls back to text
 * derived from the cover letter + user headline.
 */
export function scoreApplicationToJob(
  application: MatchApplication,
  job: MatchJob,
  resume?: MatchResume,
  user?: MatchUser,
): MatchResult {
  if (!application || !job) {
    return {
      score: 0,
      breakdown: { ...EMPTY_BREAKDOWN },
      tags: ['low_match'],
      notes: ['Data lamaran tidak lengkap.'],
    }
  }

  const r = readResume(resume ?? null)
  const candidateYears = computeCandidateYears(r.experiences)

  // Combined candidate text for keyword overlap. We deliberately include the
  // cover letter and headline so candidates without a structured resume can
  // still earn meaningful overlap points.
  const experienceText = r.experiences
    .map(
      (e) =>
        `${asString(e.title)} ${asString(e.company)} ${asString(e.description)}`,
    )
    .join(' ')
  const candidateText = [
    r.summary,
    r.skills.join(' '),
    experienceText,
    asString(user?.headline),
    asString(application.coverLetter),
  ].join(' ')

  const keywordOverlap = scoreKeywordOverlap(job, candidateText)
  const skillsCoverage = scoreSkillsCoverage(job, r.skills, candidateText)
  const locationFit = scoreLocationFit(job, user?.location ?? null)
  const expResult = scoreExperienceFit(job, candidateYears)
  const experienceFit = expResult.dim
  const employmentFit = scoreEmploymentFit(job, resume?.content)
  const educationFit = scoreEducationFit(job, r.educations)

  const breakdown: MatchBreakdown = {
    keywordOverlap,
    skillsCoverage,
    locationFit,
    experienceFit,
    employmentFit,
    educationFit,
  }

  const total =
    keywordOverlap.score +
    skillsCoverage.score +
    locationFit.score +
    experienceFit.score +
    employmentFit.score +
    educationFit.score
  const score = Math.max(0, Math.min(100, Math.round(total)))

  // ---- Tags ----
  const tags: string[] = []
  if (score >= 80) tags.push('strong_match')
  else if (score >= 60) tags.push('partial_match')
  else if (score >= 40) tags.push('weak_match')
  else tags.push('low_match')

  if (skillsCoverage.missing.length >= 3) tags.push('skills_gap')
  if (job.locationType === 'REMOTE') tags.push('location_remote_ok')
  if (expResult.overqualified) tags.push('overqualified')
  if (expResult.junior) tags.push('junior_for_role')

  // ---- Notes (Indonesian) ----
  const notes: string[] = []
  const matched = keywordOverlap.matchedKeywords.length
  const requiredTokens =
    keywordOverlap.matchedKeywords.length + keywordOverlap.missedKeywords.length
  if (requiredTokens > 0) {
    notes.push(
      `Cocokkan ${matched} dari ${requiredTokens} kata kunci utama.`,
    )
  }
  if (skillsCoverage.present.length > 0 || skillsCoverage.missing.length > 0) {
    const presentList =
      skillsCoverage.present.slice(0, 5).join(', ') || '—'
    const missingList =
      skillsCoverage.missing.slice(0, 5).join(', ') || '—'
    notes.push(
      `Keterampilan inti tertutup: ${presentList}. Kurang: ${missingList}.`,
    )
  }
  notes.push(
    `Pengalaman ${candidateYears} tahun ${
      experienceFit.requiredYears !== undefined
        ? `cocok dengan kebutuhan ${experienceFit.requiredYears} tahun.`
        : 'pada profil.'
    }`,
  )
  notes.push(locationFit.note)

  return { score, breakdown, tags, notes }
}

// ---------------------------------------------------------------------------
// UI labels (Indonesian)
// ---------------------------------------------------------------------------

export const MATCH_DIMENSION_LABELS: Record<keyof MatchBreakdown, string> = {
  keywordOverlap: 'Kata kunci',
  skillsCoverage: 'Keterampilan teknis',
  locationFit: 'Lokasi',
  experienceFit: 'Pengalaman',
  employmentFit: 'Tipe kerja',
  educationFit: 'Pendidikan',
}

export const MATCH_TAG_LABELS: Record<string, string> = {
  strong_match: 'Cocokkan sangat kuat',
  partial_match: 'Cocok sebagian',
  weak_match: 'Kurang cocok',
  low_match: 'Tidak cocok',
  skills_gap: 'Gap keterampilan',
  location_remote_ok: 'Remote OK',
  overqualified: 'Overqualified',
  junior_for_role: 'Masih junior',
}
