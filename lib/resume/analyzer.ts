// This module is the deterministic, rules-based baseline. When ANTHROPIC_API_KEY
// is configured, `lib/resume/analyzer-ai.ts` augments these results with
// contextual Claude-generated suggestions (the score/breakdown stay rules-based).

/**
 * Resume analyzer — rules-based "AI" suggestion engine.
 *
 * Pure functions, no I/O, no dependencies. Indonesian-language copy.
 * Score 0-100, deductions: high=10 / medium=5 / low=2.
 *
 * Designed to consume the loose shape used by `lib/resumes/actions.ts`
 * (ResumeContent) plus optional user contact info (email/phone/links/title).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'high' | 'medium' | 'low'

export type SuggestionCategory =
  | 'length'
  | 'phrasing'
  | 'completeness'
  | 'skills'
  | 'achievements'
  | 'consistency'
  | 'contact'

export type Suggestion = {
  id: string
  severity: Severity
  category: SuggestionCategory
  title: string
  body: string
  affectedSection?: string
  exampleBefore?: string
  exampleAfter?: string
  /** If set, applySuggestion server action can auto-apply this fix. */
  autoFix?: {
    kind: 'trim-summary' | 'add-skill'
    payload: Record<string, unknown>
  }
  /** True when produced by the Claude augmentation (`analyzeResumeAI`) rather
   *  than the deterministic rules. Advisory only — never carries an autoFix. */
  aiGenerated?: boolean
}

export type CategoryBreakdown = {
  category: SuggestionCategory
  score: number
  max: number
}

export type AnalysisResult = {
  score: number
  breakdown: CategoryBreakdown[]
  suggestions: Suggestion[]
  /** Which engine produced the suggestions. Absent ⇒ heuristic (rules-only),
   *  for backward compatibility with callers that predate the AI augmentation. */
  source?: 'ai' | 'heuristic'
}

/** Subset of fields the analyzer reads. Anything matching the shape works. */
export type AnalyzerExperience = {
  title?: string
  company?: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
}

export type AnalyzerEducation = {
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  description?: string
}

export type AnalyzerResume = {
  /** Resume "name" (== title in our schema). */
  name?: string
  fileUrl?: string | null
  summary?: string
  experiences?: AnalyzerExperience[]
  educations?: AnalyzerEducation[]
  skills?: string[]
  languages?: string[]
  /** Optional contact info (usually pulled from the User record). */
  email?: string
  phone?: string
  links?: string[]
}

// ---------------------------------------------------------------------------
// Constants — Indonesian-language patterns
// ---------------------------------------------------------------------------

const WEAK_PHRASES = [
  'bertanggung jawab atas',
  'bertanggung jawab untuk',
  'membantu dalam',
  'membantu untuk',
  'terlibat dalam',
  'turut serta',
  'ikut serta',
  'berpartisipasi dalam',
  'bekerja sama dengan',
  'melakukan tugas',
] as const

const STRONG_VERB_HINTS =
  'memimpin, merancang, mengoptimalkan, menambah, menurunkan, mempercepat, membangun, meluncurkan, menghemat'

const DUTY_VERBS = ['membuat', 'mengelola', 'mengurus', 'menangani', 'melakukan']

const TECH_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'React', regex: /\breact(?:\.js)?\b/i },
  { name: 'Next.js', regex: /\bnext(?:\.js)?\b/i },
  { name: 'Node.js', regex: /\bnode(?:\.js)?\b/i },
  { name: 'Python', regex: /\bpython\b/i },
  { name: 'Go', regex: /\bgolang\b|\bgo lang\b/i },
  { name: 'Java', regex: /\bjava\b(?!script)/i },
  { name: 'TypeScript', regex: /\btypescript\b|\bts\b/i },
  { name: 'JavaScript', regex: /\bjavascript\b|\bjs\b/i },
  { name: 'AWS', regex: /\baws\b/i },
  { name: 'GCP', regex: /\bgcp\b|\bgoogle cloud\b/i },
  { name: 'Azure', regex: /\bazure\b/i },
  { name: 'Docker', regex: /\bdocker\b/i },
  { name: 'Kubernetes', regex: /\bkubernetes\b|\bk8s\b/i },
  { name: 'SQL', regex: /\bsql\b/i },
  { name: 'MongoDB', regex: /\bmongo(?:db)?\b/i },
  { name: 'PostgreSQL', regex: /\bpostgres(?:ql)?\b/i },
  { name: 'Redis', regex: /\bredis\b/i },
  { name: 'Rust', regex: /\brust\b/i },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Indonesian phone: optional +62, digits 10-13 (after normalising)
