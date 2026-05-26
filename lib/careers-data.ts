// TEMPORARY DUMMY DATA — replace with prisma query once careers ATS is wired up.

export type CareerOpening = {
  slug: string
  title: string
  team: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  level: 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Lead'
  salaryMin: number
  salaryMax: number
  postedAt: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  niceToHave: string[]
}

const SHARED_WHAT_WE_OFFER = [
  'Gaji kompetitif + equity untuk semua karyawan tetap',
  'Asuransi swasta menyeluruh untuk Anda dan keluarga',
  'Anggaran belajar Rp 12 juta/tahun (kursus, buku, konferensi)',
  '20 hari cuti tahunan + cuti ulang tahun + 30 hari WFA/tahun',
  'MacBook Pro M-series + monitor 4K + anggaran ergonomi Rp 5 juta',
  'Parental leave 4 bulan untuk ibu, 4 minggu untuk pasangan',
  'Offsite tahunan di lokasi yang seru (Bali, Yogya, Lombok)',
  'Bonus performa setiap kuartal berbasis impact, bukan jam kerja',
]

export const SHARED_BENEFITS = SHARED_WHAT_WE_OFFER

export const CAREER_OPENINGS: CareerOpening[] = [
  {
    slug: 'senior-backend-engineer',
    title: 'Senior Backend Engineer (Platform)',
    team: 'Engineering',
    location: 'Jakarta / Remote',
    type: 'Full-time',
    level: 'Senior',
    salaryMin: 35_000_000,
    salaryMax: 55_000_000,
    postedAt: '3 hari lalu',
    summary:
      'Anda akan membangun lapisan platform yang menjalankan multi-tenant ATS untuk 12.000+ perekrut dan 2.4 juta pencari kerja. Ini bukan pekerjaan "tambah endpoint" — Anda akan ikut menentukan arsitektur data, batas tenant, dan kontrak API yang akan dipakai bertahun-tahun ke depan.',
    responsibilities: [
      'Mendesain dan mengirim layanan inti (job posting, application pipeline, search indexing) dengan kepemilikan end-to-end',
      'Menetapkan pola tenant isolation di lapisan database (Postgres RLS) dan aplikasi',
      'Membimbing engineer mid/junior melalui code review dan pair programming',
      'Bekerja erat dengan Product untuk membentuk roadmap teknis 6 bulan ke depan',
      'Memimpin investigasi insiden P0/P1 dan menulis post-mortem publik',
      'Mengusulkan dan mengeksekusi proyek perbaikan platform secara mandiri',
    ],
    requirements: [
      '6+ tahun pengalaman backend di sistem produksi skala besar',
      'Kemahiran mendalam TypeScript/Node atau Go — kami memakai keduanya',
      'Pengalaman dengan Postgres termasuk query tuning dan tradeoff schema',
      'Sudah pernah memimpin proyek lintas-tim dari ide ke launch',
      'Komunikasi tulisan yang jernih (kami menulis RFC sebelum kode besar)',
      'Mindset ownership — Anda tidur lebih nyenyak kalau sistem stabil',
    ],
    niceToHave: [
      'Pengalaman dengan multi-tenant SaaS atau marketplace dua sisi',
      'Pernah memimpin migrasi besar (rewrite, replatform, sharding)',
      'Kontribusi open-source yang bisa dilihat',
    ],
  },
  {
    slug: 'staff-frontend-engineer',
    title: 'Staff Frontend Engineer (Next.js)',
    team: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    level: 'Staff',
    salaryMin: 45_000_000,
    salaryMax: 70_000_000,
    postedAt: '1 minggu lalu',
    summary:
      'Sebagai Staff, Anda akan menjadi panutan teknis untuk 14 frontend engineer kami. Anda menentukan standar — komponen, kinerja, aksesibilitas, dan testing — yang akan diadopsi seluruh tim. Kerja Anda menjangkau jutaan pengguna setiap minggu.',
    responsibilities: [
      'Mendefinisikan arsitektur frontend lintas produk (consumer app, partner dashboard, LMS)',
      'Memimpin proyek arsitektural besar: design system, micro-frontend, edge rendering',
      'Mentoring engineer senior dan mid melalui RFC review dan office hours mingguan',
      'Mengoptimalkan kinerja, kompatibilitas, dan aksesibilitas hingga WCAG 2.2 AA',
      'Berkolaborasi langsung dengan VP Engineering dan Head of Design',
      'Mewakili tim frontend dalam forum engineering eksternal (talks, blog post)',
    ],
    requirements: [
      '8+ tahun pengalaman frontend produksi, 3+ tahun di level senior',
      'Penguasaan mendalam React, Next.js App Router, dan ekosistem modern',
      'Track record memimpin proyek lintas tim dengan dampak terukur',
      'Mata yang tajam terhadap UX detail — Anda peduli pada motion, focus state, dan empty state',
      'Pengalaman membangun design system dan komponen reusable',
      'Komunikasi tertulis yang sangat baik',
    ],
    niceToHave: [
      'Pengalaman dengan a11y/WCAG audit dan tooling',
      'Pernah membangun atau mengelola design token system',
      'Kontribusi ke library populer (React, Next.js, dll.)',
    ],
  },
  {
    slug: 'mobile-engineer',
    title: 'Mobile Engineer (Flutter)',
    team: 'Engineering',
    location: 'Jakarta / Hybrid',
    type: 'Full-time',
    level: 'Mid',
    salaryMin: 22_000_000,
    salaryMax: 35_000_000,
    postedAt: '4 hari lalu',
    summary:
      'Tim mobile RPI baru saja meluncurkan aplikasi untuk pekerja lapangan — konstruksi, logistik, F&B. Kami butuh engineer yang peduli pada UX di koneksi 3G dan tahu cara menulis kode Flutter yang bersih dan teruji.',
    responsibilities: [
      'Membangun fitur baru di aplikasi Flutter kami (iOS + Android)',
      'Mengoptimalkan kinerja dan pemakaian baterai untuk perangkat low-end',
      'Mengintegrasikan dengan API platform dan layanan pihak ketiga',
      'Menulis test unit & widget untuk fitur kritis',
      'Berpartisipasi dalam on-call rotation untuk insiden mobile',
    ],
    requirements: [
      '3+ tahun pengalaman mobile di produksi (Flutter atau native)',
      '2+ tahun spesifik Flutter dengan aplikasi yang sudah dirilis',
      'Pemahaman state management (Riverpod, Bloc, atau setara)',
      'Pengalaman release management ke App Store & Play Store',
      'Empati terhadap pengguna di koneksi internet terbatas',
    ],
    niceToHave: [
      'Pengalaman dengan offline-first dan sinkronisasi data',
      'Penguasaan satu native (Swift/Kotlin) untuk integrasi platform',
      'Pernah mengelola aplikasi multi-bahasa (i18n)',
    ],
  },
  {
    slug: 'senior-product-designer',
    title: 'Senior Product Designer',
    team: 'Design',
    location: 'Jakarta / Hybrid',
    type: 'Full-time',
    level: 'Senior',
    salaryMin: 28_000_000,
    salaryMax: 45_000_000,
    postedAt: '5 hari lalu',
    summary:
      'Anda akan memiliki pengalaman end-to-end untuk salah satu surface utama kami — pencari kerja, partner dashboard, atau LMS. Designer di RPI tidak menggambar mockup; mereka membentuk produk dari riset hingga launch.',
    responsibilities: [
      'Melakukan riset pengguna sendiri (user interview, usability test, surveys)',
      'Mendesain interaksi, alur, dan visual untuk fitur berdampak besar',
      'Berkolaborasi harian dengan PM dan Engineering dari ide hingga rilis',
      'Mempresentasikan keputusan desain dengan rasional yang jernih ke seluruh tim',
      'Berkontribusi pada design system kami (Figma + code tokens)',
    ],
    requirements: [
      '5+ tahun pengalaman product design di produk konsumen atau B2B SaaS',
      'Portfolio yang menunjukkan ownership end-to-end (bukan hanya pixel)',
      'Mahir Figma termasuk variants, auto-layout, dan komponen kompleks',
      'Pengalaman riset pengguna langsung',
      'Pikiran sistem — Anda melihat pola lintas surface',
    ],
    niceToHave: [
      'Pernah bekerja di marketplace atau platform dua sisi',
      'Penguasaan dasar CSS/HTML untuk komunikasi dengan engineer',
      'Pengalaman desain motion (Lottie, After Effects)',
    ],
  },
  {
    slug: 'brand-content-designer',
    title: 'Brand & Content Designer',
    team: 'Design',
    location: 'Jakarta',
    type: 'Full-time',
    level: 'Mid',
    salaryMin: 16_000_000,
    salaryMax: 26_000_000,
    postedAt: '1 minggu lalu',
    summary:
      'Anda akan membentuk wajah RPI di luar produk — laporan, kampanye, media sosial, dan event. Peran ini cocok untuk designer yang sama nyamannya mendesain laporan 80 halaman dan post Instagram tunggal.',
    responsibilities: [
      'Mendesain laporan riset, whitepaper, dan publikasi RPI Insight',
      'Membuat aset kampanye lintas channel (sosmed, email, ads, OOH)',
      'Memelihara dan mengembangkan brand guidelines',
      'Berkolaborasi dengan Marketing dan Comms untuk eksekusi visual',
      'Menetapkan tone visual untuk inisiatif baru (event, partnership)',
    ],
    requirements: [
      '4+ tahun pengalaman brand atau editorial design',
      'Mata tajam untuk tipografi, layout, dan hierarki',
      'Mahir Figma + Adobe CC (Illustrator, InDesign, Photoshop)',
      'Portfolio dengan rentang proyek (digital + cetak)',
      'Pikiran self-starter — Anda nyaman dengan brief yang masih kabur',
    ],
    niceToHave: [
      'Penguasaan motion (After Effects, Lottie) untuk konten sosmed',
      'Pengalaman desain laporan data-heavy (charts, infographics)',
      'Latar belakang ilustrasi atau kaligrafi',
    ],
  },
  {
    slug: 'senior-pm-talent',
    title: 'Senior Product Manager (Talent Side)',
    team: 'Product',
    location: 'Jakarta / Remote',
    type: 'Full-time',
    level: 'Senior',
    salaryMin: 35_000_000,
    salaryMax: 55_000_000,
    postedAt: '3 hari lalu',
    summary:
      'Anda memiliki pengalaman pencari kerja — onboarding, profil, pencarian, lamaran, dan komunikasi. Ini adalah surface paling kompleks di RPI: dampaknya menyentuh jutaan pengguna, dan keputusan kecil bisa mengubah angka KPI seketika.',
    responsibilities: [
      'Memiliki roadmap untuk surface talent dari discovery sampai delivery',
      'Berkolaborasi dengan Engineering, Design, dan Data untuk membentuk strategi',
      'Melakukan riset pengguna kualitatif dan kuantitatif',
      'Mendorong eksperimen A/B yang bertarget pada metrik berdampak',
      'Mempresentasikan trade-off dan keputusan ke leadership setiap kuartal',
    ],
    requirements: [
      '5+ tahun pengalaman PM, 2+ tahun memimpin proyek lintas tim',
      'Track record metrik yang Anda gerakkan, bukan sekadar fitur yang Anda rilis',
      'Kemampuan analisis data sendiri (SQL minimal proficient)',
      'Empati mendalam terhadap pengguna dan kemampuan mengarahkan riset',
      'Komunikasi tertulis yang sangat tajam',
    ],
    niceToHave: [
      'Latar belakang teknis (sebelumnya engineer atau ilmu data)',
      'Pengalaman dengan growth funnel, retention, atau marketplace',
      'Pernah bekerja di produk berbahasa Indonesia',
    ],
  },
  {
    slug: 'pm-academy',
    title: 'Product Manager (LMS / Academy)',
    team: 'Product',
    location: 'Jakarta',
    type: 'Full-time',
    level: 'Mid',
    salaryMin: 22_000_000,
    salaryMax: 35_000_000,
    postedAt: '6 hari lalu',
    summary:
      'RPI Academy baru saja diluncurkan dan punya 60.000 pelajar aktif. Anda akan membentuk jalur belajar, sertifikasi, dan integrasi dengan sisi rekrutmen — memastikan kursus yang diambil benar-benar mempengaruhi peluang kerja.',
    responsibilities: [
      'Memiliki produk LMS dari konten ingestion sampai pengalaman pelajar',
      'Berkolaborasi dengan tim Curriculum untuk membentuk struktur kursus',
      'Mendorong integrasi LMS dengan profil pencari kerja dan ATS perekrut',
      'Melakukan eksperimen untuk meningkatkan completion rate dan outcome',
      'Bekerja dengan Partnership untuk memperluas katalog sertifikasi',
    ],
    requirements: [
      '3+ tahun pengalaman PM, idealnya di produk EdTech atau LMS',
      'Pemahaman desain instruksional dan UX pembelajaran',
      'Kemampuan analitis dengan SQL dan tools BI',
      'Empati terhadap pelajar dari latar belakang berbeda',
    ],
    niceToHave: [
      'Pengalaman dengan kredensial atau sertifikasi industri',
      'Pernah membangun jalur karier (career pathing) berbasis skill',
      'Latar belakang pendidikan atau pelatihan',
    ],
  },
  {
    slug: 'partner-success',
    title: 'Partner Success Manager',
    team: 'Partnership',
    location: 'Jakarta',
    type: 'Full-time',
    level: 'Mid',
    salaryMin: 18_000_000,
    salaryMax: 28_000_000,
    postedAt: '4 hari lalu',
    summary:
      'Anda akan menjadi titik kontak utama untuk 80–100 mitra perekrut RPI — memastikan mereka mendapatkan ROI dari platform. Ini bukan akun manajemen reaktif; Anda akan proaktif membantu mitra mencapai target rekrutmen mereka.',
    responsibilities: [
      'Mengelola portofolio mitra dengan ekspansi dan retensi sebagai KPI',
      'Onboard mitra baru dari kontrak sampai go-live aktif',
      'Mengadakan QBR (quarterly business review) dengan klien strategis',
      'Mengumpulkan feedback dan menyampaikan ke tim Produk',
      'Mengidentifikasi peluang upsell dan ekspansi',
    ],
    requirements: [
      '3+ tahun pengalaman CSM, AM, atau peran klien-facing di SaaS',
      'Komunikasi verbal dan tertulis yang kuat (ID + EN)',
      'Kemampuan membaca data dan menyusun narasi dari angka',
      'Empati terhadap kebutuhan tim HR/TA di perusahaan besar',
      'Mindset proaktif — Anda tidak menunggu mitra menelepon',
    ],
    niceToHave: [
      'Latar belakang di HR Tech atau recruitment industry',
      'Pengalaman dengan tools seperti Gainsight, HubSpot CRM',
      'Pernah memegang quota ekspansi/upsell',
    ],
  },
  {
    slug: 'account-executive',
    title: 'Account Executive (Enterprise)',
    team: 'Partnership',
    location: 'Jakarta / Surabaya',
    type: 'Full-time',
    level: 'Senior',
    salaryMin: 30_000_000,
    salaryMax: 50_000_000,
    postedAt: '1 minggu lalu',
    summary:
      'Anda akan memimpin penjualan ke perusahaan besar — BUMN, grup usaha, dan korporasi multinasional. Siklus penjualan kompleks dengan multiple stakeholder dan kontrak rata-rata USD 200K–USD 2M per tahun.',
    responsibilities: [
      'Membangun pipeline net-new di segmen enterprise',
      'Memimpin discovery, demo, dan proses procurement multi-step',
      'Berkolaborasi dengan Solutions Engineering untuk solusi kustom',
      'Negosiasi kontrak hingga signature dengan margin yang sehat',
      'Mencapai dan melampaui kuota tahunan',
    ],
    requirements: [
      '6+ tahun pengalaman B2B SaaS sales dengan kuota di atas USD 1M',
      'Track record menutup kontrak enterprise (multi-stakeholder)',
      'Pemahaman pasar enterprise Indonesia (BUMN, swasta besar)',
      'Network di komunitas HR/CHRO/CEO Indonesia',
      'Komunikasi bilingual ID + EN level eksekutif',
    ],
    niceToHave: [
      'Latar belakang di HR Tech, ERP, atau platform B2B',
      'Pengalaman dengan MEDDIC, Challenger, atau metodologi enterprise sales',
      'Pernah menutup kontrak ke pemerintah/BUMN',
    ],
  },
  {
    slug: 'lifecycle-marketing',
    title: 'Lifecycle Marketing Lead',
    team: 'Marketing',
    location: 'Jakarta / Remote',
    type: 'Full-time',
    level: 'Lead',
    salaryMin: 28_000_000,
    salaryMax: 42_000_000,
    postedAt: '5 hari lalu',
    summary:
      'Anda akan membangun mesin lifecycle untuk 2.4 juta pencari kerja kami — onboarding, activation, retention, dan reactivation. Tujuannya bukan mengirim email lebih banyak; tujuannya adalah membantu pengguna mendapatkan pekerjaan.',
    responsibilities: [
      'Memiliki strategi lifecycle end-to-end di seluruh kanal (email, push, in-app, SMS)',
      'Mendesain dan menjalankan kampanye dengan dampak terukur',
      'Berkolaborasi dengan Product untuk eksperimen aktivasi dan retensi',
      'Membangun dan mengelola CDP serta tooling marketing automation',
      'Mengelola tim 2–3 marketer lifecycle',
    ],
    requirements: [
      '5+ tahun pengalaman lifecycle/CRM marketing',
      'Track record kampanye berdampak besar (peningkatan retention/LTV terukur)',
      'Kemahiran dengan tools marketing automation (Braze, Iterable, atau setara)',
      'Kemampuan analitis kuat (SQL, BI tools)',
      'Eksekutor yang juga bisa berpikir strategis',
    ],
    niceToHave: [
      'Pengalaman di produk konsumen dengan basis pengguna jutaan',
      'Pengalaman membangun stack marketing dari awal',
      'Latar belakang HR Tech atau pendidikan',
    ],
  },
  {
    slug: 'content-producer',
    title: 'Content Producer (Video)',
    team: 'Marketing',
    location: 'Jakarta',
    type: 'Contract',
    level: 'Mid',
    salaryMin: 12_000_000,
    salaryMax: 18_000_000,
    postedAt: '2 hari lalu',
    summary:
      'Kami sedang membangun lini konten video — testimoni alumni, panduan karier, dan dokumenter pendek tentang dunia kerja Indonesia. Anda akan memproduksi dari konsep sampai edit final, sekitar 4–6 video per bulan.',
    responsibilities: [
      'Mengembangkan konsep video dari brief tim Marketing',
      'Mengelola produksi: storyboard, shoot, edit, sound design',
      'Berkolaborasi dengan freelance crew bila diperlukan',
      'Memastikan output konsisten dengan brand voice RPI',
      'Mengukur performa dan iterasi format',
    ],
    requirements: [
      '3+ tahun pengalaman produksi video (in-house atau agency)',
      'Portfolio yang menunjukkan rentang format (short-form, long-form, doc)',
      'Mahir Premiere/Final Cut/DaVinci + dasar After Effects',
      'Pemahaman cinematography dan storytelling',
      'Self-managed — Anda nyaman mengelola jadwal sendiri',
    ],
    niceToHave: [
      'Pengalaman dengan format TikTok/Reels (mobile-first)',
      'Pernah memproduksi konten dokumenter',
      'Bisa motion graphics',
    ],
  },
  {
    slug: 'support-specialist',
    title: 'Customer Support Specialist',
    team: 'Support',
    location: 'Bandung',
    type: 'Full-time',
    level: 'Junior',
    salaryMin: 6_000_000,
    salaryMax: 9_000_000,
    postedAt: '1 hari lalu',
    summary:
      'Tim Support adalah suara RPI ke pengguna sehari-hari. Anda akan menangani tiket dari pencari kerja dan mitra perekrut — bukan dengan template, tapi dengan empati dan problem-solving asli. Tim ini juga sumber utama insight produk.',
    responsibilities: [
      'Menjawab tiket dari pencari kerja dan mitra (email, chat, telepon)',
      'Eskalasi isu kompleks ke Engineering atau Partner Success',
      'Mendokumentasikan masalah berulang dan mengusulkan perbaikan produk',
      'Berkontribusi pada knowledge base & help center',
      'Bergiliran shift untuk meliputi jam ramai (09:00–22:00 WIB)',
    ],
    requirements: [
      '1+ tahun pengalaman customer support (idealnya digital product)',
      'Komunikasi tertulis dan verbal yang baik dalam Bahasa Indonesia',
      'Empati dan kesabaran — pengguna kami kadang frustrasi',
      'Pemecah masalah yang sistematis (bukan hanya pelarian-template)',
      'Mau belajar tools dan produk yang kompleks',
    ],
    niceToHave: [
      'Penguasaan Bahasa Inggris untuk mitra internasional',
      'Pengalaman dengan tools support (Zendesk, Intercom)',
      'Latar belakang HR atau rekrutmen',
    ],
  },
  {
    slug: 'curriculum-designer',
    title: 'Curriculum Designer',
    team: 'Academy',
    location: 'Remote',
    type: 'Full-time',
    level: 'Mid',
    salaryMin: 14_000_000,
    salaryMax: 22_000_000,
    postedAt: '4 hari lalu',
    summary:
      'Anda akan mendesain jalur belajar RPI Academy — dari modul individual sampai sertifikasi jenjang. Tujuannya bukan "konten lebih banyak"; tujuannya adalah pelajar mendapatkan skill nyata yang membuat mereka dipekerjakan.',
    responsibilities: [
      'Mendesain struktur kurikulum dari modul sampai jalur belajar',
      'Berkolaborasi dengan instruktur eksternal dan industri',
      'Menerjemahkan kompetensi industri menjadi outcome belajar terukur',
      'Mendesain asesmen dan praktek yang membuktikan skill',
      'Mengukur efektivitas dan iterasi kurikulum',
    ],
    requirements: [
      '4+ tahun pengalaman instructional design atau learning design',
      'Pemahaman desain instruksional berbasis bukti (mis. Bloom, ADDIE)',
      'Pengalaman dengan platform LMS modern',
      'Kemampuan menerjemahkan konsep kompleks menjadi langkah jelas',
      'Mindset evidence-based — Anda mengukur outcome, bukan jam belajar',
    ],
    niceToHave: [
      'Latar belakang di bidang yang Anda desain (tech, business, design)',
      'Pengalaman dengan sertifikasi industri (CompTIA, AWS, dll.)',
      'Penguasaan tools seperti Articulate, Camtasia',
    ],
  },
  {
    slug: 'data-analyst',
    title: 'Data Analyst (Marketplace)',
    team: 'Operations',
    location: 'Jakarta / Hybrid',
    type: 'Full-time',
    level: 'Mid',
    salaryMin: 16_000_000,
    salaryMax: 26_000_000,
    postedAt: '6 hari lalu',
    summary:
      'Anda akan menjadi mata data untuk tim marketplace RPI — kesehatan supply/demand, kualitas matching, dan dampak fitur. Pekerjaan Anda bukan dashboard cantik; pekerjaan Anda adalah membuat keputusan bisnis lebih baik.',
    responsibilities: [
      'Mendesain dan menjalankan analisis ad-hoc untuk Product/Ops/Partnership',
      'Membangun dashboard kunci untuk metrik marketplace',
      'Berkolaborasi dengan Data Engineering untuk schema yang sehat',
      'Mempresentasikan insight ke leadership dengan narasi yang tajam',
      'Membantu Product mendesain eksperimen yang dapat diukur',
    ],
    requirements: [
      '3+ tahun pengalaman data analyst di produk konsumen atau marketplace',
      'Kemahiran SQL tingkat lanjut (window functions, CTE, optimization)',
      'Pengalaman dengan tools BI (Metabase, Looker, Tableau)',
      'Pemahaman dasar statistik dan A/B testing',
      'Komunikasi tertulis yang jernih untuk audiens non-teknis',
    ],
    niceToHave: [
      'Pengalaman dengan Python untuk analisis kustom',
      'Pemahaman ML dasar untuk klasifikasi atau scoring',
      'Pernah bekerja di marketplace dua sisi',
    ],
  },
  {
    slug: 'swe-intern',
    title: 'Software Engineer Intern',
    team: 'Engineering',
    location: 'Jakarta / Remote',
    type: 'Internship',
    level: 'Junior',
    salaryMin: 4_500_000,
    salaryMax: 6_500_000,
    postedAt: '2 hari lalu',
    summary:
      'Program magang 6 bulan untuk mahasiswa tingkat akhir atau fresh graduate. Anda akan dipasangkan dengan engineer mentor, mengerjakan proyek nyata yang akan dirilis ke produksi, dan mendapatkan mentoring intensif tentang craftsmanship engineering.',
    responsibilities: [
      'Mengerjakan tiket nyata di salah satu tim engineering (Platform, Web, Mobile)',
      'Bekerja melalui satu proyek end-to-end (desain → ship → measure)',
      'Berpartisipasi dalam code review dan engineering rituals',
      'Menulis dokumentasi dan post-mortem untuk pekerjaan Anda',
      'Mempresentasikan hasil pada akhir program',
    ],
    requirements: [
      'Mahasiswa tingkat akhir atau lulusan dalam 12 bulan terakhir',
      'Pemahaman dasar pemrograman dan satu bahasa modern (JS/TS, Go, Python, dll.)',
      'Pernah membangun proyek pribadi (open-source, course project, freelance)',
      'Rasa ingin tahu yang kuat dan komunikasi tertulis yang baik',
      'Tidak ada syarat IPK',
    ],
    niceToHave: [
      'Kontribusi open-source yang bisa dilihat',
      'Pengalaman dengan satu framework production (React, Next.js, Rails)',
      'Pernah magang sebelumnya di startup',
    ],
  },
]

