/**
 * Job Description generator — MOCK / TEMPLATE-BASED.
 *
 * IMPORTANT: This module does NOT call any LLM. It is a deterministic rule
 * engine that fills Indonesian-language string templates based on:
 *   - role bucket inferred from the job title (engineer / designer / manager…),
 *   - experience level (ENTRY..EXECUTIVE) → years-of-experience floor,
 *   - employment + location type for tone hints,
 *   - tags → mapped to human phrasing via the SKILL_PHRASES dictionary.
 *
 * The output is intentionally generic so a real recruiter can rewrite it.
 * Treat it as a starting point, not a finished JD. Replace this module with
 * a real LLM-backed implementation if/when budgets allow.
 *
 * Determinism: For the same input, the output bytes are identical. No
 * randomness, no Date.now(), no Math.random().
 */

import {
  EmploymentType,
  ExperienceLevel,
  LocationType,
} from '@prisma/client'
import { normalizeSkill } from '@/lib/skills/search'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JdGeneratorInput = {
  title: string
  level: ExperienceLevel
  employmentType: EmploymentType
  location: string
  locationType: LocationType
  tags: string[]
}

export type JdGeneratorOutput = {
  description: string
  responsibilities: string
  requirements: string
  benefits: string
}

// ---------------------------------------------------------------------------
// Label dictionaries — Indonesian copy
// ---------------------------------------------------------------------------

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry-level',
  JUNIOR: 'Junior',
  MID: 'Mid-level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

/** Minimum years of experience implied by each level. */
const LEVEL_YEARS: Record<ExperienceLevel, number> = {
  ENTRY: 0,
  JUNIOR: 1,
  MID: 3,
  SENIOR: 5,
  LEAD: 7,
  EXECUTIVE: 10,
}

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'penuh waktu',
  PART_TIME: 'paruh waktu',
  CONTRACT: 'kontrak',
  INTERNSHIP: 'magang',
  FREELANCE: 'freelance',
}

const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  ONSITE: 'on-site',
  HYBRID: 'hybrid',
  REMOTE: 'remote',
}

// ---------------------------------------------------------------------------
// Role bucket inference
// ---------------------------------------------------------------------------

type RoleBucket =
  | 'engineer'
  | 'designer'
  | 'product'
  | 'data'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'support'
  | 'generic'

function inferRoleBucket(title: string): RoleBucket {
  const t = title.toLowerCase()
  if (/engineer|developer|programmer|sde|swe|architect|devops|sre/.test(t)) {
    return 'engineer'
  }
  if (/designer|ux|ui|illustrator|brand/.test(t)) return 'designer'
  if (/product manager|product owner|product lead|pm\b/.test(t)) return 'product'
  if (/data|analyst|scientist|ml\b|machine learning|analytics/.test(t)) {
    return 'data'
  }
  if (/marketing|growth|seo|content|copywriter|social/.test(t)) return 'marketing'
  if (/sales|account executive|account manager|business development|bd\b/.test(t)) {
    return 'sales'
  }
  if (/operations|project manager|program manager|scrum/.test(t)) return 'operations'
  if (/support|success|customer/.test(t)) return 'support'
  return 'generic'
}

const ROLE_TEAM_NAME: Record<RoleBucket, string> = {
  engineer: 'engineering',
  designer: 'desain',
  product: 'produk',
  data: 'data',
  marketing: 'pemasaran',
  sales: 'penjualan',
  operations: 'operasional',
  support: 'customer experience',
  generic: 'kami',
}

// ---------------------------------------------------------------------------
// Skill → human phrasing (Indonesian)
//
// Keys are canonical taxonomy slugs (see lib/skills/taxonomy.ts).
// Used to build responsibility bullets like "Membangun antarmuka dengan React".
// Missing skills fall back to a generic "Menerapkan {Skill} ..." template.
// ---------------------------------------------------------------------------