const PHONE_DIGIT_REGEX = /^(\+?62|0)\d{8,12}$/

const QUANTIFIER_REGEX =
  /(\d+([.,]\d+)?\s?%|\d+([.,]\d+)?\s?(rb|ribu|jt|juta|m|miliar|k|x)|\bRp\s?\d|\$\s?\d|\b\d{2,}\b)/i

// ---------------------------------------------------------------------------
// Category max scores
// ---------------------------------------------------------------------------

const CATEGORY_MAX: Record<SuggestionCategory, number> = {
  length: 10,
  phrasing: 15,
  completeness: 20,
  skills: 15,
  achievements: 15,
  consistency: 10,
  contact: 10,
  // 8th: a synthetic "overall" not used; we already have 7. Re-balanced below.
}

// We need 8 categories per spec. Add an "overall" structure surface (used in
// breakdown UI). The 7 functional categories above + 'achievements' duplicates
// would be confusing, so we keep the 7 enumerated + an explicit 'overall'
// presentation derived from the score.
//
// The spec wording said "8 categories" — we map: length, phrasing,
// completeness, skills, achievements, consistency, contact + summary as
// a separate breakdown row that scores the summary block specifically. To
// avoid extending the Suggestion union, summary issues are emitted under
// 'completeness'/'length' as appropriate; the breakdown reports them under
// 'summary'. We expose 8 breakdown rows for the UI.

type BreakdownKey = SuggestionCategory | 'summary'