export type CareerFilters = {
  /** Single-select team name. */
  team?: string
  /** Multi-select employment types. */
  types?: CareerOpening['type'][]
  /** Multi-select experience levels. */
  levels?: CareerOpening['level'][]
  /** Single-select location token (e.g. "Jakarta", "Remote"). */
  location?: string
  /** Free-text query against title, team, location, summary. */
  q?: string
}

/** All teams sorted by opening count (desc). */
export function getCareerTeams(): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const o of CAREER_OPENINGS) {
    counts.set(o.team, (counts.get(o.team) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

const ALL_TYPES: CareerOpening['type'][] = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
]
const ALL_LEVELS: CareerOpening['level'][] = [
  'Junior',
  'Mid',
  'Senior',
  'Staff',
  'Lead',
]

export function getCareerTypes(): {
  value: CareerOpening['type']
  count: number
}[] {
  return ALL_TYPES.map((value) => ({
    value,
    count: CAREER_OPENINGS.filter((o) => o.type === value).length,
  })).filter((x) => x.count > 0)
}

export function getCareerLevels(): {
  value: CareerOpening['level']
  count: number
}[] {
  return ALL_LEVELS.map((value) => ({
    value,
    count: CAREER_OPENINGS.filter((o) => o.level === value).length,
  })).filter((x) => x.count > 0)
}

export function filterOpenings(filters: CareerFilters = {}): CareerOpening[] {
  const q = filters.q?.trim().toLowerCase()
  const types = new Set(filters.types ?? [])
  const levels = new Set(filters.levels ?? [])
  const locTokens = filters.location
    ? filters.location.trim().toLowerCase()
    : ''
  return CAREER_OPENINGS.filter((o) => {
    if (filters.team && o.team !== filters.team) return false
    if (types.size > 0 && !types.has(o.type)) return false
    if (levels.size > 0 && !levels.has(o.level)) return false
    if (locTokens) {
      const tokens = o.location
        .split(/\s*\/\s*/)
        .map((t) => t.trim().toLowerCase())
      if (!tokens.includes(locTokens)) return false
    }
    if (q) {
      const haystack =
        `${o.title} ${o.team} ${o.location} ${o.summary}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function findOpening(slug: string): CareerOpening | undefined {
  return CAREER_OPENINGS.find((o) => o.slug === slug)
}

export function relatedOpenings(slug: string, n = 3): CareerOpening[] {
  const current = findOpening(slug)
  if (!current) return CAREER_OPENINGS.slice(0, n)
  return CAREER_OPENINGS
    .filter((o) => o.slug !== slug)
    .sort((a, b) => {
      const aScore = (a.team === current.team ? 2 : 0) + (a.level === current.level ? 1 : 0)
      const bScore = (b.team === current.team ? 2 : 0) + (b.level === current.level ? 1 : 0)
      return bScore - aScore
    })
    .slice(0, n)
}