const SKILL_PHRASES: Record<string, string> = {
  // Frontend
  react: 'Membangun antarmuka pengguna dengan React',
  'next-js': 'Mengembangkan aplikasi web modern menggunakan Next.js',
  'vue-js': 'Membangun antarmuka interaktif dengan Vue.js',
  svelte: 'Mengembangkan aplikasi ringan menggunakan Svelte',
  typescript: 'Menulis kode yang type-safe dengan TypeScript',
  javascript: 'Mengimplementasikan fitur interaktif dengan JavaScript',
  'tailwind-css': 'Menyusun tata letak responsif menggunakan Tailwind CSS',

  // Backend
  nodejs: 'Mengembangkan layanan backend dengan Node.js',
  go: 'Membangun layanan high-throughput menggunakan Go',
  python: 'Mengimplementasikan logika bisnis dengan Python',
  java: 'Mengembangkan layanan enterprise berbasis Java',
  rust: 'Mengembangkan modul performa tinggi dengan Rust',
  'spring-boot': 'Membangun service backend menggunakan Spring Boot',
  django: 'Mengembangkan API berbasis Django',
  fastapi: 'Membangun API yang cepat dan terdokumentasi dengan FastAPI',
  laravel: 'Mengembangkan aplikasi PHP modern dengan Laravel',
  'rest-api': 'Merancang dan mengelola REST API yang terdokumentasi',
  graphql: 'Merancang skema dan resolver GraphQL',
  microservices: 'Memecah sistem monolit menjadi microservices yang dapat diskalakan',

  // Data store
  postgres: 'Mendesain skema dan query PostgreSQL yang efisien',
  mongodb: 'Mengelola data terstruktur di MongoDB',
  redis: 'Mengoptimalkan cache dan queue menggunakan Redis',
  elasticsearch: 'Mengindeks dan melakukan pencarian skala besar dengan Elasticsearch',
  kafka: 'Mendesain pipeline event-driven dengan Kafka',

  // Infra / DevOps
  docker: 'Mengontainerisasi aplikasi dengan Docker',
  kubernetes: 'Men-deploy dan mengelola workload pada Kubernetes',
  terraform: 'Mengelola infrastruktur sebagai kode dengan Terraform',
  aws: 'Mendesain arsitektur cloud di AWS',
  gcp: 'Mendesain arsitektur cloud di Google Cloud',
  azure: 'Mendesain arsitektur cloud di Microsoft Azure',
  'ci-cd': 'Membangun dan memelihara pipeline CI/CD',

  // Mobile
  'react-native': 'Mengembangkan aplikasi mobile cross-platform dengan React Native',
  flutter: 'Membangun aplikasi mobile dengan Flutter',
  swift: 'Mengembangkan aplikasi iOS native dengan Swift',
  kotlin: 'Mengembangkan aplikasi Android native dengan Kotlin',

  // Design
  figma: 'Membuat desain UI dan prototype di Figma',
  sketch: 'Membuat desain UI menggunakan Sketch',
  'adobe-xd': 'Membuat prototype interaktif menggunakan Adobe XD',
  photoshop: 'Mengolah aset visual menggunakan Photoshop',
  illustrator: 'Membuat ilustrasi dan vektor dengan Illustrator',
  'ui-design': 'Merancang antarmuka pengguna yang konsisten dan rapi',
  'ux-research': 'Melakukan riset pengguna untuk memvalidasi keputusan desain',
  'design-systems': 'Membangun dan memelihara design system',
  prototyping: 'Membuat prototype interaktif untuk validasi konsep',

  // Marketing
  seo: 'Meningkatkan visibilitas organik melalui optimasi SEO',
  sem: 'Mengelola kampanye SEM dengan budget yang efektif',
  'content-marketing': 'Menyusun strategi konten yang relevan dengan audiens',
  'social-media': 'Mengelola kanal media sosial dan engagement audiens',
  'email-marketing': 'Merancang kampanye email yang efektif',
  'google-ads': 'Mengelola kampanye iklan Google Ads',
  'facebook-ads': 'Mengelola kampanye iklan Meta / Facebook Ads',
  'google-analytics': 'Menganalisis perilaku pengguna lewat Google Analytics',

  // Data
  sql: 'Menulis query SQL kompleks untuk analisis bisnis',
  tableau: 'Membuat dashboard analitik dengan Tableau',
  powerbi: 'Membuat laporan interaktif menggunakan Power BI',
  looker: 'Membangun model data di Looker',
  etl: 'Mendesain pipeline ETL yang dapat diandalkan',
  'data-warehousing': 'Mengelola data warehouse dan model dimensi',
  snowflake: 'Mengelola workload data di Snowflake',
  dbt: 'Membangun transformasi data terversi menggunakan dbt',
  'machine-learning': 'Mengembangkan dan mendeploy model machine learning',

  // Sales / CS
  salesforce: 'Mengelola pipeline penjualan di Salesforce',
  hubspot: 'Mengelola CRM dan automasi di HubSpot',
  crm: 'Mengelola hubungan pelanggan dan pipeline lewat CRM',
  'account-management': 'Memelihara hubungan dengan akun strategis',
  'lead-generation': 'Menjalankan strategi lead generation multikanal',
  'customer-success': 'Memastikan kesuksesan pelanggan setelah onboarding',

  // Ops / PM
  'project-management': 'Memimpin proyek dari inisiasi hingga delivery',
  scrum: 'Memfasilitasi ceremony Scrum tim',
  agile: 'Mendorong praktik Agile yang sehat',
  jira: 'Mengelola pekerjaan tim di Jira',
  asana: 'Mengelola pekerjaan tim di Asana',
  notion: 'Mendokumentasikan proses tim menggunakan Notion',
  'process-improvement': 'Mengidentifikasi dan menjalankan inisiatif perbaikan proses',

  // Soft skills
  communication: 'Berkomunikasi efektif lintas tim dan stakeholder',
  leadership: 'Memimpin inisiatif dan mendampingi anggota tim',
  'problem-solving': 'Memecahkan masalah kompleks secara terstruktur',
  teamwork: 'Berkolaborasi erat dalam tim lintas fungsi',
  'time-management': 'Mengelola prioritas dan waktu secara mandiri',
  mentoring: 'Membimbing engineer atau anggota tim yang lebih junior',
}