const BREAKDOWN_MAX: Record<BreakdownKey, number> = {
  length: 10,
  phrasing: 15,
  completeness: 20,
  skills: 15,
  achievements: 15,
  consistency: 10,
  contact: 10,
  summary: 5,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(s?: string | null): string {
  return (s ?? '').trim()
}

function wordCount(s?: string | null): number {
  const t = normalize(s)
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

function bulletsFromDescription(desc?: string): string[] {
  if (!desc) return []
  // Split on newlines and common bullet markers; trim and drop blanks.
  return desc
    .split(/\r?\n|•|·|•/g)
    .map((b) => b.replace(/^[-*\s]+/, '').trim())
    .filter((b) => b.length > 0)
}

function hasQuantifier(s: string): boolean {
  return QUANTIFIER_REGEX.test(s)
}

function lowerStarts(s: string, prefixes: readonly string[]): string | null {
  const lower = s.trim().toLowerCase()
  for (const p of prefixes) {
    if (lower.startsWith(p.toLowerCase())) return p
  }
  return null
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/i)
    .filter((t) => t.length > 0)
}

function detectDateFormat(s?: string): 'word-month' | 'numeric' | 'year' | 'other' | null {
  if (!s) return null
  const t = s.trim()
  if (!t) return null
  if (/^\d{4}$/.test(t)) return 'year'
  if (/^\d{1,2}[\/-]\d{4}$/.test(t)) return 'numeric'
  if (/^(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(t))
    return 'word-month'
  return 'other'
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function analyzeResume(resume: AnalyzerResume): AnalysisResult {
  const suggestions: Suggestion[] = []

  // Deductions per category (and per breakdown row).
  const deductions: Record<BreakdownKey, number> = {
    length: 0,
    phrasing: 0,
    completeness: 0,
    skills: 0,
    achievements: 0,
    consistency: 0,
    contact: 0,
    summary: 0,
  }

  const push = (s: Suggestion, target?: BreakdownKey) => {
    suggestions.push(s)
    const weight = s.severity === 'high' ? 10 : s.severity === 'medium' ? 5 : 2
    const key: BreakdownKey = target ?? s.category
    deductions[key] += weight
  }

  const summary = normalize(resume.summary)
  const experiences = resume.experiences ?? []
  const educations = resume.educations ?? []
  const skills = (resume.skills ?? []).map((s) => s.trim()).filter(Boolean)
  const allBulletsText = experiences
    .map((e) => normalize(e.description))
    .join('\n')

  // -----------------------------------------------------------------------
  // 1. LENGTH
  // -----------------------------------------------------------------------

  // Summary length
  if (!summary) {
    push(
      {
        id: 'summary-missing',
        severity: 'high',
        category: 'completeness',
        title: 'Ringkasan profil belum diisi',
        body:
          'Ringkasan adalah hal pertama yang dibaca rekruter. Tulis 2-4 kalimat ' +
          'yang menjelaskan peran, pengalaman, dan keahlian utama Anda.',
        affectedSection: 'summary',
        exampleAfter:
          'Software engineer dengan 5 tahun pengalaman membangun aplikasi web ' +
          'berskala besar menggunakan React dan Node.js. Berhasil meningkatkan ' +
          'performa aplikasi sebesar 40% di perusahaan sebelumnya.',
      },
      'completeness',
    )
  } else if (summary.length < 50) {
    push(
      {
        id: 'summary-too-short',
        severity: 'medium',
        category: 'length',
        title: 'Ringkasan terlalu pendek',
        body:
          'Tambahkan detail peran, pengalaman, dan dampak utama Anda. ' +
          'Idealnya 2-4 kalimat (50-600 karakter).',
        affectedSection: 'summary',
      },
      'summary',
    )
  } else if (summary.length > 600) {
    push(
      {
        id: 'summary-too-long',
        severity: 'medium',
        category: 'length',
        title: 'Ringkasan terlalu panjang',
        body:
          'Ringkasan yang terlalu panjang akan dilewati rekruter. Pangkas ke ' +
          '2-4 kalimat (maksimal sekitar 600 karakter).',
        affectedSection: 'summary',
        exampleBefore: summary.slice(0, 80) + '…',
        exampleAfter: summary.slice(0, 280).trim() + '…',
        autoFix: { kind: 'trim-summary', payload: { maxChars: 600 } },
      },
      'summary',
    )
  }

  // Bullet length per experience
  for (const exp of experiences) {
    const bullets = bulletsFromDescription(exp.description)
    for (const b of bullets) {
      const wc = wordCount(b)
      if (wc > 25) {
        push(
          {
            id: `bullet-too-long-${experiences.indexOf(exp)}-${b.slice(0, 20)}`,
            severity: 'low',
            category: 'length',
            title: 'Bullet terlalu panjang — coba pecah jadi 2 baris',
            body:
              'Setiap bullet idealnya 15-25 kata. Pecah menjadi dua bullet yang ' +
              'masing-masing fokus ke satu hasil.',
            affectedSection: `experience.${experiences.indexOf(exp)}`,
            exampleBefore: b,
          },
          'length',
        )
      }
    }
  }

  // Overall length
  const totalText = [
    summary,
    allBulletsText,
    educations.map((e) => normalize(e.description)).join('\n'),
    skills.join(' '),
  ]
    .filter(Boolean)
    .join('\n')
  const totalWords = wordCount(totalText)
  if (totalWords < 200) {
    push(
      {
        id: 'resume-too-short',
        severity: 'high',
        category: 'length',
        title: 'Resume ini terlalu pendek',
        body:
          `Total konten hanya ${totalWords} kata. Resume yang baik biasanya ` +
          'memiliki 200-800 kata. Tambah pengalaman, deskripsi tugas, dan ' +
          'pencapaian terukur.',
      },
      'length',
    )
  } else if (totalWords > 800) {
    push(
      {
        id: 'resume-too-long',
        severity: 'medium',
        category: 'length',
        title: 'Resume ini terlalu panjang',
        body:
          `Total konten ${totalWords} kata. Pertimbangkan menyaring konten ke ` +
          '200-800 kata yang paling relevan untuk peran yang dilamar.',
      },
      'length',
    )
  }

  // -----------------------------------------------------------------------
  // 2. WEAK PHRASING
  // -----------------------------------------------------------------------

  const lowerBullets = allBulletsText.toLowerCase()
  const usedWeak: string[] = []
  for (const w of WEAK_PHRASES) {
    if (lowerBullets.includes(w)) usedWeak.push(w)
  }
  if (usedWeak.length > 0) {
    push(
      {
        id: 'weak-phrasing',
        severity: 'medium',
        category: 'phrasing',
        title: 'Hindari frasa lemah pada deskripsi pengalaman',
        body:
          `Ditemukan frasa lemah: ${usedWeak.slice(0, 3).join(', ')}. ` +
          `Pakai kata kerja aksi yang menggambarkan dampak nyata seperti: ${STRONG_VERB_HINTS}.`,
        exampleBefore: 'Bertanggung jawab atas pengembangan fitur pembayaran.',
        exampleAfter:
          'Merancang & meluncurkan fitur pembayaran baru yang meningkatkan konversi 18%.',
      },
      'phrasing',
    )
  }

  // -----------------------------------------------------------------------
  // 3. QUANTIFICATION — bullets without numbers
  // -----------------------------------------------------------------------

  let bulletCount = 0
  let bulletsWithNumbers = 0
  for (const exp of experiences) {
    const bullets = bulletsFromDescription(exp.description)
    for (const b of bullets) {
      bulletCount += 1
      if (hasQuantifier(b)) bulletsWithNumbers += 1
    }
  }
  if (bulletCount > 0 && bulletsWithNumbers / bulletCount < 0.5) {
    push(
      {
        id: 'low-quantification',
        severity: 'high',
        category: 'achievements',
        title: 'Tambah angka untuk memperkuat dampak',
        body:
          `Hanya ${bulletsWithNumbers} dari ${bulletCount} bullet yang memuat ` +
          'angka, persentase, atau nominal. Angka konkrit (mis. "+30% konversi") ' +
          'jauh lebih meyakinkan dibanding deskripsi umum.',
        exampleBefore: 'Mengurangi waktu deploy.',
        exampleAfter: 'Mengurangi waktu deploy 60% (dari 25 menit ke 10 menit).',
      },
      'achievements',
    )
  }

  // -----------------------------------------------------------------------
  // 4. COMPLETENESS
  // -----------------------------------------------------------------------

  const title = normalize(resume.name)
  if (!title) {
    push(
      {
        id: 'no-title',
        severity: 'low',
        category: 'completeness',
        title: 'Beri nama CV Anda',
        body:
          'CV tanpa nama menyulitkan saat Anda punya beberapa versi. Contoh: ' +
          '"CV Frontend Engineer 2026".',
      },
      'completeness',
    )
  }

  const email = normalize(resume.email)
  if (!email) {
    push(
      {
        id: 'no-email',
        severity: 'high',
        category: 'contact',
        title: 'Email tidak ditemukan',
        body:
          'Pastikan email profesional terisi di profil Anda sehingga rekruter ' +
          'dapat menghubungi.',
      },
      'contact',
    )
  }

  const phone = normalize(resume.phone)
  if (!phone) {
    push(
      {
        id: 'no-phone',
        severity: 'medium',
        category: 'contact',
        title: 'Nomor telepon belum diisi',
        body:
          'Tambahkan nomor telepon (format +62 atau 08xx) agar rekruter bisa ' +
          'menghubungi dengan cepat.',
      },
      'contact',
    )
  }

  const links = resume.links ?? []
  const hasPortfolioOrLinkedIn = links.some((l) =>
    /linkedin\.com|github\.com|behance|dribbble|portfolio|gitlab/i.test(l),
  )
  if (!hasPortfolioOrLinkedIn) {
    push(
      {
        id: 'no-linkedin-portfolio',
        severity: 'high',
        category: 'completeness',
        title: 'Tambahkan LinkedIn atau portofolio',
        body:
          'Rekruter sering memverifikasi profil melalui LinkedIn atau melihat ' +
          'portofolio (GitHub, Behance, dsb.). Tambahkan minimal satu tautan.',
      },
      'completeness',
    )
  }

  if (!skills || skills.length === 0) {
    push(
      {
        id: 'no-skills',
        severity: 'high',
        category: 'skills',
        title: 'Daftar keahlian (skills) masih kosong',
        body:
          'Tambahkan minimal 5 keahlian relevan. Skills membantu Resume Anda ' +
          'lolos filter ATS dan terlihat oleh rekruter.',
      },
      'skills',
    )
  }

  if (experiences.length < 2) {
    push(
      {
        id: 'few-experiences',
        severity: experiences.length === 0 ? 'high' : 'medium',
        category: 'completeness',
        title:
          experiences.length === 0
            ? 'Belum ada pengalaman kerja'
            : 'Tambahkan lebih banyak pengalaman',
        body:
          'Sertakan minimal 2 pengalaman (kerja, magang, proyek freelance, atau ' +
          'kontribusi open-source) dengan deskripsi capaian yang terukur.',
      },
      'completeness',
    )
  }

  if (educations.length === 0) {
    push(
      {
        id: 'no-education',
        severity: 'medium',
        category: 'completeness',
        title: 'Belum ada riwayat pendidikan',
        body:
          'Tambahkan jenjang pendidikan terakhir Anda — minimal nama institusi ' +
          'dan tahun.',
      },
      'completeness',
    )
  }

  // -----------------------------------------------------------------------
  // 5. SKILLS COVERAGE
  // -----------------------------------------------------------------------

  if (skills.length > 0 && skills.length < 5) {
    push(
      {
        id: 'few-skills',
        severity: 'medium',
        category: 'skills',
        title: 'Daftar keahlian masih sedikit',
        body:
          `Anda baru mencantumkan ${skills.length} keahlian. Tambah hingga ` +
          '8-15 keahlian untuk memperluas jangkauan pencarian rekruter.',
      },
      'skills',
    )
  } else if (skills.length > 30) {
    push(
      {
        id: 'too-many-skills',
        severity: 'low',
        category: 'skills',
        title: 'Terlalu banyak keahlian — kurasi yang paling relevan',
        body:
          `Anda mencantumkan ${skills.length} keahlian. Fokus pada 10-15 yang ` +
          'paling relevan untuk peran yang dilamar; daftar terlalu panjang ' +
          'terlihat tidak fokus.',
      },
      'skills',
    )
  }

  // Tech mentioned in experience but missing from skills
  const lowerSkills = new Set(skills.map((s) => s.toLowerCase()))
  const lowerExpAll = (
    experiences.map((e) => [e.title, e.description].join(' ')).join(' ') +
    ' ' +
    summary
  ).toLowerCase()
  const missingTech: string[] = []
  for (const tech of TECH_PATTERNS) {
    if (tech.regex.test(lowerExpAll)) {
      if (!lowerSkills.has(tech.name.toLowerCase())) missingTech.push(tech.name)
    }
  }
  for (const t of missingTech.slice(0, 5)) {
    push(
      {
        id: `add-skill-${t.toLowerCase()}`,
        severity: 'low',
        category: 'skills',
        title: `Tambahkan "${t}" ke daftar keahlian`,
        body:
          `Anda menyebut ${t} pada pengalaman tetapi belum mencantumkannya pada ` +
          'daftar keahlian. ATS sering mencocokkan kata kunci di bagian skills.',
        autoFix: { kind: 'add-skill', payload: { skill: t } },
      },
      'skills',
    )
  }

  // -----------------------------------------------------------------------
  // 6. CONSISTENCY — date format & tense
  // -----------------------------------------------------------------------

  const dateFormats = new Set<string>()
  for (const exp of experiences) {
    const f1 = detectDateFormat(exp.startDate)
    const f2 = detectDateFormat(exp.endDate)
    if (f1) dateFormats.add(f1)
    if (f2) dateFormats.add(f2)
  }
  if (dateFormats.size > 1) {
    push(
      {
        id: 'inconsistent-dates',
        severity: 'low',
        category: 'consistency',
        title: 'Format tanggal pengalaman tidak konsisten',
        body:
          'Gunakan satu format yang sama untuk semua tanggal, contohnya ' +
          '"Jan 2023" pada seluruh entri.',
      },
      'consistency',
    )
  }

  // Tense mix (very heuristic) — flag if "current: true" job uses past markers
  for (const exp of experiences) {
    if (!exp.current) continue
    const desc = (exp.description ?? '').toLowerCase()
    // crude past-tense markers in Indonesian
    if (/\btelah\b|\bsudah\b|\bberhasil\b/.test(desc) && /\bsaat ini\b|\bsedang\b/.test(desc)) {
      push(
        {
          id: `tense-mix-${experiences.indexOf(exp)}`,
          severity: 'low',
          category: 'consistency',
          title: 'Campur waktu lampau & sekarang pada satu peran',
          body:
            'Pada peran yang masih berjalan, gunakan kata kerja waktu sekarang ' +
            'secara konsisten (contoh: "merancang", "mengelola").',
          affectedSection: `experience.${experiences.indexOf(exp)}`,
        },
        'consistency',
      )
    }
  }

  // -----------------------------------------------------------------------
  // 7. CONTACT VALIDATION
  // -----------------------------------------------------------------------

  if (email && !EMAIL_REGEX.test(email)) {
    push(
      {
        id: 'invalid-email',
        severity: 'high',
        category: 'contact',
        title: 'Format email tidak valid',
        body: `Email "${email}" tampak tidak valid. Periksa kembali alamat email Anda.`,
      },
      'contact',
    )
  }

  if (phone) {
    const normalized = phone.replace(/[\s\-().]/g, '')
    if (!PHONE_DIGIT_REGEX.test(normalized)) {
      push(
        {
          id: 'invalid-phone',
          severity: 'medium',
          category: 'contact',
          title: 'Format nomor telepon tampak tidak standar',
          body:
            'Gunakan format +628xxxxxxxxxx atau 08xxxxxxxxxx (10-13 digit). ' +
            'Format yang tidak standar mungkin sulit dihubungi.',
        },
        'contact',
      )
    }
  }

  // -----------------------------------------------------------------------
  // 8. ACHIEVEMENTS vs DUTIES
  // -----------------------------------------------------------------------

  let dutyBullets = 0
  for (const exp of experiences) {
    const bullets = bulletsFromDescription(exp.description)
    for (const b of bullets) {
      const matchedDuty = lowerStarts(b, DUTY_VERBS)
      if (matchedDuty && !hasQuantifier(b)) {
        dutyBullets += 1
      }
    }
  }
  if (dutyBullets >= 2) {
    push(
      {
        id: 'duty-vs-achievement',
        severity: 'medium',
        category: 'achievements',
        title: 'Banyak bullet berupa "tugas" tanpa dampak terukur',
        body:
          `${dutyBullets} bullet diawali dengan kata kerja seperti "membuat", ` +
          '"mengelola", atau "mengurus" tanpa metric. Reframe sebagai pencapaian ' +
          'dengan menambah angka atau hasil.',
        exampleBefore: 'Membuat laporan penjualan mingguan.',
        exampleAfter:
          'Membuat laporan penjualan mingguan otomatis yang menghemat 6 jam/minggu tim.',
      },
      'achievements',
    )
  }

  // -----------------------------------------------------------------------
  // SCORING
  // -----------------------------------------------------------------------

  const breakdown: CategoryBreakdown[] = (
    Object.keys(BREAKDOWN_MAX) as BreakdownKey[]
  ).map((key) => {
    const max = BREAKDOWN_MAX[key]
    const remaining = Math.max(0, max - deductions[key])
    return {
      // The Suggestion type's category union does not include 'summary'; we map
      // it to 'length' for downstream typing but expose label via the key.
      // Cast is safe: we keep keys distinct in breakdown rows.
      category: key as SuggestionCategory,
      score: remaining,
      max,
    }
  })

  // Overall score: per spec — start at 100, subtract raw severity weights
  // (high=10 / medium=5 / low=2), no per-category cap on the raw total.
  // Capped at [0, 100].
  const totalDeduction = suggestions.reduce(
    (sum, s) =>
      sum + (s.severity === 'high' ? 10 : s.severity === 'medium' ? 5 : 2),
    0,
  )
  const score = Math.max(0, Math.min(100, 100 - totalDeduction))

  return { score, breakdown, suggestions }
}

// Re-export helpers used by the apply-suggestion action.
export const ANALYZER_INTERNALS = {
  TECH_PATTERNS,
  wordCount,
  bulletsFromDescription,
  tokenize,
}