/** Capitalize first letter, leave the rest. */
function ucfirst(s: string): string {
  return s.length === 0 ? s : (s[0] ?? '').toUpperCase() + s.slice(1)
}

/** Convert kebab-case slug → "Title Case" display. */
function slugToDisplay(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part.length === 0 ? part : (part[0] ?? '').toUpperCase() + part.slice(1)))
    .join(' ')
}

/** Bullet template for an unknown skill. */
function fallbackResponsibility(slug: string): string {
  return `Menerapkan ${slugToDisplay(slug)} dalam pekerjaan sehari-hari`
}

/** Build "- foo\n- bar" with leading newline omitted for caller flexibility. */
function bulletList(items: string[]): string {
  return items.map((s) => `- ${s}`).join('\n')
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildDescription(input: JdGeneratorInput, bucket: RoleBucket): string {
  const levelLabel = LEVEL_LABEL[input.level]
  const team = ROLE_TEAM_NAME[bucket]
  const emp = EMPLOYMENT_LABEL[input.employmentType]
  const loc = LOCATION_TYPE_LABEL[input.locationType]
  // Avoid stutter ("Senior Senior Backend Engineer") when title already
  // encodes the level keyword.
  const titleLower = input.title.toLowerCase()
  const includeLevel = !titleLower.includes(levelLabel.toLowerCase().split('-')[0] ?? '')
  const rolePrefix = includeLevel ? `${levelLabel} ${input.title}` : input.title

  const opener =
    bucket === 'engineer'
      ? `Kami mencari ${rolePrefix} untuk bergabung dengan tim ${team} kami.`
      : bucket === 'designer'
        ? `Kami sedang mencari ${rolePrefix} yang akan berperan penting dalam tim ${team} kami.`
        : bucket === 'product'
          ? `Kami membuka posisi ${rolePrefix} untuk memimpin arah produk bersama tim ${team}.`
          : bucket === 'data'
            ? `Kami mencari ${rolePrefix} untuk memperkuat tim ${team} kami.`
            : bucket === 'marketing'
              ? `Kami mencari ${rolePrefix} untuk mendorong pertumbuhan bersama tim ${team}.`
              : bucket === 'sales'
                ? `Kami membuka posisi ${rolePrefix} untuk mempercepat pertumbuhan tim ${team}.`
                : bucket === 'operations'
                  ? `Kami mencari ${rolePrefix} untuk memimpin inisiatif tim ${team}.`
                  : bucket === 'support'
                    ? `Kami mencari ${rolePrefix} yang antusias menjaga kualitas pengalaman pelanggan dalam tim ${team}.`
                    : `Kami membuka posisi ${rolePrefix} untuk bergabung dengan tim ${team}.`

  const context =
    `Posisi ini bersifat ${emp} dengan pengaturan kerja ${loc}` +
    (input.location ? ` di ${input.location}` : '') +
    `. Anda akan bekerja sama lintas tim untuk memberikan dampak yang terukur dan berkelanjutan.`

  const impact =
    'Kami percaya bahwa tim yang baik adalah kombinasi dari kepemilikan, rasa ingin tahu, dan kemauan untuk berkembang bersama. Jika Anda mencari peran dengan tantangan yang nyata dan ruang untuk tumbuh, kami akan senang berbicara dengan Anda.'

  return [opener, context, impact].join('\n\n')
}

function buildResponsibilities(input: JdGeneratorInput, bucket: RoleBucket): string {
  const bullets: string[] = []

  // 1) Role-anchor bullet (always first, varies by bucket).
  const roleAnchor: Record<RoleBucket, string> = {
    engineer:
      'Merancang, membangun, dan memelihara komponen perangkat lunak yang andal dan dapat diskalakan',
    designer:
      'Merancang pengalaman pengguna yang intuitif dari penelitian hingga prototype',
    product:
      'Mendefinisikan visi produk dan menerjemahkannya menjadi roadmap yang dapat dijalankan',
    data:
      'Mengeksplorasi data untuk menghasilkan insight yang dapat ditindaklanjuti',
    marketing:
      'Merancang dan mengeksekusi kampanye pemasaran yang terukur',
    sales:
      'Mengelola siklus penjualan dari prospek hingga closing',
    operations:
      'Mengkoordinasikan eksekusi proyek lintas tim agar tepat waktu dan sesuai cakupan',
    support:
      'Menangani permintaan pelanggan dengan empati dan ketelitian',
    generic:
      'Memberikan kontribusi langsung pada inisiatif tim yang berdampak',
  }
  bullets.push(roleAnchor[bucket])

  // 2) Tag-driven bullets — dedup by canonical slug.
  const seen = new Set<string>()
  for (const raw of input.tags) {
    const slug = normalizeSkill(raw)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    bullets.push(SKILL_PHRASES[slug] ?? fallbackResponsibility(slug))
    if (bullets.length >= 8) break
  }

  // 3) Collaboration + ownership filler (always last two, if we have space).
  const fillers = [
    'Berkolaborasi erat dengan stakeholder lintas fungsi untuk memastikan eksekusi yang selaras',
    'Mendokumentasikan keputusan dan praktik terbaik untuk dimanfaatkan tim',
  ]
  for (const f of fillers) {
    if (bullets.length >= 8) break
    bullets.push(f)
  }

  // Guarantee at least 5 bullets.
  if (bullets.length < 5) {
    const padding = [
      'Mengikuti standar kualitas dan keamanan yang berlaku di tim',
      'Mengevaluasi alat dan pendekatan baru untuk meningkatkan produktivitas tim',
      'Memberikan umpan balik konstruktif pada review pekerjaan rekan tim',
    ]
    for (const p of padding) {
      if (bullets.length >= 5) break
      bullets.push(p)
    }
  }

  return bulletList(bullets)
}

function buildRequirements(input: JdGeneratorInput, bucket: RoleBucket): string {
  const years = LEVEL_YEARS[input.level]
  const yearsLabel =
    years === 0
      ? 'Tidak diwajibkan pengalaman formal — kami terbuka untuk lulusan baru atau career switcher'
      : `Memiliki minimal ${years} tahun pengalaman relevan pada peran serupa`

  const bullets: string[] = [yearsLabel]

  // Tag-driven requirements (familiarity wording — lighter than responsibilities).
  const seen = new Set<string>()
  for (const raw of input.tags) {
    const slug = normalizeSkill(raw)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    bullets.push(`Pemahaman kuat tentang ${slugToDisplay(slug)}`)
    if (bullets.length >= 5) break
  }

  // Role-bucket flavored requirement (always second-to-last).
  const bucketReq: Record<RoleBucket, string> = {
    engineer:
      'Pengalaman menulis kode yang teruji, bersih, dan mudah dipelihara dalam tim',
    designer:
      'Portofolio yang menunjukkan proses berpikir dari problem statement hingga solusi',
    product:
      'Kemampuan menerjemahkan kebutuhan bisnis dan pengguna menjadi spesifikasi yang jelas',
    data:
      'Kemampuan analitis yang kuat dan kemampuan menyampaikan temuan secara ringkas',
    marketing:
      'Pemahaman tentang metrik pemasaran dan kemampuan menjalankan eksperimen',
    sales:
      'Track record memenuhi target dan mengelola pipeline yang sehat',
    operations:
      'Kemampuan mengelola banyak prioritas paralel tanpa kehilangan detail',
    support:
      'Kemampuan komunikasi tertulis yang sangat baik dan empati pelanggan yang tinggi',
    generic:
      'Kemampuan berpikir terstruktur dan kemauan untuk terus belajar',
  }
  if (bullets.length < 6) bullets.push(bucketReq[bucket])

  // Always include communication (Indonesian + English friendliness).
  if (bullets.length < 6) {
    bullets.push(
      'Kemampuan komunikasi yang baik dalam Bahasa Indonesia; Bahasa Inggris menjadi nilai tambah',
    )
  }

  // Guarantee at least 4 bullets.
  if (bullets.length < 4) {
    bullets.push(
      'Sikap proaktif dan ownership tinggi terhadap pekerjaan',
      'Mau bekerja sama dalam tim yang kolaboratif dan saling menghormati',
    )
  }

  return bulletList(bullets.slice(0, 6))
}

function buildBenefits(input: JdGeneratorInput): string {
  const baseBenefits = [
    'Gaji kompetitif sesuai dengan pengalaman dan dampak',
    'Asuransi kesehatan untuk karyawan',
    'Hari libur tahunan dan cuti yang fleksibel',
    'Anggaran pelatihan profesional dan pengembangan diri',
  ]

  // Add a location/employment-aware bullet.
  if (input.locationType === LocationType.REMOTE) {
    baseBenefits.push('Kerja remote dengan jam kerja yang fleksibel')
  } else if (input.locationType === LocationType.HYBRID) {
    baseBenefits.push('Pengaturan kerja hybrid yang mendukung work-life balance')
  } else {
    baseBenefits.push('Lingkungan kantor yang nyaman dan mendukung kolaborasi')
  }

  if (input.employmentType === EmploymentType.FULL_TIME) {
    baseBenefits.push('Tunjangan hari raya (THR) dan bonus berbasis performa')
  }

  return bulletList(baseBenefits.slice(0, 6))
}

// ---------------------------------------------------------------------------
// Public entry — pure, deterministic
// ---------------------------------------------------------------------------

export function generateJobDescription(input: JdGeneratorInput): JdGeneratorOutput {
  const bucket = inferRoleBucket(input.title)
  return {
    description: ucfirst(buildDescription(input, bucket)),
    responsibilities: buildResponsibilities(input, bucket),
    requirements: buildRequirements(input, bucket),
    benefits: buildBenefits(input),
  }
}
